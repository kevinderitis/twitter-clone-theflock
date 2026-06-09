export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: string[];
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL;

  if (!baseUrl) {
    throw new Error('VITE_API_URL is not configured.');
  }

  return baseUrl;
};

export const apiRequest = async <TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const payload = isJson
    ? ((await response.json()) as TResponse | ApiErrorPayload)
    : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | undefined;

    throw new ApiError(
      errorPayload?.error?.message ?? 'Request failed.',
      response.status,
      errorPayload?.error?.code,
      errorPayload?.error?.details,
    );
  }

  return payload as TResponse;
};
