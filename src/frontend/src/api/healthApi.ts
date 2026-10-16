import { apiFetch } from './client';
import { HealthCheckResponseSchema, type HealthCheckResponse } from '@/types';

export async function getHealth(): Promise<HealthCheckResponse> {
  return apiFetch('/health/', HealthCheckResponseSchema);
}
