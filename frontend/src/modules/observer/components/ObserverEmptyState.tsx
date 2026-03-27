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
    <div className="overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600/70">Hướng dẫn Quan sát</p>
        <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900 sm:text-2xl uppercase">{title}</h3>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-400 italic">{description}</p>
        {action ? <div className="mt-8 flex flex-wrap items-center justify-center gap-4">{action}</div> : null}
      </div>
    </div>
  );
}
