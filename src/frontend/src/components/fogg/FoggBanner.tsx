import React from 'react';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { type FoggRecommendationItem } from '@/types';
import { Button, Badge } from '@/components/ui';

interface FoggBannerProps {
  recommendation: FoggRecommendationItem;
  onExplore: (rec: FoggRecommendationItem) => void;
}

export const FoggBanner: React.FC<FoggBannerProps> = ({ recommendation, onExplore }) => {
  const isUrgent =
    recommendation.origin_place.traffic_state === 'ROJO' ||
    recommendation.fogg_model.trigger_priority === 'ALTO';

  const origin = recommendation.origin_place;
  const target = recommendation.recommended_place;
  const fogg = recommendation.fogg_model;

  return (
    <aside
      role="region"
      aria-label="Aviso persuasivo de descongestión turística"
      className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
        isUrgent
          ? 'bg-rose-50/95 border-rose-300/80 text-rose-950 shadow-rose-500/5'
          : 'bg-amber-50/95 border-amber-300/80 text-amber-950 shadow-amber-500/5'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isUrgent ? 'red' : 'yellow'} size="sm" dot={true}>
                {isUrgent ? 'Saturación Crítica' : 'Aforo Elevado'}
              </Badge>
              <strong className="text-base font-bold text-slate-900">{origin.name}</strong>
              <span className="text-xs font-mono font-semibold text-slate-500">
                ({origin.current_occupancy}/{origin.max_capacity} personas · {origin.occupancy_percentage.toFixed(0)}%)
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-700">
              {fogg.trigger}{' '}
              <span className="font-bold text-teal-800 underline underline-offset-2">
                Recomendamos visitar {target.name} ({target.district})
              </span>
              {' '}— a solo <span className="font-semibold">{fogg.distance_km} km</span> ({fogg.estimated_transit_minutes} min en transporte).
            </p>
          </div>
        </div>

        <Button
          variant={isUrgent ? 'danger' : 'primary'}
          size="md"
          onClick={() => onExplore(recommendation)}
          className="shrink-0 text-xs font-bold shadow-sm"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          <span>Explorar Alternativa</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </aside>
  );
};
