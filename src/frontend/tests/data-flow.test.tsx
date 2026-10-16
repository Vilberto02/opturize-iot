import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlacesStore } from '../src/stores/usePlacesStore';
import { useRecommendationsStore } from '../src/stores/useRecommendationsStore';
import { usePlaces } from '../src/hooks/usePlaces';
import { getPlaces, getPlaceHistory, getRecommendations } from '../src/api';
import { deferred, place, recommendation } from './fixtures';

vi.mock('../src/api', () => ({ getPlaces: vi.fn(), getPlaceHistory: vi.fn(), getRecommendations: vi.fn() }));
vi.mock('../src/hooks/useIntervalPolling', () => ({ useIntervalPolling: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  usePlacesStore.setState({ places: [], selectedPlaceId: null, selectedPlaceHistory: [], isLoading: false,
    isHistoryLoading: false, historyError: null, error: null, hasLoaded: false, lastUpdated: null,
    filterCategory: null, filterState: null, searchQuery: '' });
  useRecommendationsStore.setState({ recommendations: [], selectedOriginId: null, isLoading: false, hasLoaded: false, error: null });
  vi.mocked(getPlaceHistory).mockResolvedValue([]);
});

describe('Snapshots y filtros', () => {
  it('filtra resultados sin modificar las métricas ni los destinos globales', () => {
    usePlacesStore.setState({ hasLoaded: true, places: [place(), place(2, { traffic_state: 'ROJO', current_occupancy: 110 })] });
    const { result } = renderHook(usePlaces);
    act(() => result.current.setFilterState('ROJO'));
    expect(result.current.places.map(p => p.id)).toEqual([2]);
    expect(result.current.allPlaces).toHaveLength(2);
    expect(result.current.networkStats.totalOccupancy).toBe(135);
    act(() => result.current.clearFilters());
    expect(result.current.places).toHaveLength(2);
  });

  it('carga toda la red sin enviar el filtro turístico y conserva datos tras un fallo', async () => {
    usePlacesStore.setState({ filterState: 'ROJO' });
    vi.mocked(getPlaces).mockResolvedValue([place()]);
    await usePlacesStore.getState().fetchPlaces();
    expect(getPlaces).toHaveBeenCalledWith();
    const updated = usePlacesStore.getState().lastUpdated;
    vi.mocked(getPlaces).mockRejectedValue(new Error('Sin red'));
    await usePlacesStore.getState().fetchPlaces();
    expect(usePlacesStore.getState()).toMatchObject({ hasLoaded: true, isLoading: false, error: 'Sin red', lastUpdated: updated });
    expect(usePlacesStore.getState().places).toHaveLength(1);
  });

  it('expone carga pendiente e impide consultas simultáneas', async () => {
    const request = deferred<ReturnType<typeof place>[]>();
    vi.mocked(getPlaces).mockReturnValue(request.promise);
    const loading = usePlacesStore.getState().fetchPlaces();
    expect(usePlacesStore.getState().isLoading).toBe(true);
    await usePlacesStore.getState().fetchPlaces();
    expect(getPlaces).toHaveBeenCalledTimes(1);
    request.resolve([]); await loading;
    expect(usePlacesStore.getState()).toMatchObject({ isLoading: false, hasLoaded: true });
  });

  it('descarta un historial antiguo después de seleccionar otro nodo', async () => {
    const old = deferred<never[]>(), current = deferred<never[]>();
    vi.mocked(getPlaceHistory).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    usePlacesStore.getState().selectPlace(1);
    usePlacesStore.getState().selectPlace(2);
    current.resolve([]); await current.promise;
    old.reject(new Error('Fallo antiguo')); await old.promise.catch(() => {});
    expect(usePlacesStore.getState()).toMatchObject({ selectedPlaceId: 2, historyError: null, isHistoryLoading: false });
  });
});

it('descarta recomendaciones de un origen anterior sin reemplazar las actuales', async () => {
  const old = deferred<ReturnType<typeof recommendation>[]>(), current = deferred<ReturnType<typeof recommendation>[]>();
  vi.mocked(getRecommendations).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const first = useRecommendationsStore.getState().fetchRecommendations(1);
  const second = useRecommendationsStore.getState().fetchRecommendations(2);
  current.resolve([recommendation(2)]); await second;
  old.resolve([recommendation(1)]); await first;
  expect(useRecommendationsStore.getState().selectedOriginId).toBe(2);
  expect(useRecommendationsStore.getState().recommendations[0].origin_place.id).toBe(2);
});
