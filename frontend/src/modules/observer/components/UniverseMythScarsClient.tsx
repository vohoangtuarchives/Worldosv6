'use client';

import Link from 'next/link';
import { useObserverUniverseMythScars } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { MythScar } from '@/modules/observer/types';

const severityStyles: Record<'low' | 'medium' | 'high', string> = {
  low: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  medium: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  high: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
};

export function UniverseMythScarsClient({
  universeId,
  initialMythScars,
}: {
  universeId: string;
  initialMythScars: MythScar[];
}) {
  const mythScarsQuery = useObserverUniverseMythScars(universeId, initialMythScars);
  const mythScars = mythScarsQuery.data ?? initialMythScars;
  const severityCount = mythScars.reduce<Record<'low' | 'medium' | 'high', number>>(
    (accumulator, scar) => {
      accumulator[scar.severity] += 1;
      return accumulator;
    },
    { low: 0, medium: 0, high: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {(['high', 'medium', 'low'] as const).map((severity) => (
          <div key={severity} className="rounded-2xl border border-white/10 bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{severity} severity</p>
            <p className="mt-2 text-2xl font-semibold">{severityCount[severity]}</p>
          </div>
        ))}
      </div>

      <ObserverPanel eyebrow="Myth Scars" title="Long-memory disturbances still shaping the world">
        {mythScarsQuery.isLoading && mythScars.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {mythScarsQuery.isError && mythScars.length === 0 ? (
          <ObserverErrorState
            title="Myth scars are unavailable"
            description="The observer could not refresh unresolved myth-scar data for this branch."
            onRetry={() => {
              void mythScarsQuery.refetch();
            }}
          />
        ) : null}
        {!mythScarsQuery.isLoading && mythScars.length === 0 ? (
          <ObserverEmptyState
            title="No myth scars are active"
            description="This branch does not currently expose unresolved myth scars. Persistent narrative trauma and long-memory disturbances will appear here once detected by the simulation."
            action={
              <Link href={`/universes/${universeId}/timeline`} className="rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-sm transition hover:bg-white/5">
                Inspect divergence timeline
              </Link>
            }
          />
        ) : null}
        {mythScars.length > 0 ? (
          <div className="space-y-4">
            {mythScars.map((scar) => (
              <article key={scar.id} className="rounded-2xl border border-white/8 bg-background/35 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{scar.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Origin tick: {scar.originTick.toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${severityStyles[scar.severity]}`}>
                    {scar.severity} / {(scar.severityScore * 100).toFixed(0)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{scar.consequence}</p>
              </article>
            ))}
          </div>
        ) : null}
      </ObserverPanel>
    </div>
  );
}
