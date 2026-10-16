import { create } from 'zustand';
import { type FoggRecommendationItem } from '@/types';
import { getRecommendations } from '@/api';

interface RecommendationsState {
  recommendations: FoggRecommendationItem[];
  selectedOriginId: number | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;

  fetchRecommendations: (originId?: number) => Promise<void>;
  setSelectedOriginId: (originId: number | null) => void;
}

let latestRequest = 0;

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  recommendations: [],
  selectedOriginId: null,
  isLoading: false,
  error: null,
  hasLoaded: false,

  fetchRecommendations: async (originId?: number) => {
    const origin = originId ?? null;
    const changedOrigin = get().selectedOriginId !== origin;
    if (get().isLoading && !changedOrigin) return;
    const request = ++latestRequest;
    set({ isLoading: true, error: null, selectedOriginId: origin,
      ...(changedOrigin ? { recommendations: [], hasLoaded: false } : {}) });
    try {
      const data = await getRecommendations(originId);
      if (request !== latestRequest) return;
      set({
        recommendations: data,
        selectedOriginId: originId ?? null,
        isLoading: false,
        error: null,
        hasLoaded: true,
      });
    } catch (err: unknown) {
      if (request !== latestRequest) return;
      const msg = err instanceof Error ? err.message : 'Error al cargar recomendaciones de Fogg';
      set({ error: msg, isLoading: false });
    }
  },

  setSelectedOriginId: (originId) => {
    if (get().selectedOriginId === originId) return;
    ++latestRequest;
    set({ selectedOriginId: originId, recommendations: [], hasLoaded: false, isLoading: false, error: null });
  },
}));
