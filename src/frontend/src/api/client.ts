import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Cliente HTTP basado en fetch nativo con validación estricta Zod en tiempo de ejecución.
 */
export async function apiFetch<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (options?.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      `Error HTTP ${response.status}: ${response.statusText} en ${endpoint}`,
      response.status,
      errorData
    );
  }

  const rawJson = await response.json();

  const parseResult = schema.safeParse(rawJson);
  if (!parseResult.success) {
    console.error(`[Zod Error en ${endpoint}]:`, parseResult.error.format());
    console.error('Datos recibidos del servidor:', rawJson);
    throw new Error(`Validación de esquema Zod falló para ${endpoint}: ${parseResult.error.message}`);
  }

  return parseResult.data;
}
