'use client';

import Link from 'next/link';
import { useObserverUniverseSnapshots } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { SnapshotSummary } from '@/modules/observer/types';

export function UniverseSnapshotsClient({
  universeId,
  initialSnapshots,
}: {
  universeId: string;
  initialSnapshots: SnapshotSummary[];
}) {
  const snapshotsQuery = useObserverUniverseSnapshots(universeId, initialSnapshots);
  const snapshots = snapshotsQuery.data ?? initialSnapshots;

  return (
    <ObserverPanel eyebrow="Snapshots" title="State capture checkpoints">
      {snapshotsQuery.isLoading && snapshots.length === 0 ? <ObserverLoadingState lines={3} /> : null}
      {snapshotsQuery.isError && snapshots.length === 0 ? (
        <ObserverErrorState
          title="Snapshots are unavailable"
          description="The observer could not refresh checkpoint snapshots for this branch."
          onRetry={() => {
            void snapshotsQuery.refetch();
          }}
        />
      ) : null}
      {!snapshotsQuery.isLoading && snapshots.length === 0 ? (
        <ObserverEmptyState
          title="No snapshots have been captured"
          description="This branch has not published checkpoint snapshots yet. Capture one from the control surface to create a stable reference for future forks and audits."
          action={
            <Link href={`/universes/${universeId}/control`} className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20">
              Create from control surface
            </Link>
          }
        />
      ) : null}
      {snapshots.length > 0 ? (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <article key={snapshot.id} className="rounded-2xl border border-white/8 bg-background/35 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{snapshot.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{snapshot.capturedAt}</p>
                </div>
                <span className="text-xs font-mono text-primary/80">TICK {snapshot.tick.toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{snapshot.note}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Entropy</p>
                  <p className="mt-2 text-sm font-mono text-primary">{snapshot.entropy.toFixed(3)}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Stability</p>
                  <p className="mt-2 text-sm font-mono text-primary">{snapshot.stabilityIndex.toFixed(3)}</p>
                </div>
                {Object.entries(snapshot.metrics)
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{key}</p>
                      <p className="mt-2 text-sm font-mono text-primary">{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
                    </div>
                  ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </ObserverPanel>
  );
}
