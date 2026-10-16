import React, { useMemo } from 'react';
import { scaleBand } from '@visx/scale';
import { ParentSize } from '@visx/responsive';

interface CellData {
  bin: number;
  count: number;
}

interface RowData {
  bin: string;
  bins: CellData[];
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function generateSimulatedHeatmap(): RowData[] {
  return DAYS.map((day, dayIndex) => {
    const isWeekend = dayIndex >= 5;
    return {
      bin: day,
      bins: HOURS.map((hour) => {
        let base = isWeekend ? 65 : 35;
        if (hour >= 11 && hour <= 14) base += 25;
        if (hour === 12 || hour === 13) base += 10;
        const variation = ((dayIndex * 7 + hour * 3) % 15) - 7;
        const count = Math.min(100, Math.max(10, base + variation));
        return { bin: hour, count };
      }),
    };
  });
}

function getColor(pct: number): string {
  if (pct >= 85) return '#ef4444';
  if (pct >= 65) return '#f59e0b';
  if (pct >= 40) return '#34d399';
  return '#a7f3d0';
}

const HeatmapContent: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const margin = { top: 25, right: 20, bottom: 35, left: 45 };
  const xMax = Math.max(0, width - margin.left - margin.right);
  const yMax = Math.max(0, height - margin.top - margin.bottom);

  const data = useMemo(() => generateSimulatedHeatmap(), []);

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        domain: HOURS,
        range: [0, xMax],
        padding: 0.15,
      }),
    [xMax]
  );

  const yScale = useMemo(
    () =>
      scaleBand<string>({
        domain: DAYS,
        range: [0, yMax],
        padding: 0.15,
      }),
    [yMax]
  );

  if (width < 50 || height < 50) return null;

  return (
    <svg width={width} height={height} className="font-sans overflow-visible">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Eje Horario Superior */}
        {HOURS.map((hour) => {
          const x = (xScale(hour) ?? 0) + xScale.bandwidth() / 2;
          return (
            <text
              key={`hour-${hour}`}
              x={x}
              y={-8}
              textAnchor="middle"
              fontSize={12}
              fontWeight="bold"
              fill="#64748b"
            >
              {hour}:00
            </text>
          );
        })}

        {/* Eje Días Izquierda */}
        {DAYS.map((day) => {
          const y = (yScale(day) ?? 0) + yScale.bandwidth() / 2;
          return (
            <text
              key={`day-${day}`}
              x={-8}
              y={y + 3}
              textAnchor="end"
              fontSize={12}
              fontWeight="bold"
              fill="#475569"
            >
              {day}
            </text>
          );
        })}

        {/* Celdas del Mapa de Calor */}
        {data.map((row) =>
          row.bins.map((cell) => {
            const x = xScale(cell.bin) ?? 0;
            const y = yScale(row.bin) ?? 0;
            const cellColor = getColor(cell.count);

            return (
              <rect
                key={`cell-${row.bin}-${cell.bin}`}
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={yScale.bandwidth()}
                fill={cellColor}
                opacity={0.9}
                rx={3}
                className="transition-all hover:opacity-100 hover:stroke-slate-700 hover:stroke-1 cursor-pointer"
              >
                <title>{`${row.bin} ${cell.bin}:00 — Aforo Promedio: ${cell.count}%`}</title>
              </rect>
            );
          })
        )}
      </g>
    </svg>
  );
};

export const HourlyHeatmapChart: React.FC = () => {
  return (
    <figure className="w-full bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
      <figcaption className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600 pb-3 border-b border-slate-100">
        <div>
          <span className="font-semibold text-slate-800">
            Matriz Horaria de Saturación Turística
          </span>
          <p className="text-xs text-slate-400">
            Días de la semana vs. Franja horaria (promedio histórico)
          </p>
        </div>

        {/* Leyenda Térmica */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#a7f3d0]" /> &lt;40%
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#34d399]" /> 40-65%
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]" /> 65-85%
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#ef4444]" /> &gt;85%
          </span>
        </div>
      </figcaption>

      <div className="w-full overflow-x-auto pt-2" tabIndex={0} aria-label="Matriz horaria de aforo">
        <div className="h-56 min-w-[560px]"><ParentSize>{({ width, height }) => <HeatmapContent width={width} height={height} />}</ParentSize></div>
      </div>
    </figure>
  );
};
