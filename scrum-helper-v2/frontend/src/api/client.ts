import { clearStoredToken, getStoredToken } from '../auth/authStorage';
import { ApiError, type ApiEnvelope } from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;
};

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const url = buildUrl(path, options.query);
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  if (options.auth !== false) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }).catch(() => {
    throw new ApiError('서버에 연결할 수 없습니다.', 'NETWORK_ERROR', 0);
  });

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || envelope?.success === false) {
    if (response.status === 401 && options.auth !== false) {
      clearStoredToken();
    }

    const message =
      envelope?.success === false
        ? envelope.error.message
        : '요청 처리 중 오류가 발생했습니다.';
    const code = envelope?.success === false ? envelope.error.code : 'HTTP_ERROR';
    throw new ApiError(message, code, response.status);
  }

  if (!envelope || envelope.success !== true) {
    throw new ApiError('응답 형식이 올바르지 않습니다.', 'INVALID_RESPONSE', response.status);
  }

  return envelope.data;
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}
