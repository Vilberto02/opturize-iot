import React from 'react';
import { RadioTower, Activity, Map, RefreshCw } from 'lucide-react';
import { useViewModeStore, usePlacesStore } from '@/stores';
import { Button, cn } from '@/components/ui';

const viewModes = [
  { mode: 'tourist', label: 'Vista turista', Icon: Map },
  { mode: 'manager', label: 'Gestor IoT', Icon: Activity },
] as const;

export const Header: React.FC = () => {
  const { viewMode, setViewMode } = useViewModeStore();
  const { lastUpdated, isLoading, error, fetchPlaces } = usePlacesStore();
  const syncLabel = error ? 'Error al actualizar' : isLoading ? 'Actualizando datos…' : lastUpdated ? 'Datos actualizados' : 'Esperando datos';

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : '--:--';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white text-slate-900 sm:min-h-[80px]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 sm:min-h-20 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-4 sm:px-6 sm:py-0 lg:px-8">
        <div className="flex min-w-0 items-center gap-[11px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-teal-600 text-white">
            <RadioTower aria-hidden="true" className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 space-y-px">
            <h1 className="text-[17px] font-bold leading-normal tracking-[-0.35px]">OpTurize</h1>
            <p className="whitespace-nowrap text-xs font-medium leading-normal text-slate-500">
              Turismo inteligente
            </p>
          </div>
        </div>

        <nav
          aria-label="Perspectiva de visualización"
          className="col-span-2 row-start-2 flex min-h-[52px] w-full items-center gap-1 rounded-xl bg-slate-100 p-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto"
        >
          {viewModes.map(({ mode, label, Icon }) => {
            const isActive = viewMode === mode;

            return (
              <Button
                key={mode}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(mode)}
                aria-pressed={isActive}
                className={cn(
                  'h-9 min-w-0 flex-1 gap-[7px] whitespace-nowrap rounded-lg px-[13px] text-xs transition-colors focus-visible:ring-teal-500 sm:flex-none',
                  isActive
                    ? 'bg-white font-bold text-teal-700 shadow-[0_1px_3px_#0F172A12] hover:bg-white hover:text-teal-700'
                    : 'font-semibold text-slate-500 hover:bg-white/50 hover:text-slate-700',
                )}
              >
                <Icon aria-hidden="true" className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-teal-600')} />
                <span>{label}</span>
              </Button>
            );
          })}
        </nav>

        <aside
          aria-label="Sincronización de datos"
          className="col-start-2 row-start-1 flex items-center justify-end gap-2 sm:col-start-3"
        >
          <div className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 lg:flex">
            <div aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <span className={cn('h-2 w-2 rounded-full', error ? 'bg-rose-500' : lastUpdated ? 'bg-emerald-500' : 'bg-slate-400')} />
            </div>
            <div className="space-y-px">
              <p className="whitespace-nowrap text-xs font-bold leading-normal text-slate-700">
                {syncLabel}
              </p>
              <time
                dateTime={lastUpdated?.toISOString()}
                className="block whitespace-nowrap font-mono text-xs font-medium leading-normal text-slate-400 tabular-nums"
              >
                Actualizado · {formattedTime}
              </time>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchPlaces()}
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label="Refrescar datos de aforo ahora"
            title="Refrescar datos de aforo ahora"
            className="h-11 w-11 shrink-0 rounded-[10px] border-slate-200 bg-white p-0 text-slate-500 shadow-none focus-visible:ring-teal-500"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-teal-600 motion-reduce:animate-none')}
            />
          </Button>
          <span className="sr-only" role="status">{syncLabel}</span>
        </aside>
      </div>
    </header>
  );
};
