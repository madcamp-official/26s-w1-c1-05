package com.scrumhelper.specdocument;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiSpecDraftClientTests {
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void retriesFallbackModelAndSendsApiKeyHeader() throws Exception {
		List<String> paths = Collections.synchronizedList(new ArrayList<>());
		List<String> apiKeys = Collections.synchronizedList(new ArrayList<>());
		HttpServer server = startServer(exchange -> {
			paths.add(exchange.getRequestURI().getPath());
			apiKeys.add(exchange.getRequestHeaders().getFirst("x-goog-api-key"));

			if (exchange.getRequestURI().getPath().contains("gemini-1.5-flash")) {
				send(exchange, 404, "{\"error\":{\"message\":\"model not found\"}}");
				return;
			}
			send(exchange, 200, """
					{"candidates":[{"content":{"parts":[{"text":"fallback success"}]}}]}
					""");
		});

		try {
			GeminiSpecDraftClient client = new GeminiSpecDraftClient(
					objectMapper,
					"test-key",
					"gemini-1.5-flash",
					"gemini-2.5-flash",
					baseUrl(server),
					baseUrl(server)
			);

			Optional<String> result = client.generate("스펙 문서 초안을 작성해줘.");

			assertThat(result).contains("fallback success");
			assertThat(paths).containsExactly(
					"/models/gemini-1.5-flash:generateContent",
					"/models/gemini-2.5-flash:generateContent"
			);
			assertThat(apiKeys).containsExactly("test-key", "test-key");
		} finally {
			server.stop(0);
		}
	}

	@Test
	void generateJsonRequestsJsonResponseMimeType() throws Exception {
		AtomicReference<String> requestBody = new AtomicReference<>();
		HttpServer server = startServer(exchange -> {
			requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			send(exchange, 200, """
					{"candidates":[{"content":{"parts":[{"text":"[{\\"title\\":\\"API 테스트\\"}]"}]}}]}
					""");
		});

		try {
			GeminiSpecDraftClient client = new GeminiSpecDraftClient(
					objectMapper,
					"test-key",
					"gemini-2.5-flash",
					"",
					baseUrl(server),
					baseUrl(server)
			);

			Optional<String> result = client.generateJson("JSON 배열만 반환해줘.");

			assertThat(result).contains("[{\"title\":\"API 테스트\"}]");
			assertThat(requestBody.get()).contains("\"generationConfig\"");
			assertThat(requestBody.get()).contains("\"responseMimeType\":\"application/json\"");
		} finally {
			server.stop(0);
		}
	}

	@Test
	void cachesIdenticalTextGenerationRequests() throws Exception {
		AtomicInteger requestCount = new AtomicInteger();
		HttpServer server = startServer(exchange -> {
			requestCount.incrementAndGet();
			send(exchange, 200, """
					{"candidates":[{"content":{"parts":[{"text":"cached success"}]}}]}
					""");
		});

		try {
			GeminiSpecDraftClient client = new GeminiSpecDraftClient(
					objectMapper,
					"test-key",
					"gemini-2.5-flash",
					"",
					baseUrl(server),
					baseUrl(server)
			);

			Optional<String> first = client.generate("같은 프롬프트");
			Optional<String> second = client.generate("같은 프롬프트");

			assertThat(first).contains("cached success");
			assertThat(second).contains("cached success");
			assertThat(requestCount.get()).isEqualTo(1);
		} finally {
			server.stop(0);
		}
	}

	@Test
	void doesNotCacheFailedGenerationRequests() throws Exception {
		AtomicInteger requestCount = new AtomicInteger();
		HttpServer server = startServer(exchange -> {
			int count = requestCount.incrementAndGet();
			if (count == 1) {
				send(exchange, 500, "{\"error\":{\"message\":\"temporary failure\"}}");
				return;
			}
			send(exchange, 200, """
					{"candidates":[{"content":{"parts":[{"text":"second attempt success"}]}}]}
					""");
		});

		try {
			GeminiSpecDraftClient client = new GeminiSpecDraftClient(
					objectMapper,
					"test-key",
					"gemini-2.5-flash",
					"",
					baseUrl(server),
					baseUrl(server)
			);

			Optional<String> first = client.generate("일시 실패 후 같은 프롬프트");
			Optional<String> second = client.generate("일시 실패 후 같은 프롬프트");

			assertThat(first).isEmpty();
			assertThat(second).contains("second attempt success");
			assertThat(requestCount.get()).isEqualTo(2);
		} finally {
			server.stop(0);
		}
	}

	@Test
	void doesNotRetryFallbackModelForAuthorizationFailure() throws Exception {
		List<String> paths = Collections.synchronizedList(new ArrayList<>());
		HttpServer server = startServer(exchange -> {
			paths.add(exchange.getRequestURI().getPath());
			send(exchange, 401, "{\"error\":{\"message\":\"invalid api key\"}}");
		});

		try {
			GeminiSpecDraftClient client = new GeminiSpecDraftClient(
					objectMapper,
					"test-key",
					"gemini-2.5-flash",
					"gemini-2.0-flash",
					baseUrl(server),
					baseUrl(server)
			);

			Optional<String> result = client.generate("인증 실패 테스트");

			assertThat(result).isEmpty();
			assertThat(paths).containsExactly("/models/gemini-2.5-flash:generateContent");
		} finally {
			server.stop(0);
		}
	}

	@Test
	void transcribeAudioUploadsFileAndUsesFileUriInGenerateContent() throws Exception {
		List<String> paths = Collections.synchronizedList(new ArrayList<>());
		List<String> uploadCommands = Collections.synchronizedList(new ArrayList<>());
		AtomicReference<String> generateBody = new AtomicReference<>();
		HttpServer server = startServer(exchange -> {
			paths.add(exchange.getRequestURI().getPath());
			String uploadCommand = exchange.getRequestHeaders().getFirst("X-Goog-Upload-Command");
			if (uploadCommand != null) {
				uploadCommands.add(uploadCommand);
			}

			if (exchange.getRequestURI().getPath().equals("/files")) {
				exchange.getRequestBody().readAllBytes();
				exchange.getResponseHeaders().add(
						"x-goog-upload-url",
						"http://127.0.0.1:" + exchange.getLocalAddress().getPort() + "/upload-session"
				);
				send(exchange, 200, "{}");
				return;
			}
			if (exchange.getRequestURI().getPath().equals("/upload-session")) {
				byte[] bytes = exchange.getRequestBody().readAllBytes();
				assertThat(bytes).containsExactly((byte) 1, (byte) 2, (byte) 3);
				send(exchange, 200, """
						{"file":{"uri":"gemini://uploaded/audio","name":"files/audio"}}
						""");
				return;
			}

			generateBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			send(exchange, 200, """
					{"candidates":[{"content":{"parts":[{"text":"Speaker 1: 테스트 회의입니다."}]}}]}
					""");
		});

		try {
			GeminiSpecDraftClient client = new GeminiSpecDraftClient(
					objectMapper,
					"test-key",
					"gemini-2.5-flash",
					"",
					baseUrl(server),
					baseUrl(server)
			);

			Optional<String> result = client.transcribeAudio(
					"회의 녹음을 script로 변환해줘.",
					new byte[] {1, 2, 3},
					"audio/mpeg",
					"meeting.mp3"
			);

			assertThat(result).contains("Speaker 1: 테스트 회의입니다.");
			assertThat(paths).containsExactly(
					"/files",
					"/upload-session",
					"/models/gemini-2.5-flash:generateContent"
			);
			assertThat(uploadCommands).containsExactly("start", "upload, finalize");
			assertThat(generateBody.get()).contains("\"file_uri\":\"gemini://uploaded/audio\"");
			assertThat(generateBody.get()).contains("\"mime_type\":\"audio/mpeg\"");
		} finally {
			server.stop(0);
		}
	}

	private HttpServer startServer(ExchangeHandler handler) throws Exception {
		HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", exchange -> {
			try {
				handler.handle(exchange);
			} catch (Exception exception) {
				throw new RuntimeException(exception);
			}
		});
		server.start();
		return server;
	}

	private String baseUrl(HttpServer server) {
		return "http://127.0.0.1:" + server.getAddress().getPort();
	}

	private void send(HttpExchange exchange, int status, String body) throws Exception {
		byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
		exchange.getResponseHeaders().add("Content-Type", "application/json");
		exchange.sendResponseHeaders(status, bytes.length);
		exchange.getResponseBody().write(bytes);
		exchange.close();
	}

	@FunctionalInterface
	private interface ExchangeHandler {
		void handle(HttpExchange exchange) throws Exception;
	}
}
