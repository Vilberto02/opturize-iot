import { z } from 'zod';

export const HealthCheckResponseSchema = z.object({
  status: z.string(),
  system: z.string(),
  institution: z.string(),
  database: z.string(),
  mqtt_broker: z.string(),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
