import type { ReactNode } from 'react';

export function ObserverPanel({
  eyebrow,
  title,
  badge,
  children,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-card/45 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">{eyebrow}</p>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary tracking-wider uppercase">
            {badge}
          </span>
        )}
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
