import React from 'react';
import { cn } from './utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'green' | 'yellow' | 'red' | 'brand';
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'brand',
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const fillColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    brand: 'bg-teal-500',
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('w-full bg-slate-100 rounded-full h-2.5 overflow-hidden', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-out rounded-full', fillColors[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
