import { useEffect, useRef } from 'react';

/**
 * Hook para ejecutar una acción periódicamente respetando el ciclo de vida de React.
 */
export function useIntervalPolling(callback: () => void | Promise<void>, intervalMs: number = 5000) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Ejecución inmediata inicial
    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
}
