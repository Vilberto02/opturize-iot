import React, { useState } from 'react';
import { RadioTower, Gauge, AlertTriangle, CircleAlert, Check, ShieldCheck, BadgeCheck, Cpu, Sliders, Network } from 'lucide-react';
import { usePlaces } from '@/hooks';
import { LiveOccupancyChart, HourlyHeatmapChart, CapacityComparisonChart } from '@/components/charts';
import { PlaceCard } from '@/components/places';
import { DeviceControlDialog } from '@/components/control';
import { type TouristPlace } from '@/types';
import {
  Card,
  Button,
  Badge,
  Progress,
  cn,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  DataState,
  LoadingCards,
} from '@/components/ui';

const metricCardClassName = 'flex min-h-[190px] min-w-0 flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-panel';
const metricContentClassName = 'flex flex-1 flex-col justify-between gap-3 px-[17px] pb-[17px] pt-4';
const metricTitleClassName = 'text-xs font-bold leading-normal tracking-[0.75px] text-slate-500';
const metricDetailClassName = 'text-xs font-medium leading-normal text-slate-500';
const metricBadgeClassName = 'gap-[5px] border-0 px-2 py-[5px] text-xs font-bold uppercase leading-normal shadow-none';

interface TelemetryControlHeaderProps {
  selectedPlace: TouristPlace | null;
  onCommand: (place: TouristPlace) => void;
  heading: 'h2' | 'h3';
  nodeCount?: number;
}

const TelemetryControlHeader: React.FC<TelemetryControlHeaderProps> = ({
  selectedPlace,
  onCommand,
  heading: Heading,
  nodeCount,
}) => (
    <header className="flex min-h-[148px] flex-col justify-between gap-5 rounded-2xl border border-[#DCE3EA] bg-white p-5 text-slate-900 shadow-[0_8px_22px_#0F172A0D,0_2px_4px_#0F172A08] lg:flex-row lg:items-center lg:gap-6 lg:pl-6">
      <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Cpu aria-hidden="true" className="h-[13px] w-[13px]" />
          </div>
          <Badge variant="green" className="gap-1.5 border-0 bg-emerald-50 px-[9px] py-[5px] text-xs font-bold leading-normal tracking-[0.65px] text-emerald-700 shadow-none">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            TELEMETRÍA EN VIVO
          </Badge>
          <span className="text-xs font-bold leading-normal tracking-[0.65px] text-slate-400">UNMSM · FISI</span>
          {nodeCount !== undefined && (
            <span className="text-xs font-medium leading-normal text-slate-500 tabular-nums">
              {nodeCount} {nodeCount === 1 ? 'Nodo ESP32 Enlazado' : 'Nodos ESP32 Enlazados'}
            </span>
          )}
        </div>
        <Heading className="text-2xl font-bold leading-[31px] tracking-[-0.6px] sm:text-[28px]">
          Control de aforo turístico
        </Heading>
        <p className="text-sm leading-[19px] text-slate-500">
          Supervisa nodos ESP32, aforo y actuadores físicos desde un único panel de control.
        </p>
      </div>

      <div className="flex min-h-[108px] w-full shrink-0 flex-col justify-between gap-2.5 rounded-[14px] bg-slate-900 p-3.5 lg:w-[348px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold leading-normal tracking-[0.7px] text-slate-400">
            <Cpu aria-hidden="true" className="h-3 w-3 shrink-0" />
            DISPOSITIVO
          </span>
          <Badge
            className={cn(
              'gap-[5px] border-0 px-[7px] py-1 text-xs font-bold leading-normal tracking-[0.5px] shadow-none',
              selectedPlace ? 'bg-emerald-500/[0.14] text-emerald-200' : 'bg-white/[0.08] text-slate-400',
            )}
          >
            <span aria-hidden="true" className={cn('h-[5px] w-[5px] shrink-0 rounded-full', selectedPlace ? 'bg-emerald-400' : 'bg-slate-400')} />
            {selectedPlace ? 'SELECCIONADO' : 'SIN SELECCIÓN'}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-0 flex-1 basis-[120px] space-y-0.5">
            <p className="break-words text-sm font-bold leading-normal text-white">
              {selectedPlace?.name || 'Selecciona un nodo'}
            </p>
            <p className="break-all font-mono text-xs font-semibold leading-normal text-slate-400">
              {selectedPlace
                ? selectedPlace.device_id || 'Sin identificador de dispositivo'
                : 'Elige un destino de la lista'}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (selectedPlace) onCommand(selectedPlace);
            }}
            disabled={!selectedPlace}
            title={selectedPlace ? 'Abrir control del dispositivo seleccionado' : 'Selecciona un nodo para comandarlo'}
            className="h-9 shrink-0 gap-[7px] rounded-[9px] border-0 px-[11px] text-xs font-bold shadow-[0_3px_8px_#02061752] focus-visible:ring-teal-300"
          >
            <Sliders aria-hidden="true" className="h-[13px] w-[13px] shrink-0" />
            <span>Comandar</span>
          </Button>
        </div>
      </div>
    </header>
);

export const ManagerView: React.FC = () => {
  const {
    allPlaces,
    selectedPlace,
    selectedPlaceHistory,
    networkStats,
    selectPlace,
    hasLoaded,
    error,
    isHistoryLoading,
    historyError,
  } = usePlaces();

  const [controlTargetId, setControlTargetId] = useState<number | null>(null);
  const controlTargetPlace = allPlaces.find((place) => place.id === controlTargetId) ?? null;
  const setControlTargetPlace = (place: TouristPlace) => setControlTargetId(place.id);
  const places = allPlaces;
  const occupancyProgress = Math.min(100, Math.max(0, networkStats.avgOccupancyPct));
  const alertCount = networkStats.saturatedCount + networkStats.moderateCount;
  const freeSegments = networkStats.totalPlaces > 0
    ? Math.round(Math.min(1, Math.max(0, networkStats.freeCount / networkStats.totalPlaces)) * 4)
    : 0;

  return (
    <main className="space-y-8 animate-in fade-in duration-300">
      {/* Cabecera del Centro de Monitoreo */}
      <TelemetryControlHeader
        selectedPlace={selectedPlace}
        onCommand={setControlTargetPlace}
        heading="h2"
      />

      {/* Tarjetas de Métricas Globales (KPIs) */}
      {!hasLoaded && !error ? <LoadingCards count={4} /> : !hasLoaded ? null : <section
        aria-label="Métricas globales de aforo"
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))]"
      >
        <Card
          as="article"
          className="flex min-h-[190px] min-w-0 flex-col justify-between gap-2 rounded-2xl border-0 bg-[linear-gradient(110.461deg,#0F172A_10.254%,#134E4A_89.746%)] p-5 text-white shadow-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold leading-normal tracking-[0.9px] text-teal-200">
              AFORO GLOBAL
            </h3>
            <Badge className="gap-[5px] border-0 bg-white/[0.08] px-2 py-[5px] text-xs font-bold leading-normal text-emerald-200 shadow-none">
              <RadioTower
                aria-hidden="true"
                className="h-[11px] w-[11px] shrink-0"
              />
              EN RED
            </Badge>
          </div>
          <output
            aria-label="Visitantes activos y capacidad total"
            className="flex flex-wrap items-end gap-2 tabular-nums"
          >
            <span className="break-all text-[42px] font-bold leading-none tracking-[-1.2px]">
              {networkStats.totalOccupancy}
            </span>
            <span className="text-base font-semibold leading-[26px] text-slate-400">
              / {networkStats.totalCapacity}
            </span>
          </output>
          <div className="space-y-[7px]">
            <div className="flex items-center justify-between gap-2 text-xs leading-normal">
              <span className="font-medium text-slate-300">
                Visitantes activos
              </span>
              <span className="font-bold text-teal-300 tabular-nums">
                {networkStats.avgOccupancyPct}%
              </span>
            </div>
            <Progress
              value={occupancyProgress}
              max={100}
              variant="brand"
              aria-label="Porcentaje de aforo global"
              className="h-1.5 bg-white/10 [&>div]:bg-teal-400"
            />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <span className="text-xs font-medium leading-normal text-slate-400">
              Aforo por destino
            </span>
            <div aria-hidden="true" className="flex h-6 items-end gap-1">
              {allPlaces.slice(0, 7).map((place) => (
                <span
                  key={place.id}
                  className="w-1.5 rounded-[3px] bg-teal-300"
                  style={{
                    height:
                      4 +
                      Math.min(100, Math.max(0, place.occupancy_percentage)) *
                        0.2,
                    opacity: place.occupancy_percentage > 0 ? 0.8 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card as="article" className={metricCardClassName}>
          <div
            aria-hidden="true"
            className="h-[3px] w-full shrink-0 bg-sky-400"
          />
          <div className={metricContentClassName}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={metricTitleClassName}>USO DE CAPACIDAD</h3>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
                <Gauge aria-hidden="true" className="h-[15px] w-[15px]" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 space-y-[3px]">
                <output className="block break-all text-[32px] font-bold leading-none tracking-[-0.8px] text-slate-900 tabular-nums">
                  {networkStats.avgOccupancyPct}%
                </output>
                <p className={metricDetailClassName}>Carga patrimonial</p>
              </div>
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-12 w-12 shrink-0"
              >
                <circle
                  cx="24"
                  cy="24"
                  r="21.12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5.76"
                  className="text-slate-200"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="21.12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5.76"
                  pathLength="100"
                  strokeDasharray="100"
                  strokeDashoffset={100 - occupancyProgress}
                  transform="rotate(-90 24 24)"
                  className="text-sky-400"
                />
              </svg>
            </div>
            <div>
              <Badge
                variant={
                  networkStats.avgOccupancyPct >= 70 ? "yellow" : "green"
                }
                className={cn(
                  metricBadgeClassName,
                  networkStats.avgOccupancyPct >= 70
                    ? "bg-amber-50 text-amber-800"
                    : "bg-emerald-50 text-emerald-700",
                )}
              >
                {networkStats.avgOccupancyPct >= 70 ? (
                  <AlertTriangle
                    aria-hidden="true"
                    className="h-[11px] w-[11px]"
                  />
                ) : (
                  <Check aria-hidden="true" className="h-[11px] w-[11px]" />
                )}
                {networkStats.avgOccupancyPct >= 70 ? "Alerta" : "Estable"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card as="article" className={metricCardClassName}>
          <div
            aria-hidden="true"
            className="h-[3px] w-full shrink-0 bg-rose-400"
          />
          <div className={metricContentClassName}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={metricTitleClassName}>SOBREAFORO / ALERTA</h3>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600">
                <AlertTriangle
                  aria-hidden="true"
                  className="h-[15px] w-[15px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 space-y-[3px]">
                <output className="block break-all text-[32px] font-bold leading-none tracking-[-0.8px] text-rose-600 tabular-nums">
                  {alertCount}
                </output>
                <p className={metricDetailClassName}>
                  {networkStats.saturatedCount}{" "}
                  {networkStats.saturatedCount === 1 ? "saturado" : "saturados"}{" "}
                  · {networkStats.moderateCount}{" "}
                  {networkStats.moderateCount === 1 ? "moderado" : "moderados"}
                </p>
              </div>
              <div
                aria-hidden="true"
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]",
                  alertCount > 0 ? "bg-rose-50" : "bg-slate-50",
                )}
              >
                <div
                  className={cn(
                    "flex h-[22px] w-[22px] items-center justify-center rounded-full",
                    alertCount > 0 ? "bg-rose-100" : "bg-slate-100",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      alertCount > 0 ? "bg-rose-500" : "bg-slate-400",
                    )}
                  />
                </div>
              </div>
            </div>
            <div>
              <Badge
                variant={alertCount > 0 ? "red" : "neutral"}
                className={cn(
                  metricBadgeClassName,
                  alertCount > 0
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                <CircleAlert aria-hidden="true" className="h-[11px] w-[11px]" />
                {networkStats.saturatedCount > 0
                  ? "Crítico"
                  : alertCount > 0
                    ? "Atención"
                    : "Despejado"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card as="article" className={metricCardClassName}>
          <div
            aria-hidden="true"
            className="h-[3px] w-full shrink-0 bg-emerald-400"
          />
          <div className={metricContentClassName}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={metricTitleClassName}>ACCESO LIBRE</h3>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600">
                <ShieldCheck aria-hidden="true" className="h-[15px] w-[15px]" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 space-y-[3px]">
                <output className="block break-all text-[32px] font-bold leading-none tracking-[-0.8px] text-emerald-600 tabular-nums">
                  {networkStats.freeCount}
                </output>
                <p className={metricDetailClassName}>
                  de {networkStats.totalPlaces} destinos
                </p>
              </div>
              <div
                aria-hidden="true"
                className="flex h-11 shrink-0 items-end gap-1"
              >
                {[22, 28, 18, 11].map((height, index) => (
                  <span
                    key={index}
                    style={{ height }}
                    className={cn(
                      "w-[11px] rounded-[4px]",
                      index < freeSegments ? "bg-emerald-400" : "bg-slate-200",
                    )}
                  />
                ))}
              </div>
            </div>
            <div>
              <Badge
                variant={networkStats.freeCount > 0 ? 'green' : 'neutral'}
                className={cn(
                  metricBadgeClassName,
                  "bg-emerald-50 text-emerald-700",
                )}
              >
                <BadgeCheck aria-hidden="true" className="h-[11px] w-[11px]" />
                {networkStats.freeCount > 0 ? 'Disponibles' : 'Sin destinos libres'}
              </Badge>
            </div>
          </div>
        </Card>
      </section>}

      {/* Gráficos Estadísticos con @visx (Airbnb) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Curva de Afluencia en Tiempo Real con Umbrales */}
        <LiveOccupancyChart
          logs={selectedPlaceHistory}
          maxCapacity={selectedPlace?.max_capacity || 20}
          placeName={selectedPlace?.name || "Selecciona un destino"}
          isLoading={isHistoryLoading || (!hasLoaded && !error)}
          error={historyError}
          onRetry={() => { if (selectedPlace) selectPlace(selectedPlace.id); }}
        />

        {/* Gráfico 2: Comparativa de Capacidad en Red */}
        <CapacityComparisonChart places={allPlaces} isLoading={!hasLoaded && !error} error={error} />
      </section>

      {/* Gráfico 3: Matriz Horaria de Saturación */}
      <section>
        <HourlyHeatmapChart />
      </section>

      {/* Lista de Atractivos con Acciones de Control Remoto */}
      <section className="space-y-4 pt-4">
        <header className="flex min-h-20 flex-col justify-between gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_4px_14px_#0F172A0A] lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-slate-900 text-teal-400">
              <Cpu aria-hidden="true" className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 space-y-[3px]">
              <h3 className="text-[17px] font-bold leading-normal tracking-[-0.3px] text-slate-900">
                Nodos IoT y control de actuadores
              </h3>
              <p className="text-xs font-normal leading-normal text-slate-500">
                Sensores HC-SR04 y servomotores de barrera SG90 supervisados en tiempo real
              </p>
            </div>
          </div>

          <div className="flex h-[56px] w-fit shrink-0 items-center gap-2.5 rounded-[11px] border border-[#DCE3EA] bg-slate-50 px-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Network aria-hidden="true" className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold leading-normal text-slate-700 tabular-nums">
                {places.length} {places.length === 1 ? 'nodo ESP32' : 'nodos ESP32'}
              </p>
              <p className={cn('flex items-center gap-[5px] text-xs font-semibold leading-normal', places.length > 0 ? 'text-emerald-700' : 'text-slate-500')}>
                <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', places.length > 0 ? 'bg-emerald-500' : 'bg-slate-400')} />
                {places.length > 0 ? 'Nodos registrados' : 'Sin nodos disponibles'}
              </p>
            </div>
          </div>
        </header>

        <div className="w-full">
          {!hasLoaded && !error ? <LoadingCards /> : places.length > 0 ? (
            <Carousel
              opts={{
                loop: true,
                align: "start",
              }}
              className="w-full"
              aria-label="Nodos IoT y control de actuadores"
            >
              <CarouselContent className="ml-0 gap-4 py-2">
                {places.map((place) => (
                  <CarouselItem
                    key={place.id}
                    className="pl-0 basis-full md:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]"
                  >
                    <PlaceCard
                      place={place}
                      isSelected={place.id === selectedPlace?.id}
                      onSelect={(p) => {
                        selectPlace(p.id);
                        setControlTargetPlace(p);
                      }}
                      showControlAction={true}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex items-center justify-end gap-2 pt-3">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
          ) : (
            <DataState title={error ? 'No pudimos cargar los nodos' : 'Aún no hay nodos IoT registrados'}
              description="Los dispositivos aparecerán aquí cuando haya destinos disponibles." />
          )}
        </div>
      </section>

      {/* Modal de Control Remoto ESP32 (MQTT) */}
      <DeviceControlDialog
        place={controlTargetPlace}
        isOpen={controlTargetPlace !== null}
        onClose={() => setControlTargetId(null)}
      />
    </main>
  );
};
