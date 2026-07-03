package com.scrumhelper.specdocument;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@Component
public class GeminiSpecDraftClient {
	private final ObjectMapper objectMapper;
	private final HttpClient httpClient;
	private final String apiKey;
	private final String model;

	public GeminiSpecDraftClient(
			ObjectMapper objectMapper,
			@Value("${app.gemini.api-key:}") String apiKey,
			@Value("${app.gemini.model:gemini-1.5-flash}") String model
	) {
		this.objectMapper = objectMapper;
		this.apiKey = apiKey;
		this.model = model;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(5))
				.build();
	}

	public Optional<String> generate(String prompt) {
		if (apiKey == null || apiKey.isBlank()) {
			return Optional.empty();
		}

		try {
			String body = objectMapper.writeValueAsString(Map.of(
					"contents",
					Lists.of(Map.of(
							"parts",
							Lists.of(Map.of("text", prompt))
					))
			));
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(buildEndpoint()))
					.timeout(Duration.ofSeconds(20))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(body))
					.build();
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				return Optional.empty();
			}

			JsonNode root = objectMapper.readTree(response.body());
			JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
			if (!textNode.isTextual() || textNode.asText().isBlank()) {
				return Optional.empty();
			}
			return Optional.of(textNode.asText().trim());
		} catch (Exception ignored) {
			return Optional.empty();
		}
	}

	private String buildEndpoint() {
		String encodedModel = URLEncoder.encode(model, StandardCharsets.UTF_8);
		String encodedKey = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
		return "https://generativelanguage.googleapis.com/v1beta/models/" + encodedModel
				+ ":generateContent?key=" + encodedKey;
	}

	private static class Lists {
		@SafeVarargs
		static <T> java.util.List<T> of(T... values) {
			return java.util.List.of(values);
		}
	}
}
