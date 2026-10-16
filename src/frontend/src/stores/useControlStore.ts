import { create } from 'zustand';
import { type DeviceControlPayload, type DeviceControlResponse } from '@/types';
import { sendDeviceControl } from '@/api';

interface ControlState {
  isSending: boolean;
  lastResponse: DeviceControlResponse | null;
  error: string | null;

  sendRemoteControl: (placeId: number, payload: DeviceControlPayload) => Promise<boolean>;
  clearControlStatus: () => void;
}

let controlSession = 0;

export const useControlStore = create<ControlState>((set, get) => ({
  isSending: false,
  lastResponse: null,
  error: null,

  sendRemoteControl: async (placeId: number, payload: DeviceControlPayload) => {
    if (get().isSending) return false;
    const session = controlSession;
    set({ isSending: true, error: null, lastResponse: null });
    try {
      const response = await sendDeviceControl(placeId, payload);
      set({ isSending: false, ...(session === controlSession ? { lastResponse: response, error: null } : {}) });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar comando de control al ESP32';
      set({ isSending: false, ...(session === controlSession ? { error: msg } : {}) });
      return false;
    }
  },

  clearControlStatus: () => {
    ++controlSession;
    set({ lastResponse: null, error: null });
  },
}));
