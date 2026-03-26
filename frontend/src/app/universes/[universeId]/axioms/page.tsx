import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getObserverUniverseDetailServer } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';

export default async function UniverseAxiomsPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const universe = await getObserverUniverseDetailServer(universeId);

  if (!universe) {
    notFound();
  }

  return (
    <ObserverPanel eyebrow="Axioms" title="World parameters and directional drift">
      {universe.axioms.length === 0 ? (
        <ObserverEmptyState
          title="No explicit axioms were returned"
          description="This universe is observable, but the simulation has not published a structured axiom set yet. Once axioms are exposed, they will describe the baseline causal rules of the branch."
          action={
            <>
              <Link href={`/universes/${universeId}`} className="rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-sm transition hover:bg-white/5">
                Return to overview
              </Link>
              <Link href={`/universes/${universeId}/control`} className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20">
                Open control surface
              </Link>
            </>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {universe.axioms.map((axiom) => (
            <div key={axiom.key} className="rounded-2xl border border-white/8 bg-background/35 p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold capitalize">{axiom.key.replaceAll('_', ' ')}</h3>
                <span className="text-xs uppercase tracking-[0.24em] text-primary/80">{axiom.trend}</span>
              </div>
              <p className="mt-4 text-3xl font-semibold">{axiom.value.toFixed(2)}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {axiom.trend === 'up'
                  ? 'This parameter is intensifying relative to its baseline.'
                  : axiom.trend === 'down'
                    ? 'This parameter is cooling relative to its baseline.'
                    : 'This parameter is currently holding a stable posture.'}
              </p>
            </div>
          ))}
        </div>
      )}
    </ObserverPanel>
  );
}
