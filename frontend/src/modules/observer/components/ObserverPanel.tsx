import type { ReactNode } from 'react';

const statusBorders: Record<string, string> = {
  nominal: 'border-slate-200 hover:border-primary/40',
  warning: 'border-amber-500/30 hover:border-amber-500',
  critical: 'border-rose-500/30 hover:border-rose-500',
};

const statusDots: Record<string, string> = {
  nominal: 'bg-primary shadow-[0_0_8px_rgba(7,89,133,0.3)]',
  warning: 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  critical: 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]',
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
    <section className={`group relative overflow-hidden h-full rounded-[32px] border ${borderClass} bg-white p-10 shadow-sm transition-all hover:shadow-xl`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none" />
      
      {/* HUD Header */}
      <div className="relative z-10 flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusDots[status]}`} />
          <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">
            {eyebrow}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {metric && (
            <div className="flex flex-col items-end">
               <span className="text-[8px] font-heading font-black text-slate-300 uppercase tracking-widest">{metric.label}</span>
               <span className="text-sm font-heading font-black italic text-primary">{metric.value}</span>
            </div>
          )}
          {badge && (
            <span className="rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-1 text-[9px] font-heading font-black text-primary tracking-widest uppercase">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">
          {title}
        </h2>
        
        <div className="pt-2">
            {children}
        </div>
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
         <div className="w-12 h-12 border-b-2 border-r-2 border-slate-900 rounded-br-2xl" />
      </div>
    </section>
  );
}
