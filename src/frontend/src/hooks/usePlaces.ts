import { useMemo } from 'react';
import { usePlacesStore } from '@/stores';
import { useIntervalPolling } from './useIntervalPolling';

export function usePlaces() {
  const {
    places,
    selectedPlaceId,
    selectedPlaceHistory,
    isLoading,
    isHistoryLoading,
    hasLoaded,
    historyError,
    error,
    filterCategory,
    filterState,
    searchQuery,
    lastUpdated,
    fetchPlaces,
    selectPlace,
    setFilterCategory,
    setFilterState,
    setSearchQuery,
    clearFilters,
  } = usePlacesStore();

  // Polling cada 5000ms (5 segundos) como acordado
  useIntervalPolling(fetchPlaces, 5000);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.device_id && place.device_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = filterCategory ? place.category === filterCategory : true;
      const matchesState = filterState ? place.traffic_state === filterState : true;

      return matchesSearch && matchesCategory && matchesState;
    });
  }, [places, searchQuery, filterCategory, filterState]);

  const selectedPlace = useMemo(() => {
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

  const networkStats = useMemo(() => {
    const totalPlaces = places.length;
    const totalOccupancy = places.reduce((sum, p) => sum + p.current_occupancy, 0);
    const totalCapacity = places.reduce((sum, p) => sum + p.max_capacity, 0);
    const saturatedCount = places.filter((p) => p.traffic_state === 'ROJO').length;
    const moderateCount = places.filter((p) => p.traffic_state === 'AMARILLO').length;
    const freeCount = places.filter((p) => p.traffic_state === 'VERDE').length;
    const avgOccupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    return {
      totalPlaces,
      totalOccupancy,
      totalCapacity,
      avgOccupancyPct,
      saturatedCount,
      moderateCount,
      freeCount,
    };
  }, [places]);

  return {
    places: filteredPlaces,
    allPlaces: places,
    selectedPlace,
    selectedPlaceHistory,
    isLoading,
    isHistoryLoading,
    hasLoaded,
    historyError,
    error,
    networkStats,
    lastUpdated,
    filterCategory,
    filterState,
    searchQuery,
    selectPlace,
    setFilterCategory,
    setFilterState,
    setSearchQuery,
    clearFilters,
    refreshPlaces: fetchPlaces,
  };
}
