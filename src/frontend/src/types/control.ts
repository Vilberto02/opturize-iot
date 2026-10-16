import { z } from 'zod';

export const DeviceControlPayloadSchema = z.object({
  comando: z.enum(['reset_aforo', 'set_capacidad', 'forzar_barrera']),
  valor: z.number().int().positive().optional(),
  abrir: z.boolean().optional(),
});

export type DeviceControlPayload = z.infer<typeof DeviceControlPayloadSchema>;

export const DeviceControlResponseSchema = z.object({
  status: z.string(),
  device_id: z.string(),
  topic: z.string(),
  payload: z.record(z.any()),
});

export type DeviceControlResponse = z.infer<typeof DeviceControlResponseSchema>;
