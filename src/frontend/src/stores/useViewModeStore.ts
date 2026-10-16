import { create } from 'zustand';

export type ViewMode = 'tourist' | 'manager';

interface ViewModeState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  viewMode: 'tourist',
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((state) => ({ viewMode: state.viewMode === 'tourist' ? 'manager' : 'tourist' })),
}));
