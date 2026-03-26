import type { ReactNode } from 'react';

export function ObserverEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-dashed border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Observer guidance</p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">{title}</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
        {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}
