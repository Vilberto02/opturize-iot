import { z } from 'zod';
import { apiFetch } from './client';
import {
  PlacesPaginatedResponseSchema,
  TouristPlaceSchema,
  TelemetryLogSchema,
  DeviceControlResponseSchema,
  type TouristPlace,
  type TelemetryLog,
  type DeviceControlPayload,
  type DeviceControlResponse,
} from '@/types';

export interface PlacesFilterParams {
  district?: string;
  traffic_state?: string;
  is_alternative?: boolean;
}

export async function getPlaces(params?: PlacesFilterParams): Promise<TouristPlace[]> {
  const query = new URLSearchParams();
  if (params?.district) query.set('district', params.district);
  if (params?.traffic_state) query.set('traffic_state', params.traffic_state);
  if (params?.is_alternative !== undefined) query.set('is_alternative', String(params.is_alternative));

  const endpoint = `/places/${query.toString() ? `?${query.toString()}` : ''}`;
  let page = 1;
  const places: TouristPlace[] = [];
  // Commit a complete snapshot to the store only after every page succeeds.
  while (true) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await apiFetch(`${endpoint}${separator}page=${page}`, PlacesPaginatedResponseSchema);
    places.push(...response.results);
    if (!response.next) return places;
    page += 1;
  }
}

export async function getPlaceDetail(id: number): Promise<TouristPlace> {
  return apiFetch(`/places/${id}/`, TouristPlaceSchema);
}

export async function getPlaceHistory(id: number, limit = 50): Promise<TelemetryLog[]> {
  return apiFetch(`/places/${id}/history/?limit=${limit}`, z.array(TelemetryLogSchema));
}

export async function sendDeviceControl(
  placeId: number,
  payload: DeviceControlPayload
): Promise<DeviceControlResponse> {
  return apiFetch(`/places/${placeId}/control/`, DeviceControlResponseSchema, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
