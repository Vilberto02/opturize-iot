import React from 'react';
import { Activity, Clock3, Sparkles, Navigation, Bell, ArrowRight, ShieldCheck, MapPin, Flag } from 'lucide-react';
import { type FoggRecommendationItem } from '@/types';
import { Card, CardHeader, CardContent, CardFooter, Badge, Button, cn } from '@/components/ui';

interface FoggRecommendationCardProps {
  item: FoggRecommendationItem;
  onSelectTarget?: (placeId: number) => void;
}

export const FoggRecommendationCard: React.FC<FoggRecommendationCardProps> = ({
  item,
  onSelectTarget,
}) => {
  const { origin_place, recommended_place, fogg_model } = item;
  const isHighPriority = fogg_model.trigger_priority === 'ALTO';
  const priorityLabel = isHighPriority
    ? 'alta'
    : fogg_model.trigger_priority === 'MEDIO'
      ? 'media'
      : fogg_model.trigger_priority === 'BAJO'
        ? 'baja'
        : fogg_model.trigger_priority;
  const insights = [
    {
      title: 'Motivación · Beneficio cultural y confort',
      description: fogg_model.motivation_short?.trim() || fogg_model.motivation,
      Icon: Sparkles,
      iconClassName: 'bg-violet-50 text-violet-600',
    },
    {
      title: 'Habilidad · Acceso y transporte',
      description: fogg_model.ability_short?.trim() || fogg_model.ability,
      Icon: Navigation,
      iconClassName: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Disparador · Momento oportuno',
      description: fogg_model.trigger_short?.trim() || fogg_model.trigger,
      Icon: Bell,
      iconClassName: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <Card
      as="article"
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border-[#DCE7E5] bg-white text-slate-900 shadow-panel"
    >
      <div className="flex flex-1 flex-col gap-[18px] px-[22px] pb-[22px] pt-5">
        <CardHeader className="gap-[18px] p-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge className="gap-1.5 border-0 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold leading-normal text-indigo-700 shadow-none">
              <Activity aria-hidden="true" className="h-3 w-3 shrink-0 text-indigo-600" />
              <span>Score Fogg {(fogg_model.fogg_score * 100).toFixed(0)}/100</span>
            </Badge>
            <Badge
              variant={isHighPriority ? 'red' : 'yellow'}
              className={cn(
                'gap-1.5 border-0 px-2.5 py-1.5 text-xs font-semibold leading-normal shadow-none',
                isHighPriority ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-yellow-700',
              )}
            >
              <Clock3 aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span>Prioridad {priorityLabel}</span>
            </Badge>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[21px] font-bold leading-[25px] tracking-[-0.3px]">
              Ruta alternativa recomendada
            </h3>
            <p className="text-sm leading-[19px] text-slate-500">
              Menos congestión, la misma riqueza cultural.
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-[18px] p-0">
          <div className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600">
                <MapPin aria-hidden="true" className="h-[15px] w-[15px]" />
              </div>
              <div className="min-w-0 flex-1 space-y-[3px]">
                <p className="text-xs font-bold leading-normal tracking-[0.7px] text-rose-700">
                  ORIGEN · {origin_place.occupancy_percentage.toFixed(0)}% DE AFORO
                </p>
                <p className="break-words text-sm font-bold leading-5">{origin_place.name}</p>
              </div>
            </div>
            <div aria-hidden="true" className="flex items-center gap-3">
              <div className="flex w-8 shrink-0 justify-center">
                <div className="h-[18px] w-px bg-teal-200" />
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-teal-100 text-teal-600">
                <Flag aria-hidden="true" className="h-[15px] w-[15px]" />
              </div>
              <div className="min-w-0 flex-1 space-y-[3px]">
                <p className="text-xs font-bold leading-normal tracking-[0.7px] text-teal-700">
                  DESTINO RECOMENDADO
                </p>
                <p className="break-words text-sm font-bold leading-5">{recommended_place.name}</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#E8EEF2]">
            {insights.map(({ title, description, Icon, iconClassName }) => (
              <div key={title} className="flex items-start gap-3 py-3">
                <div className={cn('flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px]', iconClassName)}>
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-sm font-bold leading-4">{title}</h4>
                  <p className="break-words text-xs leading-5 text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
            <Badge className="min-w-0 gap-1.5 border-0 bg-slate-50 px-2.5 py-1.5 text-xs leading-normal text-slate-500 shadow-none">
              <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="break-words">{recommended_place.district}</span>
            </Badge>
            <Badge variant="green" className="gap-1.5 border-0 bg-emerald-50 px-2.5 py-1.5 text-xs leading-normal text-emerald-700 shadow-none">
              <ShieldCheck aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span>{recommended_place.available_capacity} cupos libres</span>
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="p-0">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="group h-auto min-h-12 w-full gap-2 whitespace-normal border-0 px-4 py-3 text-sm font-bold tracking-[0.1px] shadow-[0_4px_10px_#0D94882B] transition-colors"
            onClick={() => onSelectTarget && onSelectTarget(recommended_place.id)}
          >
            <span className="min-w-0 break-words">{fogg_model.cta_button || 'Trazar Ruta y Explorar'}</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};
