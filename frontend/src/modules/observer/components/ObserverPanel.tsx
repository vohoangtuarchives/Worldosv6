import type { ReactNode } from 'react';

const statusBorders: Record<string, string> = {
  nominal: 'border-primary/20 hover:border-primary/40',
  warning: 'border-yellow-500/20 hover:border-yellow-500/40',
  critical: 'border-destructive/20 hover:border-destructive/40',
};

const statusDots: Record<string, string> = {
  nominal: 'bg-primary',
  warning: 'bg-yellow-500 animate-pulse',
  critical: 'bg-destructive animate-pulse',
};

export function ObserverPanel({
  eyebrow,
  title,
  badge,
  status = 'nominal',
  metric,
  children,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  status?: 'nominal' | 'warning' | 'critical';
  metric?: { value: string; label: string };
  children: ReactNode;
}) {
  const borderClass = statusBorders[status] ?? statusBorders.nominal;

  return (
    <section className={`group relative overflow-hidden rounded-xl border ${borderClass} bg-white p-5 shadow-sm transition-all hover:shadow-md sm:p-6`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Thanh trạng thái trên cùng */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDots[status]}`} />
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-slate-500 font-medium">{eyebrow}</p>
        </div>
        <div className="flex items-center gap-3">
          {metric && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <span className="text-sm font-mono font-bold text-sky-600">{metric.value}</span>
            </div>
          )}
          {badge && (
            <span className="rounded-sm border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-600 tracking-wider uppercase">
              {badge}
            </span>
          )}
        </div>
      </div>

      <h2 className="mt-2 font-display text-lg font-bold tracking-wider uppercase text-slate-900 sm:text-xl">
        {title}
      </h2>
      <div className="relative z-10 mt-5">{children}</div>
    </section>
  );
}
