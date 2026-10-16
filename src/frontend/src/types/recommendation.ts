import { z } from 'zod';
import { TrafficStateSchema } from './place';

export const FoggOriginPlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  current_occupancy: z.number(),
  max_capacity: z.number(),
  occupancy_percentage: z.number(),
  traffic_state: TrafficStateSchema,
});

export const FoggRecommendedPlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  district: z.string(),
  category: z.string(),
  current_occupancy: z.number(),
  max_capacity: z.number(),
  occupancy_percentage: z.number(),
  traffic_state: TrafficStateSchema,
  available_capacity: z.number(),
});

export const FoggModelDetailsSchema = z.object({
  fogg_score: z.number(),
  trigger_priority: z.enum(['ALTO', 'MEDIO', 'BAJO']).or(z.string()),
  motivation: z.string(),
  ability: z.string(),
  trigger: z.string(),
  motivation_short: z.string().optional(),
  ability_short: z.string().optional(),
  trigger_short: z.string().optional(),
  distance_km: z.number(),
  estimated_transit_minutes: z.number(),
  cta_button: z.string(),
});

export const FoggRecommendationItemSchema = z.object({
  origin_place: FoggOriginPlaceSchema,
  recommended_place: FoggRecommendedPlaceSchema,
  fogg_model: FoggModelDetailsSchema,
});

export type FoggRecommendationItem = z.infer<typeof FoggRecommendationItemSchema>;

export const FoggRecommendationsResponseSchema = z.object({
  count: z.number(),
  model_applied: z.string(),
  results: z.array(FoggRecommendationItemSchema),
});

export type FoggRecommendationsResponse = z.infer<typeof FoggRecommendationsResponseSchema>;
