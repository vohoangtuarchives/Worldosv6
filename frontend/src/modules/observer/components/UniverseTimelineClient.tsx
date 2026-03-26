'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useObserverAutonomyAudit, useObserverUniverseChronicles, useObserverUniverseForks, useObserverUniverseSnapshots, useObserverUniverseTimeline } from '@/modules/observer/api';
import type { AutonomyAudit } from '@/modules/observer/contracts';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { BranchSummary, ChronicleEntry, SnapshotSummary, TimelineEvent } from '@/modules/observer/types';

function laneClass(highlighted: boolean) {
  return highlighted ? 'border-primary/40 bg-primary/10' : 'border-white/8 bg-background/35';
}

export function UniverseTimelineClient({
  universeId,
  initialTimeline,
  initialChronicles,
  initialSnapshots,
  initialForks,
  initialAutonomyAudit,
}: {
  universeId: string;
  initialTimeline: TimelineEvent[];
  initialChronicles: ChronicleEntry[];
  initialSnapshots: SnapshotSummary[];
  initialForks: BranchSummary[];
  initialAutonomyAudit?: AutonomyAudit;
}) {
  const searchParams = useSearchParams();
  const focusedTick = Number(searchParams.get('tick') ?? '');
  const timelineQuery = useObserverUniverseTimeline(universeId, initialTimeline);
  const chroniclesQuery = useObserverUniverseChronicles(universeId, initialChronicles);
  const snapshotsQuery = useObserverUniverseSnapshots(universeId, initialSnapshots);
  const forksQuery = useObserverUniverseForks(universeId, initialForks);
  const auditQuery = useObserverAutonomyAudit(universeId, initialAutonomyAudit);

  const timeline = timelineQuery.data ?? initialTimeline;
  const chronicles = chroniclesQuery.data ?? initialChronicles;
  const snapshots = snapshotsQuery.data ?? initialSnapshots;
  const forks = forksQuery.data ?? initialForks;
  const mutations = auditQuery.data?.chronicle ?? [];

  const interventions = [
    ...snapshots.map((snapshot) => ({ id: `snapshot-${snapshot.id}`, kind: 'Snapshot', tick: snapshot.tick, label: snapshot.label, summary: snapshot.note })),
    ...forks.map((fork) => ({ id: `fork-${fork.id}`, kind: 'Fork', tick: fork.divergenceTick, label: fork.label, summary: `Branch ${fork.status} now tracks tick ${fork.currentTick}.` })),
  ].sort((left, right) => right.tick - left.tick);

  const mutationLane = mutations
    .map((entry) => ({
      id: entry.dslHash,
      tick: entry.latestTick ?? -1,
      label: entry.dslPath ?? entry.dslHash,
      summary: entry.vector ?? entry.source,
      timestamp: entry.latestTimestamp,
      versionCount: entry.versionCount,
    }))
    .sort((left, right) => right.tick - left.tick);

  return (
    <div className="space-y-6">
      <ObserverPanel eyebrow="Divergence" title="Timeline of causality, intervention, and mutation">
        <div className="grid gap-6 xl:grid-cols-3">
          <Lane title="Causal ticks" description="Natural historian timeline facts flowing through the active branch.">
            {timelineQuery.isLoading && timeline.length === 0 ? <ObserverLoadingState lines={4} /> : null}
            {timelineQuery.isError && timeline.length === 0 ? (
              <ObserverErrorState title="Timeline is unavailable" description="The historian did not return timeline facts for this branch." onRetry={() => void timelineQuery.refetch()} />
            ) : null}
            {!timelineQuery.isLoading && timeline.length === 0 ? (
              <ObserverEmptyState title="No historical facts yet" description="Causal ticks will appear once the historian writes structured facts for this universe." />
            ) : null}
            {timeline.map((entry) => {
              const highlighted = Number.isFinite(focusedTick) && entry.tick === focusedTick;
              return (
                <article key={entry.id} className={`rounded-2xl border p-4 ${laneClass(highlighted)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-primary/70">{entry.category}</p>
                      <h3 className="mt-2 text-base font-semibold">Tick {entry.tick}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{entry.zone}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Link href={`/universes/${universeId}/chronicles?tick=${entry.tick}`} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary transition hover:bg-primary/20">
                      View related chronicles
                    </Link>
                  </div>
                </article>
              );
            })}
          </Lane>

          <Lane title="Interventions" description="Observer actions like snapshots and forks, separated from natural causality.">
            {snapshotsQuery.isLoading && forksQuery.isLoading && interventions.length === 0 ? <ObserverLoadingState lines={3} /> : null}
            {interventions.length === 0 ? (
              <ObserverEmptyState title="No interventions yet" description="Forks and snapshots will appear here after the observer starts intervening in the branch." />
            ) : (
              interventions.map((entry) => {
                const highlighted = Number.isFinite(focusedTick) && entry.tick === focusedTick;
                return (
                  <article key={entry.id} className={`rounded-2xl border p-4 ${laneClass(highlighted)}`}>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-primary/70">{entry.kind}</p>
                    <h3 className="mt-2 text-base font-semibold">{entry.label}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Tick {entry.tick}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <Link href={`/universes/${universeId}/control`} className="rounded-full border border-white/10 px-3 py-1 text-muted-foreground transition hover:bg-white/5 hover:text-white">
                        Open control surface
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </Lane>

          <Lane title="Mutations" description="Autopoietic self-rewrites persisted into the mutation chronicle.">
            {auditQuery.isLoading && mutationLane.length === 0 ? <ObserverLoadingState lines={3} /> : null}
            {auditQuery.isError && mutationLane.length === 0 ? (
              <ObserverErrorState title="Mutation lane is unavailable" description="The observer could not refresh the mutation chronicle for this branch." onRetry={() => void auditQuery.refetch()} />
            ) : null}
            {!auditQuery.isLoading && mutationLane.length === 0 ? (
              <ObserverEmptyState title="No self-mutations yet" description="When autopoiesis edits a DSL pack, it will show up here as a separate divergence lane." />
            ) : null}
            {mutationLane.map((entry) => {
              const highlighted = Number.isFinite(focusedTick) && entry.tick === focusedTick;
              return (
                <article key={entry.id} className={`rounded-2xl border p-4 ${laneClass(highlighted)}`}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-primary/70">AUTOPOIESIS_MUTATION</p>
                  <h3 className="mt-2 text-base font-semibold">{entry.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{entry.tick < 0 ? 'Tick unknown' : `Tick ${entry.tick}`}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'No timestamp'}</span>
                    <span>{entry.versionCount} versions</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Link href={`/universes/${universeId}/control`} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary transition hover:bg-primary/20">
                      Inspect diff in control
                    </Link>
                  </div>
                </article>
              );
            })}
          </Lane>
        </div>
      </ObserverPanel>

      <ObserverPanel eyebrow="Chronicles" title="Narrative echoes cross-linked from the same branch">
        {chroniclesQuery.isLoading && chronicles.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {chroniclesQuery.isError && chronicles.length === 0 ? (
          <ObserverErrorState title="Chronicle echoes are unavailable" description="The narrative archive could not be refreshed while comparing divergence lanes." onRetry={() => void chroniclesQuery.refetch()} />
        ) : null}
        {chronicles.length === 0 && !chroniclesQuery.isLoading ? (
          <ObserverEmptyState title="No chronicle synthesis yet" description="Chronicle entries will appear here once the narrative layer summarizes stretches of the timeline." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {chronicles.slice(0, 6).map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{entry.title}</h3>
                  <Link href={`/universes/${universeId}/timeline?tick=${entry.tick}`} className="text-xs font-mono text-primary/80 transition hover:text-primary">
                    Tick {entry.tick}
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
              </article>
            ))}
          </div>
        )}
      </ObserverPanel>
    </div>
  );
}

function Lane({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
