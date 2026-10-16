import { apiFetch } from './client';
import {
  FoggRecommendationsResponseSchema,
  type FoggRecommendationItem,
} from '@/types';

export async function getRecommendations(originId?: number): Promise<FoggRecommendationItem[]> {
  const query = originId ? `?origin_id=${originId}` : '';
  const response = await apiFetch(`/recommendations/${query}`, FoggRecommendationsResponseSchema);
  return response.results;
}
