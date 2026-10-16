import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
}

export const Card: React.FC<CardProps> = ({
  as: Component = 'article',
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <header className={cn('p-5 flex flex-col gap-1', className)} {...props}>
      {children}
    </header>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <section className={cn('p-5', className)} {...props}>
      {children}
    </section>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <footer
      className={cn('px-5 py-3.5 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </footer>
  );
};
