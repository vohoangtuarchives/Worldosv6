'use client';

import Link from 'next/link';
import { useObserverUniverseChronicles, useObserverUniverseDetail, useObserverRealityPulse } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { RealityPulse } from '@/modules/observer/components/RealityPulse';
import { MutationStream } from '@/modules/observer/components/MutationStream';
import { AiDiagnosticsLab } from '@/modules/observer/components/AiDiagnosticsLab';
import type { ChronicleEntry, UniverseDetail } from '@/modules/observer/types';

export function UniverseOverviewClient({
  universeId,
  initialUniverse,
  initialChronicles,
}: {
  universeId: string;
  initialUniverse: UniverseDetail;
  initialChronicles: ChronicleEntry[];
}) {
  const universeQuery = useObserverUniverseDetail(universeId, initialUniverse);
  const chroniclesQuery = useObserverUniverseChronicles(universeId, initialChronicles);
  const pulseQuery = useObserverRealityPulse(universeId);

  if (universeQuery.isError && !universeQuery.data) {
    return (
      <ObserverErrorState
        title="Universe detail could not be loaded"
        description="The observer workspace could not refresh the latest universe posture."
        onRetry={() => {
          void universeQuery.refetch();
        }}
      />
    );
  }

  if (!universeQuery.data) {
    return <ObserverLoadingState lines={3} />;
  }

  const universe = universeQuery.data;
  const chronicles = chroniclesQuery.data ?? initialChronicles;
  const pulse = pulseQuery.data;

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-[1fr_240px]">
          <ObserverPanel eyebrow="Situation" title="Current causal posture">
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>{universe.focus}</p>
              <p>
                This workspace now refreshes by resource, so chronicles, forks, snapshots, and control mutations can evolve
                independently without forcing a full route refresh.
              </p>
            </div>
          </ObserverPanel>

          <ObserverPanel eyebrow="Vitals" title="Reality Health">
             <div className="flex h-full items-center justify-center py-4">
                <RealityPulse 
                  entropy={pulse?.entropy ?? universe.entropy} 
                  stability={pulse?.stabilityIndex ?? (universe.stability / 100)} 
                />
             </div>
          </ObserverPanel>
        </div>

        <ObserverPanel eyebrow="Narrative" title="Recent chronicles">
          {chroniclesQuery.isLoading && chronicles.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {chroniclesQuery.isError && chronicles.length === 0 ? (
            <ObserverErrorState
              title="Chronicle archive is unavailable"
              description="The narrative layer did not return chronicle data for this branch."
              onRetry={() => {
                void chroniclesQuery.refetch();
              }}
            />
          ) : null}
          {!chroniclesQuery.isLoading && chronicles.length === 0 ? (
            <ObserverEmptyState
              title="No chronicle archive yet"
              description="The simulation has not emitted narrative synthesis for this branch yet. Once chronicles are generated, this archive will become the story-facing layer of the universe."
            />
          ) : null}
          {chronicles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {chronicles.slice(0, 4).map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-white/8 bg-background/35 p-4 transition hover:border-primary/20">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold">{entry.title}</h3>
                    <Link href={`/universes/${universeId}/chronicles?tick=${entry.tick}`} className="text-xs font-mono text-primary/80 transition hover:text-primary">
                      TICK {entry.tick}
                    </Link>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{entry.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>

        <ObserverPanel eyebrow="Axioms" title="Baseline world parameters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {universe.axioms.map((axiom) => (
              <div key={axiom.key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-background/35 px-4 py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{axiom.key}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{axiom.trend}</p>
                </div>
                <p className="text-sm font-mono text-primary">{axiom.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </ObserverPanel>

        <AiDiagnosticsLab />
      </div>

      <div className="space-y-6">
        <MutationStream universeId={universeId} />

        <ObserverPanel eyebrow="Live concerns" title="Signals (Focus)">
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex items-center justify-between">
              <span>Anomaly Clusters</span>
              <span className="font-mono text-white">{universe.anomalyCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Active Branches</span>
              <span className="font-mono text-white">{universe.branchCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Chronicle Archive</span>
              <span className="font-mono text-white">{chronicles.length}</span>
            </li>
          </ul>
        </ObserverPanel>
      </div>
    </div>
  );
}
