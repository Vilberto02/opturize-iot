import { z } from 'zod';

export const TrafficStateSchema = z.enum(['VERDE', 'AMARILLO', 'ROJO']);
export type TrafficState = z.infer<typeof TrafficStateSchema>;

export const TouristPlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  department: z.string(),
  province: z.string(),
  district: z.string(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  device_id: z.string().nullable().optional(),
  max_capacity: z.number().nonnegative(),
  warning_threshold_pct: z.number(),
  current_occupancy: z.number().nonnegative(),
  occupancy_percentage: z.number(),
  traffic_state: TrafficStateSchema,
  barrier_open: z.boolean(),
  current_temperature: z.number().nullable().optional(),
  current_humidity: z.number().nullable().optional(),
  is_alternative_destination: z.boolean(),
  description: z.string().optional(),
  fogg_motivation_text: z.string().optional(),
  average_visit_duration_min: z.number(),
  is_saturated: z.boolean(),
  last_telemetry_at: z.string().nullable().optional(),
});

export type TouristPlace = z.infer<typeof TouristPlaceSchema>;

export const PlacesPaginatedResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable().optional(),
  previous: z.string().nullable().optional(),
  results: z.array(TouristPlaceSchema),
});

export type PlacesPaginatedResponse = z.infer<typeof PlacesPaginatedResponseSchema>;

export const TelemetryLogSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  device_id: z.string(),
  occupancy: z.number(),
  max_capacity: z.number(),
  occupancy_pct: z.number(),
  traffic_state: TrafficStateSchema,
  barrier_open: z.boolean(),
  temperature: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
});

export type TelemetryLog = z.infer<typeof TelemetryLogSchema>;

export const CrowdAlertSchema = z.object({
  id: z.number(),
  place: z.number(),
  place_name: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  title: z.string(),
  message: z.string(),
  occupancy_at_event: z.number(),
  resolved: z.boolean(),
  created_at: z.string(),
});

export type CrowdAlert = z.infer<typeof CrowdAlertSchema>;
