import React, { useMemo } from 'react';
import { AreaClosed, LinePath, Line } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';
import { type TelemetryLog } from '@/types';
import { Button } from '@/components/ui';

interface LiveOccupancyChartProps {
  logs: TelemetryLog[];
  maxCapacity: number;
  placeName: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ChartContent: React.FC<{
  width: number;
  height: number;
  logs: TelemetryLog[];
  maxCapacity: number;
}> = ({ width, height, logs, maxCapacity }) => {
  const margin = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // Procesar y ordenar datos cronológicamente (más antiguo a más reciente)
  const data = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return [...logs]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((d) => ({
        date: new Date(d.timestamp),
        occupancy: d.occupancy,
        maxCapacity: d.max_capacity,
      }));
  }, [logs]);

  // Escalas
  const timeScale = useMemo(() => {
    if (data.length === 0) {
      return scaleTime({
        range: [0, innerWidth],
        domain: [new Date(Date.now() - 3600000), new Date()],
      });
    }
    const minTime = data[0].date;
    const maxTime = data[data.length - 1].date;
    return scaleTime({
      range: [0, innerWidth],
      domain: [minTime, maxTime],
    });
  }, [data, innerWidth]);

  const maxVal = Math.max(maxCapacity * 1.15, ...data.map((d) => d.occupancy), 10);
  const occupancyScale = useMemo(() => {
    return scaleLinear({
      range: [innerHeight, 0],
      domain: [0, maxVal],
      nice: true,
    });
  }, [innerHeight, maxVal]);

  const warningY = occupancyScale(maxCapacity * 0.7);
  const saturatedY = occupancyScale(maxCapacity);

  if (width < 50 || height < 50) return null;

  return (
    <svg width={width} height={height} className="overflow-visible font-sans">
      <defs>
        <LinearGradient
          id="occupancy-gradient"
          from="#0d9488"
          fromOpacity={0.6}
          to="#14b8a6"
          toOpacity={0.05}
        />
      </defs>

      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Grilla horizontal tenue */}
        <GridRows scale={occupancyScale} width={innerWidth} stroke="#f1f5f9" strokeDasharray="3,3" />

        {/* Zona sombreada de saturación */}
        {saturatedY >= 0 && (
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={Math.max(0, saturatedY)}
            fill="#fee2e2"
            fillOpacity={0.3}
          />
        )}

        {/* Línea horizontal de Capacidad Máxima (100%) */}
        {saturatedY >= 0 && saturatedY <= innerHeight && (
          <g>
            <Line
              from={{ x: 0, y: saturatedY }}
              to={{ x: innerWidth, y: saturatedY }}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            <text
              x={innerWidth - 5}
              y={saturatedY - 5}
              fill="#ef4444"
              fontSize={12}
              fontWeight="bold"
              textAnchor="end"
            >
              Límite Máximo ({maxCapacity})
            </text>
          </g>
        )}

        {/* Línea horizontal de Alerta Moderada (70%) */}
        {warningY >= 0 && warningY <= innerHeight && (
          <g>
            <Line
              from={{ x: 0, y: warningY }}
              to={{ x: innerWidth, y: warningY }}
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <text
              x={innerWidth - 5}
              y={warningY - 4}
              fill="#d97706"
              fontSize={12}
              fontWeight="bold"
              textAnchor="end"
            >
              Umbral Alerta 70% ({Math.round(maxCapacity * 0.7)})
            </text>
          </g>
        )}

        {/* Área suavizada */}
        {data.length > 1 && (
          <AreaClosed
            data={data}
            x={(d) => timeScale(d.date)}
            y={(d) => occupancyScale(d.occupancy)}
            yScale={occupancyScale}
            curve={curveMonotoneX}
            fill="url(#occupancy-gradient)"
          />
        )}

        {/* Línea continua de aforo */}
        {data.length > 1 && (
          <LinePath
            data={data}
            x={(d) => timeScale(d.date)}
            y={(d) => occupancyScale(d.occupancy)}
            curve={curveMonotoneX}
            stroke="#0f766e"
            strokeWidth={2.5}
          />
        )}

        {/* Puntos de datos */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={timeScale(d.date)}
            cy={occupancyScale(d.occupancy)}
            r={3}
            fill="#0f766e"
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        ))}

        {/* Ejes */}
        <AxisLeft
          scale={occupancyScale}
          stroke="#cbd5e1"
          tickStroke="#cbd5e1"
          tickLabelProps={() => ({
            fill: '#64748b',
            fontSize: 12,
            textAnchor: 'end',
            dx: -4,
            dy: 3,
          })}
        />

        <AxisBottom
          top={innerHeight}
          scale={timeScale}
          stroke="#cbd5e1"
          tickStroke="#cbd5e1"
          numTicks={5}
          tickFormat={(d) =>
            d instanceof Date
              ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
              : ''
          }
          tickLabelProps={() => ({
            fill: '#64748b',
            fontSize: 12,
            textAnchor: 'middle',
            dy: 4,
          })}
        />
      </g>
    </svg>
  );
};

export const LiveOccupancyChart: React.FC<LiveOccupancyChartProps> = ({
  logs,
  maxCapacity,
  placeName,
  isLoading = false,
  error,
  onRetry,
}) => {
  return (
    <figure className="w-full bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
        <div>
          <span className="font-bold text-slate-900 text-sm">
            Evolución de Aforo en Vivo — {placeName}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Telemetría en tiempo real desde nodo IoT</p>
        </div>
      </figcaption>

      {error && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-rose-700">
        <p>{error}</p><Button variant="outline" onClick={onRetry} disabled={isLoading}>Reintentar</Button>
      </div>}
      <div className="w-full h-56 pt-3" aria-busy={isLoading}>
        {isLoading && logs.length === 0 ? <div role="status" className="skeleton h-full w-full"><span className="sr-only">Cargando historial…</span></div> : logs.length > 0 ? (
          <ParentSize>
            {({ width, height }) => (
              <ChartContent
                width={width}
                height={height}
                logs={logs}
                maxCapacity={maxCapacity}
              />
            )}
          </ParentSize>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-sm text-slate-600">
            {error ? 'El historial no está disponible.' : 'Este nodo todavía no tiene registros de telemetría.'}
          </div>
        )}
      </div>
    </figure>
  );
};
