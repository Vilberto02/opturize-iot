import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Cpu, Gauge, RotateCcw, Sliders, Lock, Unlock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { type TouristPlace } from '@/types';
import { useControlStore, usePlacesStore } from '@/stores';
import { Badge, Button, Input, cn } from '@/components/ui';

interface DeviceControlDialogProps {
  place: TouristPlace | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceControlDialog: React.FC<DeviceControlDialogProps> = ({
  place,
  isOpen,
  onClose,
}) => {
  const { isSending, lastResponse, error, sendRemoteControl, clearControlStatus } = useControlStore();
  const { fetchPlaces } = usePlacesStore();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const deviceId = useId();
  const capacityId = useId();
  const [newCapacity, setNewCapacity] = useState<string>(String(place?.max_capacity ?? 20));
  const [capacityTouched, setCapacityTouched] = useState(false);
  const placeId = place?.id;
  const currentCapacity = place?.max_capacity ?? 20;
  const capacitySessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || placeId === undefined) {
      capacitySessionRef.current = null;
      return;
    }
    // Reset for a new device/opening without replacing edits during polling.
    if (capacitySessionRef.current !== placeId) {
      capacitySessionRef.current = placeId;
      setNewCapacity(String(currentCapacity));
      setCapacityTouched(false);
    }
  }, [isOpen, placeId, currentCapacity]);

  useEffect(() => {
    if (!isOpen || placeId === undefined || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen, placeId]);

  if (!isOpen || !place) return null;
  const capacity = Number(newCapacity);
  const validCapacity = newCapacity.trim() !== '' && Number.isInteger(capacity) && capacity >= 1 && capacity <= 5000;
  const capacityError = capacityTouched && !validCapacity;

  const handleResetAforo = async () => {
    const success = await sendRemoteControl(place.id, { comando: 'reset_aforo' });
    if (success) {
      await fetchPlaces();
    }
  };

  const handleSetCapacity = async () => {
    setCapacityTouched(true);
    if (!validCapacity) return;
    const success = await sendRemoteControl(place.id, {
      comando: 'set_capacidad',
      valor: capacity,
    });
    if (success) {
      await fetchPlaces();
    }
  };

  const handleToggleBarrier = async () => {
    const targetState = !place.barrier_open;
    const success = await sendRemoteControl(place.id, {
      comando: 'forzar_barrera',
      abrir: targetState,
    });
    if (success) {
      await fetchPlaces();
    }
  };

  const handleClose = () => {
    dialogRef.current?.close();
    clearControlStatus();
    onClose();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={deviceId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      className="fixed inset-0 m-auto hidden max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl flex-col overflow-hidden rounded-[20px] border border-[#DCE3EA] bg-white p-0 text-slate-800 shadow-[0_22px_44px_#0F172A24,0_4px_10px_#0F172A12] backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:flex"
    >
      <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-3 border-b border-[#E8EDF2] px-5 py-3">
        <div className="flex min-w-0 items-center gap-[11px]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-slate-900 text-teal-400">
            <Cpu aria-hidden="true" className="h-[17px] w-[17px]" />
          </div>
          <div className="min-w-0 space-y-[3px]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={titleId} className="text-base font-bold leading-normal tracking-[-0.3px] text-slate-900">
                Centro de control IoT
              </h2>
              <Badge variant="green" className="gap-[5px] border-0 bg-emerald-50 px-[7px] py-1 text-xs font-bold leading-normal tracking-[0.5px] text-emerald-700 shadow-none">
                ESP32
              </Badge>
            </div>
            <p id={deviceId} className="break-words font-mono text-xs font-medium leading-normal text-slate-500">
              {place.name} · {place.device_id || 'Sin hardware vinculado'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-11 w-11 shrink-0 rounded-[9px] bg-slate-50 p-0 text-slate-500 focus-visible:ring-teal-500"
          aria-label="Cerrar diálogo de control"
        >
          <X aria-hidden="true" className="h-[15px] w-[15px]" />
        </Button>
      </header>

      <div className="min-h-0 space-y-[11px] overflow-y-auto p-5">
        {isSending && <p role="status" className="rounded-xl bg-teal-50 p-3 text-sm font-medium text-teal-800">Enviando comando al dispositivo…</p>}
        {lastResponse && (
          <div role="status" className="flex items-start gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <strong className="font-semibold">Comando enviado</strong>
              <p className="mt-1 text-sm">El estado del dispositivo se actualizará al recibir telemetría.</p>
              <p className="mt-0.5 break-all font-mono text-xs text-emerald-700">Tópico MQTT: {lastResponse.topic}</p>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-[10px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="min-w-0 break-words font-medium">{error}</p>
          </div>
        )}

        <h3 className="text-xs font-bold leading-normal tracking-[0.8px] text-slate-500">
          CONTROLES DEL DISPOSITIVO
        </h3>
        <div className="divide-y divide-slate-200 overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50">
          <article className="flex flex-wrap items-center gap-3 p-[15px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 basis-[140px] space-y-[3px]">
              <h4 className="text-xs font-bold leading-normal text-slate-800">Resetear contador de aforo</h4>
              <p className="text-xs leading-5 text-slate-500">
                Reinicia las {place.current_occupancy} personas registradas y restablece el semáforo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetAforo}
              disabled={isSending}
              className="h-11 shrink-0 gap-1.5 rounded-[9px] border-slate-300 px-2.5 text-xs font-bold text-slate-700 shadow-none"
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              Resetear
            </Button>
          </article>

          <article className="space-y-3 p-[15px]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-teal-50 text-teal-600">
                <Gauge aria-hidden="true" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-[3px]">
                <label htmlFor={capacityId} className="block text-xs font-bold leading-normal text-slate-800">
                  Capacidad máxima permitida
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  Límite actual: {place.max_capacity} visitantes. Ajusta el valor según el evento.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-[120px] shrink-0">
                <Input
                  id={capacityId}
                  type="number"
                  min="1"
                  max="5000"
                  step="1"
                  inputMode="numeric"
                  value={newCapacity}
                  onChange={(event) => setNewCapacity(event.target.value)}
                  onBlur={() => setCapacityTouched(true)}
                  aria-invalid={capacityError}
                  aria-describedby={`${capacityId}-hint`}
                  disabled={isSending}
                  className="h-10 rounded-[9px] border-slate-300 bg-white pl-[11px] pr-[50px] font-mono text-sm font-bold text-slate-900 [appearance:textfield] focus-visible:ring-teal-500 md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  personas
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSetCapacity}
                disabled={isSending || !validCapacity || capacity === place.max_capacity}
                className="h-auto min-h-10 min-w-0 flex-1 basis-[170px] gap-[7px] rounded-[9px] border-0 px-2.5 py-2 text-xs font-bold shadow-[0_3px_8px_#0D948826]"
              >
                <Sliders aria-hidden="true" className="h-[13px] w-[13px] shrink-0" />
                <span>Aplicar nueva capacidad</span>
              </Button>
            </div>
            <p id={`${capacityId}-hint`} role={capacityError ? 'alert' : undefined} className={cn('text-xs', capacityError ? 'text-rose-700' : 'text-slate-600')}>
              {capacityError ? 'Introduce un número entero entre 1 y 5000.' : 'Introduce una capacidad entre 1 y 5000 personas.'}
            </p>
          </article>

          <article className="flex flex-wrap items-center gap-3 p-[15px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600">
              <Lock aria-hidden="true" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 basis-[140px] space-y-[3px]">
              <h4 className="text-xs font-bold leading-normal text-slate-800">Control forzado de talanquera</h4>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Estado actual</span>
                <Badge
                  variant={place.barrier_open ? 'green' : 'red'}
                  className={cn(
                    'gap-[5px] border-0 px-[7px] py-1 text-xs font-bold leading-normal tracking-[0.35px] shadow-none',
                    place.barrier_open ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                  )}
                >
                  <span aria-hidden="true" className={cn('h-[5px] w-[5px] rounded-full', place.barrier_open ? 'bg-emerald-500' : 'bg-rose-500')} />
                  {place.barrier_open ? 'ABIERTA · 90°' : 'BLOQUEADA · 0°'}
                </Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleBarrier}
              disabled={isSending}
              className={cn(
                'h-11 shrink-0 gap-1.5 rounded-[9px] px-2.5 text-xs font-bold shadow-none',
                place.barrier_open
                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 focus:ring-rose-500'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 focus:ring-emerald-500',
              )}
            >
              {place.barrier_open
                ? <Lock aria-hidden="true" className="h-3 w-3" />
                : <Unlock aria-hidden="true" className="h-3 w-3" />}
              {place.barrier_open ? 'Forzar cierre' : 'Forzar apertura'}
            </Button>
          </article>
        </div>
      </div>

      <footer className="flex min-h-[58px] shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#E8EDF2] bg-slate-50 px-5 py-3">
        <span className="flex items-center gap-[7px] text-xs font-semibold text-slate-500">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Broker: HiveMQ · QoS 1
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClose}
          className="h-11 rounded-[9px] border-slate-300 bg-white px-[13px] text-xs font-bold text-slate-700 shadow-none"
        >
          Cerrar
        </Button>
      </footer>
    </dialog>,
    document.body,
  );
};
