import { AlertCircle, SearchX, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface DataStateProps {
  title: string;
  description?: string;
  error?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
}

export function DataState({ title, description, error, actionLabel, onAction, busy }: DataStateProps) {
  const Icon = error ? AlertCircle : SearchX;
  return (
    <div role={error ? 'alert' : 'status'} className="data-state">
      <Icon aria-hidden="true" className={error ? 'h-6 w-6 text-rose-600' : 'h-6 w-6 text-slate-500'} />
      <div className="max-w-lg space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="text-sm leading-relaxed text-slate-600">{description}</p>}
      </div>
      {onAction && <Button variant="outline" onClick={onAction} disabled={busy}>
        {error && <RefreshCw aria-hidden="true" className="h-4 w-4" />}{actionLabel || 'Reintentar'}
      </Button>}
    </div>
  );
}

export function LoadingCards({ count = 3 }: { count?: number }) {
  return <div role="status" aria-label="Cargando información" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <span className="sr-only">Cargando información…</span>
    {Array.from({ length: count }, (_, index) => <div key={index} aria-hidden="true" className="surface-panel space-y-5 p-5">
      <div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-28 w-full" /><div className="skeleton h-11 w-full" />
    </div>)}
  </div>;
}
