import type { TouristPlace, FoggRecommendationItem } from '../src/types';

export const place = (id = 1, overrides: Partial<TouristPlace> = {}): TouristPlace => ({
  id, name: `Sitio cultural ${id}`, slug: `sitio-${id}`, category: 'HISTORICO',
  department: 'Lima', province: 'Lima', district: 'Barranco', latitude: -12.14,
  longitude: -77.02, device_id: `ESP32-${id}`, max_capacity: 100, current_occupancy: 25,
  warning_threshold_pct: 70, occupancy_percentage: 25, traffic_state: 'VERDE',
  barrier_open: true, is_alternative_destination: true, average_visit_duration_min: 40,
  is_saturated: false, ...overrides,
});

export const recommendation = (origin: number, target = 2): FoggRecommendationItem => ({
  origin_place: { ...place(origin) },
  recommended_place: { ...place(target), available_capacity: 75 },
  fogg_model: {
    motivation: 'Disfruta el patrimonio cultural.', ability: 'Un recorrido cercano.', trigger: 'Consulta el aforo antes de salir.',
    motivation_short: 'Una visita más tranquila.', ability_short: 'A pocos minutos.', trigger_short: 'Consulta su disponibilidad.',
    fogg_score: 0.85, trigger_priority: 'ALTO', distance_km: 2, estimated_transit_minutes: 10, cta_button: 'Explorar ruta',
  },
});

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
