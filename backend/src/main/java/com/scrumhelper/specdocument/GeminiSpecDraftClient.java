package com.scrumhelper.specdocument;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class GeminiSpecDraftClient {
	private static final Logger log = LoggerFactory.getLogger(GeminiSpecDraftClient.class);

	private final ObjectMapper objectMapper;
	private final HttpClient httpClient;
	private final String apiKey;
	private final String model;
	private final List<String> modelCandidates;
	private final String baseUrl;
	private final String uploadBaseUrl;
	private final boolean cacheEnabled;
	private final Duration cacheTtl;
	private final Duration requestTimeout;
	private final int maxCacheEntries;
	private final ConcurrentMap<String, CacheEntry> generationCache = new ConcurrentHashMap<>();

	@Autowired
	public GeminiSpecDraftClient(
			ObjectMapper objectMapper,
			@Value("${app.gemini.api-key:}") String apiKey,
			@Value("${app.gemini.model:gemini-2.5-flash}") String model,
			@Value("${app.gemini.fallback-models:gemini-2.5-flash,gemini-2.0-flash}") String fallbackModels,
			@Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
			@Value("${app.gemini.upload-base-url:https://generativelanguage.googleapis.com/upload/v1beta}") String uploadBaseUrl,
			@Value("${app.gemini.cache-enabled:true}") boolean cacheEnabled,
			@Value("${app.gemini.cache-ttl-minutes:30}") long cacheTtlMinutes,
			@Value("${app.gemini.request-timeout-seconds:45}") long requestTimeoutSeconds,
			@Value("${app.gemini.max-cache-entries:200}") int maxCacheEntries
	) {
		this.objectMapper = objectMapper;
		this.apiKey = apiKey == null ? "" : apiKey.trim();
		this.model = model;
		this.modelCandidates = buildModelCandidates(model, fallbackModels);
		this.baseUrl = normalizeBaseUrl(baseUrl);
		this.uploadBaseUrl = normalizeBaseUrl(uploadBaseUrl);
		this.cacheEnabled = cacheEnabled;
		this.cacheTtl = Duration.ofMinutes(Math.max(1, cacheTtlMinutes));
		this.requestTimeout = Duration.ofSeconds(Math.max(5, requestTimeoutSeconds));
		this.maxCacheEntries = Math.max(0, maxCacheEntries);
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(5))
				.build();
	}

	GeminiSpecDraftClient(
			ObjectMapper objectMapper,
			String apiKey,
			String model,
			String fallbackModels,
			String baseUrl,
			String uploadBaseUrl
	) {
		this(objectMapper, apiKey, model, fallbackModels, baseUrl, uploadBaseUrl, true, 30, 45, 200);
	}

	@PostConstruct
	void logConfiguration() {
		log.info(
				"Gemini client configured. model={}, fallbackModels={}, apiKeyConfigured={}, cacheEnabled={}, cacheTtlMinutes={}, requestTimeoutSeconds={}, maxCacheEntries={}",
				model,
				modelCandidates.stream().filter(candidate -> !candidate.equals(model)).toList(),
				apiKey != null && !apiKey.isBlank(),
				cacheEnabled,
				cacheTtl.toMinutes(),
				requestTimeout.toSeconds(),
				maxCacheEntries
		);
	}

	public Optional<String> generate(String prompt) {
		return generate(prompt, null, false);
	}

	public Optional<String> generateFresh(String prompt) {
		return generate(prompt, null, true);
	}

	public Optional<String> generateJson(String prompt) {
		return generate(prompt, "application/json", false);
	}

	public Optional<String> transcribeAudio(String prompt, byte[] audioBytes, String mimeType, String displayName) {
		if (apiKey == null || apiKey.isBlank()) {
			log.info("Gemini API key is not configured. Falling back to local audio transcription.");
			return Optional.empty();
		}
		if (audioBytes == null || audioBytes.length == 0) {
			log.warn("Gemini audio transcription requested with empty audio bytes.");
			return Optional.empty();
		}

		return uploadFile(audioBytes, mimeType, displayName)
				.flatMap(uploadedFile -> generateWithFile(prompt, uploadedFile, mimeType));
	}

	private Optional<String> generate(String prompt, String responseMimeType, boolean bypassCache) {
		if (apiKey == null || apiKey.isBlank()) {
			log.info("Gemini API key is not configured. Falling back to local generation.");
			return Optional.empty();
		}

		String body;
		try {
			Map<String, Object> requestBody = new LinkedHashMap<>();
			requestBody.put(
				"contents",
				Lists.of(Map.of(
					"parts",
					Lists.of(Map.of("text", prompt))
				))
			);
			if (responseMimeType != null && !responseMimeType.isBlank()) {
				requestBody.put("generationConfig", Map.of("responseMimeType", responseMimeType));
			}
			body = objectMapper.writeValueAsString(requestBody);
		} catch (Exception exception) {
			log.warn("Gemini request body serialization failed.", exception);
			return Optional.empty();
		}

		if (!bypassCache) {
			Optional<Optional<String>> cached = readGenerationCache(body, responseMimeType);
			if (cached.isPresent()) {
				return cached.get();
			}
		}

		for (String candidateModel : modelCandidates) {
			GeminiCallResult result = generateWithModel(body, candidateModel);
			if (result.text().isPresent()) {
				if (!candidateModel.equals(model)) {
					log.info("Gemini API request succeeded with fallback model={}", candidateModel);
				}
				writeGenerationCache(body, responseMimeType, result.text());
				return result.text();
			}
			if (!result.retryNextModel()) {
				break;
			}
		}

		return Optional.empty();
	}

	private Optional<String> generateWithFile(String prompt, UploadedFile uploadedFile, String mimeType) {
		String body;
		try {
			Map<String, Object> requestBody = new LinkedHashMap<>();
			requestBody.put(
				"contents",
				Lists.of(Map.of(
					"parts",
					Lists.of(
						Map.of("text", prompt),
						Map.of("file_data", Map.of(
								"mime_type", mimeType,
								"file_uri", uploadedFile.uri()
						))
					)
				))
			);
			body = objectMapper.writeValueAsString(requestBody);
		} catch (Exception exception) {
			log.warn("Gemini file request body serialization failed.", exception);
			return Optional.empty();
		}

		for (String candidateModel : modelCandidates) {
			GeminiCallResult result = generateWithModel(body, candidateModel);
			if (result.text().isPresent()) {
				if (!candidateModel.equals(model)) {
					log.info("Gemini file request succeeded with fallback model={}", candidateModel);
				}
				return result.text();
			}
			if (!result.retryNextModel()) {
				break;
			}
		}
		return Optional.empty();
	}

	private GeminiCallResult generateWithModel(String body, String candidateModel) {
		try {
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(buildEndpoint(candidateModel)))
					.timeout(requestTimeout)
					.header("Content-Type", "application/json")
					.header("x-goog-api-key", apiKey)
					.POST(HttpRequest.BodyPublishers.ofString(body))
					.build();
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				log.warn(
						"Gemini API request failed. status={}, model={}, body={}",
						response.statusCode(),
						candidateModel,
						truncateForLog(response.body())
				);
				return GeminiCallResult.failure(shouldTryNextModel(response.statusCode()));
			}

			JsonNode root = objectMapper.readTree(response.body());
			JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
			if (!textNode.isTextual() || textNode.asText().isBlank()) {
				log.warn("Gemini API response did not include text content. model={}, body={}", candidateModel, truncateForLog(response.body()));
				return GeminiCallResult.failure(false);
			}
			return GeminiCallResult.success(textNode.asText().trim());
		} catch (HttpTimeoutException exception) {
			log.warn("Gemini API request timed out. model={}, timeoutSeconds={}", candidateModel, requestTimeout.toSeconds());
			return GeminiCallResult.failure(true);
		} catch (Exception exception) {
			log.warn("Gemini API request failed before receiving a usable response. model={}", candidateModel, exception);
			return GeminiCallResult.failure(false);
		}
	}

	private boolean shouldTryNextModel(int statusCode) {
		return statusCode == 404 || statusCode == 503 || statusCode == 504;
	}

	private Optional<UploadedFile> uploadFile(byte[] fileBytes, String mimeType, String displayName) {
		try {
			String startBody = objectMapper.writeValueAsString(Map.of(
					"file",
					Map.of("display_name", displayName == null || displayName.isBlank() ? "AUDIO" : displayName)
			));
			HttpRequest startRequest = HttpRequest.newBuilder()
					.uri(URI.create(uploadBaseUrl + "/files"))
					.timeout(Duration.ofSeconds(20))
					.header("Content-Type", "application/json")
					.header("x-goog-api-key", apiKey)
					.header("X-Goog-Upload-Protocol", "resumable")
					.header("X-Goog-Upload-Command", "start")
					.header("X-Goog-Upload-Header-Content-Length", String.valueOf(fileBytes.length))
					.header("X-Goog-Upload-Header-Content-Type", mimeType)
					.POST(HttpRequest.BodyPublishers.ofString(startBody))
					.build();
			HttpResponse<String> startResponse = httpClient.send(startRequest, HttpResponse.BodyHandlers.ofString());
			if (startResponse.statusCode() < 200 || startResponse.statusCode() >= 300) {
				log.warn(
						"Gemini file upload start failed. status={}, body={}",
						startResponse.statusCode(),
						truncateForLog(startResponse.body())
				);
				return Optional.empty();
			}

			Optional<String> uploadUrl = startResponse.headers().firstValue("x-goog-upload-url");
			if (uploadUrl.isEmpty()) {
				log.warn("Gemini file upload start did not return x-goog-upload-url.");
				return Optional.empty();
			}

			HttpRequest uploadRequest = HttpRequest.newBuilder()
					.uri(URI.create(uploadUrl.get()))
					.timeout(Duration.ofSeconds(60))
					.header("X-Goog-Upload-Offset", "0")
					.header("X-Goog-Upload-Command", "upload, finalize")
					.POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
					.build();
			HttpResponse<String> uploadResponse = httpClient.send(uploadRequest, HttpResponse.BodyHandlers.ofString());
			if (uploadResponse.statusCode() < 200 || uploadResponse.statusCode() >= 300) {
				log.warn(
						"Gemini file upload finalize failed. status={}, body={}",
						uploadResponse.statusCode(),
						truncateForLog(uploadResponse.body())
				);
				return Optional.empty();
			}

			JsonNode fileNode = objectMapper.readTree(uploadResponse.body()).path("file");
			String uri = fileNode.path("uri").asText("");
			String name = fileNode.path("name").asText("");
			if (uri.isBlank()) {
				log.warn("Gemini file upload finalize response did not include file.uri. body={}", truncateForLog(uploadResponse.body()));
				return Optional.empty();
			}
			return Optional.of(new UploadedFile(uri, name));
		} catch (Exception exception) {
			log.warn("Gemini file upload failed before receiving a usable response.", exception);
			return Optional.empty();
		}
	}

	private String buildEndpoint(String candidateModel) {
		String encodedModel = URLEncoder.encode(candidateModel, StandardCharsets.UTF_8);
		return baseUrl + "/models/" + encodedModel + ":generateContent";
	}

	private Optional<Optional<String>> readGenerationCache(String body, String responseMimeType) {
		if (!isGenerationCacheUsable()) {
			return Optional.empty();
		}
		String key = buildCacheKey(body, responseMimeType);
		CacheEntry entry = generationCache.get(key);
		if (entry == null) {
			return Optional.empty();
		}
		if (entry.expiresAt().isBefore(Instant.now())) {
			generationCache.remove(key, entry);
			return Optional.empty();
		}
		return Optional.of(entry.response());
	}

	private void writeGenerationCache(String body, String responseMimeType, Optional<String> response) {
		if (!isGenerationCacheUsable()) {
			return;
		}
		Instant now = Instant.now();
		if (generationCache.size() >= maxCacheEntries) {
			evictOneCacheEntry(now);
		}
		generationCache.put(
				buildCacheKey(body, responseMimeType),
				new CacheEntry(response, now.plus(cacheTtl))
		);
	}

	private void evictOneCacheEntry(Instant now) {
		for (Map.Entry<String, CacheEntry> entry : generationCache.entrySet()) {
			if (entry.getValue().expiresAt().isBefore(now)) {
				generationCache.remove(entry.getKey(), entry.getValue());
				return;
			}
		}
		generationCache.keySet().stream().findFirst().ifPresent(generationCache::remove);
	}

	private boolean isGenerationCacheUsable() {
		return cacheEnabled && maxCacheEntries > 0;
	}

	private String buildCacheKey(String body, String responseMimeType) {
		String rawKey = String.join(
				"\n",
				model,
				String.join(",", modelCandidates),
				responseMimeType == null ? "" : responseMimeType,
				body
		);
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawKey.getBytes(StandardCharsets.UTF_8));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
		} catch (Exception ignored) {
			return Integer.toHexString(rawKey.hashCode());
		}
	}

	private List<String> buildModelCandidates(String primaryModel, String fallbackModels) {
		LinkedHashSet<String> candidates = new LinkedHashSet<>();
		addModelCandidate(candidates, primaryModel);
		if (fallbackModels != null) {
			for (String fallbackModel : fallbackModels.split(",")) {
				addModelCandidate(candidates, fallbackModel);
			}
		}
		return new ArrayList<>(candidates);
	}

	private void addModelCandidate(LinkedHashSet<String> candidates, String candidate) {
		if (candidate != null && !candidate.isBlank()) {
			candidates.add(candidate.trim());
		}
	}

	private String truncateForLog(String value) {
		if (value == null || value.length() <= 500) {
			return value;
		}
		return value.substring(0, 500) + "...";
	}

	private String normalizeBaseUrl(String value) {
		String normalized = value == null || value.isBlank()
				? "https://generativelanguage.googleapis.com/v1beta"
				: value.trim();
		while (normalized.endsWith("/")) {
			normalized = normalized.substring(0, normalized.length() - 1);
		}
		return normalized;
	}

	private static class Lists {
		@SafeVarargs
		static <T> java.util.List<T> of(T... values) {
			return java.util.List.of(values);
		}
	}

	private record GeminiCallResult(Optional<String> text, boolean retryNextModel) {
		static GeminiCallResult success(String text) {
			return new GeminiCallResult(Optional.of(text), false);
		}

		static GeminiCallResult failure(boolean retryNextModel) {
			return new GeminiCallResult(Optional.empty(), retryNextModel);
		}
	}

	private record CacheEntry(Optional<String> response, Instant expiresAt) {
	}

	private record UploadedFile(String uri, String name) {
	}
}
