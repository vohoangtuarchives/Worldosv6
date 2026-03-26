'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useObserverBranchComparison, useObserverUniverseForks } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { BranchSummary } from '@/modules/observer/types';

export function UniverseForksClient({
  universeId,
  initialForks,
}: {
  universeId: string;
  initialForks: BranchSummary[];
}) {
  const forksQuery = useObserverUniverseForks(universeId, initialForks);
  const forks = forksQuery.data ?? initialForks;
  const [selectedBranchIdState, setSelectedBranchId] = useState<string | null>(initialForks[0]?.id ?? null);
  const selectedBranchId = selectedBranchIdState ?? forks[0]?.id ?? null;
  const comparisonQuery = useObserverBranchComparison(universeId, selectedBranchId);

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <ObserverPanel eyebrow="Forks" title="Parallel trajectories derived from this universe">
        {forksQuery.isLoading && forks.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {forksQuery.isError && forks.length === 0 ? (
          <ObserverErrorState
            title="Forks are unavailable"
            description="The observer could not refresh derived branches for this universe."
            onRetry={() => {
              void forksQuery.refetch();
            }}
          />
        ) : null}
        {!forksQuery.isLoading && forks.length === 0 ? (
          <ObserverEmptyState
            title="No derived branches yet"
            description="This universe has not forked into parallel trajectories. Create a branch from the control surface when you want to compare counterfactual outcomes without rewriting the active line."
            action={
              <Link href={`/universes/${universeId}/control`} className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20">
                Create branch from control
              </Link>
            }
          />
        ) : null}
        {forks.length > 0 ? (
          <div className="space-y-4">
            {forks.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`w-full rounded-2xl border bg-background/35 p-5 text-left transition ${selectedBranchId === branch.id ? 'border-primary/30' : 'border-white/8 hover:border-white/15'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{branch.label}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Divergence tick: {branch.divergenceTick.toLocaleString()}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs uppercase tracking-[0.22em] text-primary/80">
                    {branch.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Current branch tick: {branch.currentTick.toLocaleString()}</p>
              </button>
            ))}
          </div>
        ) : null}
      </ObserverPanel>

      <ObserverPanel eyebrow="Compare" title="Branch divergence summary">
        {!selectedBranchId ? (
          <ObserverEmptyState
            title="Select a branch to compare"
            description="When at least one fork exists, this panel will highlight entropy, stability, and metric deltas against the source universe."
          />
        ) : null}
        {comparisonQuery.isLoading && selectedBranchId ? <ObserverLoadingState lines={2} /> : null}
        {comparisonQuery.isError && selectedBranchId ? (
          <ObserverErrorState
            title="Branch comparison failed"
            description="The comparison endpoint could not produce a diff for the selected branch."
            onRetry={() => {
              void comparisonQuery.refetch();
            }}
          />
        ) : null}
        {comparisonQuery.data ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Tick Span</p>
                <p className="mt-2 text-2xl font-semibold">{comparisonQuery.data.tickSpan.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Entropy Delta</p>
                <p className="mt-2 text-2xl font-semibold">{comparisonQuery.data.deltas.entropy.toFixed(3)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Stability Delta</p>
                <p className="mt-2 text-2xl font-semibold">{comparisonQuery.data.deltas.stabilityIndex.toFixed(3)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Current Tick Delta</p>
                <p className="mt-2 text-2xl font-semibold">{comparisonQuery.data.deltas.currentTick.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(comparisonQuery.data.metricDeltas).slice(0, 6).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-background/35 px-4 py-3">
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <p className="text-sm font-mono text-primary">{value.toFixed(3)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ObserverPanel>
    </div>
  );
}
