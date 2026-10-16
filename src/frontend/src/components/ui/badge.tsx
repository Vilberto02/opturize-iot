import React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'yellow' | 'red' | 'neutral' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-semibold rounded-full transition-colors select-none';

  const variants = {
    green: 'bg-emerald-50/90 text-emerald-800 border border-emerald-300/90 shadow-2xs shadow-emerald-500/10',
    yellow: 'bg-amber-50/90 text-amber-900 border border-amber-300 shadow-2xs shadow-amber-500/10',
    red: 'bg-rose-50/90 text-rose-900 border border-rose-300 shadow-2xs shadow-rose-500/10',
    neutral: 'bg-slate-100/90 text-slate-700 border border-slate-200/90 shadow-2xs',
    brand: 'bg-teal-50/90 text-teal-900 border border-teal-300 shadow-2xs shadow-teal-500/10',
  };

  const dotColors = {
    green: 'bg-emerald-500 ring-emerald-200',
    yellow: 'bg-amber-500 ring-amber-200',
    red: 'bg-rose-500 ring-rose-200',
    neutral: 'bg-slate-400 ring-slate-200',
    brand: 'bg-teal-500 ring-teal-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full ring-2 shrink-0 animate-pulse',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
