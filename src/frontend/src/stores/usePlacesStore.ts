import { create } from 'zustand';
import { type TouristPlace, type TelemetryLog } from '@/types';
import { getPlaces, getPlaceHistory } from '@/api';

interface PlacesState {
  places: TouristPlace[];
  selectedPlaceId: number | null;
  selectedPlaceHistory: TelemetryLog[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  hasLoaded: boolean;
  historyError: string | null;
  error: string | null;
  filterCategory: string | null;
  filterState: string | null;
  searchQuery: string;
  lastUpdated: Date | null;

  fetchPlaces: () => Promise<void>;
  selectPlace: (id: number | null) => void;
  fetchSelectedPlaceHistory: (id: number) => Promise<void>;
  setFilterCategory: (category: string | null) => void;
  setFilterState: (state: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

let historyRequest = 0;

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  selectedPlaceId: null,
  selectedPlaceHistory: [],
  isLoading: false,
  isHistoryLoading: false,
  hasLoaded: false,
  historyError: null,
  error: null,
  filterCategory: null,
  filterState: null,
  searchQuery: '',
  lastUpdated: null,

  fetchPlaces: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const data = await getPlaces();

      // Auto-seleccionar primer lugar si no hay seleccionado
      const currentSelected = get().selectedPlaceId;
      const newSelectedId = data.some((p) => p.id === currentSelected)
        ? currentSelected : (data[0]?.id ?? null);

      set({
        places: data,
        selectedPlaceId: newSelectedId,
        isLoading: false,
        hasLoaded: true,
        error: null,
        lastUpdated: new Date(),
      });

      if (newSelectedId !== currentSelected) {
        ++historyRequest;
        set({ selectedPlaceHistory: [], historyError: null });
      }
      if (newSelectedId !== null) {
        get().fetchSelectedPlaceHistory(newSelectedId);
      } else {
        set({ selectedPlaceHistory: [], isHistoryLoading: false });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al cargar lugares turísticos';
      set({ error: msg, isLoading: false });
    }
  },

  selectPlace: (id: number | null) => {
    ++historyRequest;
    set({ selectedPlaceId: id, selectedPlaceHistory: [], historyError: null });
    if (id !== null) {
      get().fetchSelectedPlaceHistory(id);
    } else {
      set({ selectedPlaceHistory: [], isHistoryLoading: false });
    }
  },

  fetchSelectedPlaceHistory: async (id: number) => {
    const request = ++historyRequest;
    set({ isHistoryLoading: true, historyError: null });
    try {
      const history = await getPlaceHistory(id, 30);
      if (request !== historyRequest || get().selectedPlaceId !== id) return;
      set({ selectedPlaceHistory: history, isHistoryLoading: false });
    } catch (err: unknown) {
      if (request !== historyRequest || get().selectedPlaceId !== id) return;
      set({ historyError: 'No pudimos actualizar el historial de este nodo.', isHistoryLoading: false });
    }
  },

  setFilterCategory: (category) => set({ filterCategory: category }),
  setFilterState: (state) => set({ filterState: state }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearFilters: () => set({ searchQuery: '', filterCategory: null, filterState: null }),
}));
