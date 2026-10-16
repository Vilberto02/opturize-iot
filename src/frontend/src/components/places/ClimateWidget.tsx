import React from 'react';
import { Thermometer, Droplets } from 'lucide-react';
import { cn } from '@/components/ui';

interface ClimateWidgetProps {
  temperature?: number | null;
  humidity?: number | null;
  className?: string;
}

export const ClimateWidget: React.FC<ClimateWidgetProps> = ({
  temperature,
  humidity,
  className = '',
}) => {
  const hasTemp = temperature !== null && temperature !== undefined;
  const hasHum = humidity !== null && humidity !== undefined;

  return (
    <figure
      className={cn('inline-flex items-center gap-3 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs', className)}
    >
      <div className="flex items-center gap-1.5 font-medium text-slate-700" title="Temperatura ambiental">
        <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <data value={hasTemp ? temperature : 0} className="font-semibold text-xs">
          {hasTemp ? `${temperature.toFixed(1)} °C` : '-- °C'}
        </data>
      </div>
      <span className="text-slate-300">|</span>
      <div className="flex items-center gap-1.5 font-medium text-slate-700" title="Humedad relativa">
        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        <data value={hasHum ? humidity : 0} className="font-semibold text-xs">
          {hasHum ? `${humidity.toFixed(0)} %` : '-- %'}
        </data>
      </div>
    </figure>
  );
};
