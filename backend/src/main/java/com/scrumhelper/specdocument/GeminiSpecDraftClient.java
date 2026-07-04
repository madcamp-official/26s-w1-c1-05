package com.scrumhelper.specdocument;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class GeminiSpecDraftClient {
	private static final Logger log = LoggerFactory.getLogger(GeminiSpecDraftClient.class);

	private final ObjectMapper objectMapper;
	private final HttpClient httpClient;
	private final String apiKey;
	private final String model;
	private final List<String> modelCandidates;
	private final String baseUrl;

	public GeminiSpecDraftClient(
			ObjectMapper objectMapper,
			@Value("${app.gemini.api-key:}") String apiKey,
			@Value("${app.gemini.model:gemini-2.5-flash}") String model,
			@Value("${app.gemini.fallback-models:gemini-2.5-flash,gemini-2.0-flash}") String fallbackModels,
			@Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl
	) {
		this.objectMapper = objectMapper;
		this.apiKey = apiKey;
		this.model = model;
		this.modelCandidates = buildModelCandidates(model, fallbackModels);
		this.baseUrl = normalizeBaseUrl(baseUrl);
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(5))
				.build();
	}

	@PostConstruct
	void logConfiguration() {
		log.info(
				"Gemini client configured. model={}, fallbackModels={}, apiKeyConfigured={}",
				model,
				modelCandidates.stream().filter(candidate -> !candidate.equals(model)).toList(),
				apiKey != null && !apiKey.isBlank()
		);
	}

	public Optional<String> generate(String prompt) {
		return generate(prompt, null);
	}

	public Optional<String> generateJson(String prompt) {
		return generate(prompt, "application/json");
	}

	private Optional<String> generate(String prompt, String responseMimeType) {
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

		for (String candidateModel : modelCandidates) {
			Optional<String> generated = generateWithModel(body, candidateModel);
			if (generated.isPresent()) {
				if (!candidateModel.equals(model)) {
					log.info("Gemini API request succeeded with fallback model={}", candidateModel);
				}
				return generated;
			}
		}

		return Optional.empty();
	}

	private Optional<String> generateWithModel(String body, String candidateModel) {
		try {
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(buildEndpoint(candidateModel)))
					.timeout(Duration.ofSeconds(20))
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
				return Optional.empty();
			}

			JsonNode root = objectMapper.readTree(response.body());
			JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
			if (!textNode.isTextual() || textNode.asText().isBlank()) {
				log.warn("Gemini API response did not include text content. model={}, body={}", candidateModel, truncateForLog(response.body()));
				return Optional.empty();
			}
			return Optional.of(textNode.asText().trim());
		} catch (Exception exception) {
			log.warn("Gemini API request failed before receiving a usable response. model={}", candidateModel, exception);
			return Optional.empty();
		}
	}

	private String buildEndpoint(String candidateModel) {
		String encodedModel = URLEncoder.encode(candidateModel, StandardCharsets.UTF_8);
		return baseUrl + "/models/" + encodedModel + ":generateContent";
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
}
