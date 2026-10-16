import React from 'react';
import { Bar } from '@visx/shape';
import { ParentSize } from '@visx/responsive';
import { type TouristPlace } from '@/types';

interface CapacityComparisonChartProps {
  places: TouristPlace[];
  isLoading?: boolean;
  error?: string | null;
}

const ROW_HEIGHT = 64;

const ChartContent: React.FC<{ width: number; height: number; places: TouristPlace[] }> = ({
  width,
  places,
}) => {
  const margin = { top: 6, right: 16, bottom: 6, left: 16 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);

  if (width < 50 || places.length === 0) return null;

  const totalHeight = places.length * ROW_HEIGHT + margin.top + margin.bottom;

  return (
    <svg width={width} height={totalHeight} className="font-sans overflow-hidden">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {places.map((place, index) => {
          const rowY = index * ROW_HEIGHT;
          const isFull = place.traffic_state === 'ROJO';
          const isModerate = place.traffic_state === 'AMARILLO';
          const fillOccupied = isFull ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
          const pct = Math.min(100, Math.max(0, place.occupancy_percentage));
          const barWidth = Math.round((innerWidth * pct) / 100);

          return (
            <g key={place.id} className="transition-all">
              {/* Fila Superior: Nombre del Atractivo a la izquierda */}
              <text
                x={0}
                y={rowY + 13}
                fontSize={12}
                fontWeight="600"
                fill="#1e293b"
                textAnchor="start"
              >
                <title>{place.name}</title>
                {place.name.length > Math.max(16, Math.floor(innerWidth / 7)) ? `${place.name.slice(0, Math.max(16, Math.floor(innerWidth / 7)) - 1)}…` : place.name}
              </text>

              {/* Fila Superior: Métrica de Aforo a la derecha */}
              <text
                x={0}
                y={rowY + 32}
                fontSize={12}
                fontFamily="ui-monospace, monospace"
                fontWeight="700"
                fill="#475569"
                textAnchor="start"
              >
                {place.current_occupancy}{' '}
                <tspan fill="#94a3b8" fontWeight="normal">/ {place.max_capacity}</tspan>{' '}
                <tspan fill="#475569" fontWeight="bold">({place.occupancy_percentage.toFixed(0)}%)</tspan>
              </text>

              {/* Barra de Fondo (Capacidad Máxima 100%) */}
              <Bar
                x={0}
                y={rowY + 42}
                width={innerWidth}
                height={10}
                fill="#f1f5f9"
                rx={5}
              />

              {/* Barra de Aforo Ocupado */}
              <Bar
                x={0}
                y={rowY + 42}
                width={barWidth}
                height={10}
                fill={fillOccupied}
                rx={5}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export const CapacityComparisonChart: React.FC<CapacityComparisonChartProps> = ({ places, isLoading, error }) => {
  return (
    <figure className="w-full bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
        <div>
          <span className="font-bold text-slate-900 text-sm">
            Comparativa de Aforo y Capacidad en Red
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Ocupación actual vs. Capacidad máxima admisible por destino
          </p>
        </div>

        {/* Leyenda Semántica */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span>Libre</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
            <span>Moderado</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
            <span>Saturado</span>
          </span>
        </div>
      </figcaption>

      <div className="w-full h-56 overflow-y-auto pt-3" tabIndex={places.length > 4 ? 0 : undefined} aria-label="Comparación de destinos" aria-busy={isLoading}>
        {isLoading && !places.length ? <div role="status" className="skeleton h-full w-full"><span className="sr-only">Cargando capacidad…</span></div> : places.length > 0 ? (
          <ParentSize>
            {({ width }) => (
              <ChartContent width={width} height={places.length * ROW_HEIGHT + 24} places={places} />
            )}
          </ParentSize>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-sm text-slate-600">
            {error ? 'No pudimos cargar las métricas de capacidad.' : 'No hay destinos disponibles para comparar.'}
          </div>
        )}
      </div>
    </figure>
  );
};
