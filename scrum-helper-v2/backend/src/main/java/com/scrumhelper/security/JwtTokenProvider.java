package com.scrumhelper.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class JwtTokenProvider {
	private static final String HMAC_ALGORITHM = "HmacSHA256";
	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
	};

	private final ObjectMapper objectMapper;
	private final byte[] secret;
	private final long expirationMillis;

	public JwtTokenProvider(
			ObjectMapper objectMapper,
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-millis}") long expirationMillis
	) {
		this.objectMapper = objectMapper;
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
		this.expirationMillis = expirationMillis;
	}

	public String createToken(Long userId) {
		Instant now = Instant.now();
		Map<String, Object> header = new LinkedHashMap<>();
		header.put("alg", "HS256");
		header.put("typ", "JWT");

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("sub", String.valueOf(userId));
		payload.put("iat", now.getEpochSecond());
		payload.put("exp", now.plusMillis(expirationMillis).getEpochSecond());

		String unsignedToken = encodeJson(header) + "." + encodeJson(payload);
		return unsignedToken + "." + sign(unsignedToken);
	}

	public Optional<Long> parseUserId(String token) {
		try {
			String[] parts = token.split("\\.");
			if (parts.length != 3) {
				return Optional.empty();
			}
			String unsignedToken = parts[0] + "." + parts[1];
			if (!MessageDigest.isEqual(sign(unsignedToken).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
				return Optional.empty();
			}

			Map<String, Object> payload = decodeJson(parts[1]);
			Number exp = (Number) payload.get("exp");
			if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
				return Optional.empty();
			}
			return Optional.of(Long.valueOf(String.valueOf(payload.get("sub"))));
		} catch (RuntimeException exception) {
			return Optional.empty();
		}
	}

	private String encodeJson(Map<String, Object> value) {
		try {
			return Base64.getUrlEncoder()
					.withoutPadding()
					.encodeToString(objectMapper.writeValueAsBytes(value));
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to encode JWT JSON", exception);
		}
	}

	private Map<String, Object> decodeJson(String value) {
		try {
			byte[] bytes = Base64.getUrlDecoder().decode(value);
			return objectMapper.readValue(bytes, MAP_TYPE);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to decode JWT JSON", exception);
		}
	}

	private String sign(String value) {
		try {
			Mac mac = Mac.getInstance(HMAC_ALGORITHM);
			mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
			byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to sign JWT", exception);
		}
	}
}
