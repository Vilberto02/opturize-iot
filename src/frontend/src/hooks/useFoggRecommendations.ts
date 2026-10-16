import { useEffect } from 'react';
import { useRecommendationsStore, usePlacesStore } from '@/stores';
import { useIntervalPolling } from './useIntervalPolling';

export function useFoggRecommendations() {
  const { recommendations, selectedOriginId, isLoading, hasLoaded, error, fetchRecommendations } =
    useRecommendationsStore();

  const selectedPlaceId = usePlacesStore((state) => state.selectedPlaceId);

  // Polling de recomendaciones cada 5000ms
  useIntervalPolling(() => fetchRecommendations(selectedPlaceId ?? undefined), 5000);

  // Sincronizar origen cuando cambia el lugar seleccionado si este está saturado o en alerta
  useEffect(() => {
    fetchRecommendations(selectedPlaceId ?? undefined);
  }, [selectedPlaceId, fetchRecommendations]);

  const activeTriggers = recommendations.filter(
    (item) => item.fogg_model.trigger_priority === 'ALTO' || item.origin_place.traffic_state === 'ROJO'
  );

  return {
    recommendations,
    activeTriggers,
    selectedOriginId,
    isLoading,
    hasLoaded,
    error,
    refreshRecommendations: () => fetchRecommendations(selectedOriginId ?? undefined),
    filterByOrigin: (id: number | null) => {
      fetchRecommendations(id ?? undefined);
    },
  };
}
