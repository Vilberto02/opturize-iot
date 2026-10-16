import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Badge, cn } from '@/components/ui';

interface BarrierBadgeProps {
  isOpen: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const BarrierBadge: React.FC<BarrierBadgeProps> = ({ isOpen, size = 'sm', className }) => {
  return (
    <Badge variant={isOpen ? 'green' : 'red'} size={size} className={cn('py-1.5 rounded-full px-4', className)}>
      {isOpen ? <Unlock aria-hidden="true" className="w-3 h-3" /> : <Lock aria-hidden="true" className="w-3 h-3" />}
      <span>{isOpen ? 'Talanquera Abierta' : 'Talanquera Bloqueada'}</span>
    </Badge>
  );
};
