import React from 'react';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}, ref) => {
  const baseStyles =
    'inline-flex min-h-11 items-center justify-center font-semibold rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-600 shadow-sm shadow-teal-600/25 border border-teal-700',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700 shadow-sm shadow-slate-900/20 border border-slate-800',
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-teal-500 shadow-2xs',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-600/25 border border-rose-500/30',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm shadow-emerald-600/25 border border-emerald-500/30',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
  };

  const sizes = {
    sm: 'h-11 text-sm px-3 gap-1.5',
    md: 'h-11 text-sm px-4 gap-2',
    lg: 'h-12 text-base px-6 gap-2.5',
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-busy={isLoading || undefined}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span aria-hidden="true" className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 motion-reduce:animate-none" />
      ) : null}
      {children}
    </button>
  );
});
Button.displayName = 'Button';
