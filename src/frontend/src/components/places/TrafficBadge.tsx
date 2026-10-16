import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { type TrafficState } from '@/types';
import { Badge, cn } from '@/components/ui';

interface TrafficBadgeProps {
  state: TrafficState;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrafficBadge: React.FC<TrafficBadgeProps> = ({ state, showIcon = true, size = 'md', className }) => {
  const configs = {
    VERDE: {
      variant: 'green' as const,
      label: 'Acceso Libre',
      Icon: CheckCircle2,
      dot: false,
    },
    AMARILLO: {
      variant: 'yellow' as const,
      label: 'Aforo Moderado',
      Icon: AlertTriangle,
      dot: false,
    },
    ROJO: {
      variant: 'red' as const,
      label: 'Saturado',
      Icon: ShieldAlert,
      dot: false,
    },
  };

  const { variant, label, Icon, dot } = configs[state] || configs.VERDE;

  return (
    <Badge variant={variant} size={size} dot={dot} className={cn('uppercase tracking-wider py-1 min-w-32', className)}>
      {showIcon && <Icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </Badge>
  );
};
