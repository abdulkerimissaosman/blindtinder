const DEFAULT_BASE_URL = 'http://localhost:3000';

export function isBackendConfigured() {
  return Boolean(process.env.EXPO_PUBLIC_API_BASE_URL?.trim());
}

export function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string | null;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message || payload?.error || 'Request failed';

    throw new Error(message);
  }

  return payload as T;
}