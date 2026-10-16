import React from 'react';
import { MapPin, Cpu, ArrowUpRight, ArrowRight, Sparkles, Landmark, Route } from 'lucide-react';
import { type TouristPlace } from '@/types';
import { Card, CardHeader, CardContent, CardFooter, Button, Badge, Progress, cn } from '@/components/ui';
import { TrafficBadge } from './TrafficBadge';
import { BarrierBadge } from './BarrierBadge';
import { ClimateWidget } from './ClimateWidget';

interface PlaceCardProps {
  place: TouristPlace;
  isSelected?: boolean;
  onSelect?: (place: TouristPlace) => void;
  onViewFogg?: (place: TouristPlace) => void;
  showControlAction?: boolean;
}

const categoryLabels: Record<string, string> = {
  ARQUEOLOGICO: 'Arqueológico',
  NATURAL: 'Natural',
  HISTORICO: 'Histórico',
  MUSEO: 'Museo',
};

const trafficStyles = {
  VERDE: {
    progress: 'green' as const,
    badge: 'bg-emerald-50 text-emerald-700',
    percentage: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  AMARILLO: {
    progress: 'yellow' as const,
    badge: 'bg-amber-50 text-amber-800',
    percentage: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  ROJO: {
    progress: 'red' as const,
    badge: 'bg-rose-50 text-rose-700',
    percentage: 'text-rose-600',
    dot: 'bg-rose-500',
  },
};

const actionClassName = 'group h-auto min-h-11 w-full gap-2 whitespace-normal rounded-xl px-3 py-2.5 text-sm font-bold tracking-[0.15px] transition-colors';

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected = false,
  onSelect,
  onViewFogg,
  showControlAction = true,
}) => {
  const isHighOccupancy = place.traffic_state === 'ROJO' || place.traffic_state === 'AMARILLO';
  const trafficStyle = trafficStyles[place.traffic_state];
  const availableCapacity = Math.max(0, place.max_capacity - place.current_occupancy);
  const progressPercentage = place.max_capacity > 0
    ? Math.min(100, Math.max(0, (place.current_occupancy / place.max_capacity) * 100))
    : 0;
  const showControlButton = showControlAction && Boolean(onSelect);
  const showExploreButton = !showControlAction && !isHighOccupancy && Boolean(onSelect);
  const showFoggButton = isHighOccupancy && Boolean(onViewFogg);

  return (
    <Card
      as="article"
      className={cn(
        "flex h-full min-h-[408px] min-w-0 flex-col overflow-hidden rounded-2xl border-[#DCE7E5] bg-white text-slate-900 shadow-panel",
      )}
    >
      <div
        aria-hidden="true"
        className={`h-1 w-full shrink-0 ${isSelected ? "bg-teal-600" : "bg-none"}`}
      />
      <div className="flex flex-1 flex-col gap-6 px-5 py-[18px]">
        <div className="flex flex-col gap-[15px]">
          <CardHeader className="gap-2.5 p-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 basis-[150px] break-words text-lg font-bold leading-[22px] tracking-[-0.35px]">
                {place.name}
              </h3>
              <TrafficBadge
                state={place.traffic_state}
                size="sm"
                className={cn(
                  "min-w-0 shrink-0 gap-1.5 border-0 px-2.5 py-1.5 text-xs font-bold leading-normal tracking-[0.25px] shadow-none [&_svg]:h-3 [&_svg]:w-3",
                  trafficStyle.badge,
                )}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                <MapPin
                  aria-hidden="true"
                  className="h-[13px] w-[13px] shrink-0 text-slate-400"
                />
                <span className="break-words">
                  {place.district}, {place.province}
                </span>
              </p>
              {place.device_id && (
                <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-semibold text-slate-500">
                  <Cpu
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 text-slate-400"
                  />
                  <span className="break-all">{place.device_id}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="min-w-0 gap-1.5 border-0 bg-violet-50 px-2.5 py-1.5 text-xs font-bold uppercase leading-normal tracking-[0.25px] text-violet-700 shadow-none">
                <Landmark aria-hidden="true" className="h-3 w-3 shrink-0" />
                <span className="break-words">
                  {categoryLabels[place.category] || place.category}
                </span>
              </Badge>
              {(isHighOccupancy || place.is_alternative_destination) && (
                <Badge
                  className={cn(
                    "gap-1.5 border-0 px-2.5 py-1.5 text-xs font-bold leading-normal tracking-[0.25px] shadow-none",
                    isHighOccupancy
                      ? "bg-orange-50 text-orange-700"
                      : "bg-blue-50 text-blue-700",
                  )}
                >
                  {isHighOccupancy ? (
                    <Route aria-hidden="true" className="h-3 w-3 shrink-0" />
                  ) : (
                    <Sparkles aria-hidden="true" className="h-3 w-3 shrink-0" />
                  )}
                  <span>
                    {isHighOccupancy ? "Desvío sugerido" : "Descongestión"}
                  </span>
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-[15px] p-0">
            <div className="flex flex-col gap-3 rounded-[14px] border border-[#E5EAF0] bg-slate-50 p-[15px]">
              <p className="flex items-center gap-[7px] text-xs font-bold leading-normal tracking-[0.8px] text-slate-500">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-[7px] w-[7px] shrink-0 rounded-full",
                    trafficStyle.dot,
                  )}
                />
                AFORO EN VIVO
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <data
                  value={place.occupancy_percentage}
                  className={cn(
                    "text-[30px] font-bold leading-normal tracking-[-0.8px] tabular-nums",
                    trafficStyle.percentage,
                  )}
                >
                  {place.occupancy_percentage.toFixed(0)}%
                </data>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-bold leading-normal tabular-nums">
                    {place.current_occupancy} de {place.max_capacity} personas
                  </p>
                  <p className="text-xs font-medium leading-normal text-slate-500 tabular-nums">
                    {availableCapacity} cupos libres
                  </p>
                </div>
              </div>
              <Progress
                value={progressPercentage}
                max={100}
                variant={trafficStyle.progress}
                aria-label="Porcentaje de aforo ocupado"
                className="h-2 bg-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <BarrierBadge
                isOpen={place.barrier_open}
                size="sm"
                className={cn(
                  "gap-1.5 border-0 px-2.5 py-1.5 text-xs font-bold leading-normal tracking-[0.25px] shadow-none",
                  place.barrier_open
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              />
              <ClimateWidget
                temperature={place.current_temperature}
                humidity={place.current_humidity}
                className="gap-[9px] border-slate-200 px-2.5 py-1.5 shadow-none [&_svg]:h-3 [&_svg]:w-3 [&_data]:text-xs [&_data]:leading-normal [&>span]:h-3.5 [&>span]:w-px [&>span]:bg-slate-300 [&>span]:text-transparent"
              />
            </div>
          </CardContent>
        </div>

        {(showControlButton || showExploreButton || showFoggButton) && (
          <CardFooter className="mt-auto flex-col gap-2 p-0">
            {showControlButton && (
              <Button
                type="button"
                variant={isSelected ? "secondary" : "outline"}
                className={actionClassName}
                onClick={() => onSelect?.(place)}
              >
                <Cpu
                  aria-hidden="true"
                  className="h-[15px] w-[15px] shrink-0"
                />
                <span>
                  {isSelected ? "Nodo Seleccionado" : "Analítica & Control"}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-[15px] w-[15px] shrink-0"
                />
              </Button>
            )}
            {showExploreButton && (
              <Button
                type="button"
                variant="primary"
                className={cn(
                  actionClassName,
                  "border-0 shadow-[0_4px_10px_#0D948824]",
                )}
                onClick={() => onSelect?.(place)}
              >
                <ArrowRight
                  aria-hidden="true"
                  className="h-[15px] w-[15px] shrink-0"
                />
                <span>Explorar sitio</span>
              </Button>
            )}
            {showFoggButton && (
              <Button
                type="button"
                variant="primary"
                className={cn(
                  actionClassName,
                  "border-0 shadow-[0_4px_10px_#0D948824] bg-orange-700 hover:bg-orange-800",
                )}
                onClick={() => onViewFogg?.(place)}
                title="Ver alternativas recomendadas por el Modelo de Fogg"
              >
                <Sparkles
                  aria-hidden="true"
                  className="h-[15px] w-[15px] shrink-0"
                />
                <span>Ver desvío Fogg</span>
              </Button>
            )}
          </CardFooter>
        )}
      </div>
    </Card>
  );
};
