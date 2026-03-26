import React, { useState } from 'react';
import Link from 'next/link';
import { useObserverUniverseActors } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import ActorDeepDiveSidebar from '@/modules/observer/components/ActorDeepDiveSidebar';
import type { ActorSummary, ActorDetail } from '@/modules/observer/types';

export function UniverseActorsClient({
  universeId,
  initialActors,
}: {
  universeId: string;
  initialActors: ActorSummary[];
}) {
  const [selectedActor, setSelectedActor] = useState<ActorDetail | null>(null);
  const actorsQuery = useObserverUniverseActors(universeId, initialActors);
  const actors = actorsQuery.data ?? initialActors;

  const handleActorClick = (summary: ActorSummary) => {
    // Map summary to a detail object (mocking biography/metrics for now)
    setSelectedActor({
      ...summary,
      biography: `A key entity identified as ${summary.name}, operating in the role of ${summary.role}. Recent decisions indicate an alignment toward ${summary.alignment}.`,
      traits: {},
      metrics: { entropy: Math.random() * 0.5 + 0.2 },
      stats: {},
      capabilities: {},
      vitality: {},
      lifeStage: 'Adult',
      isAlive: true,
      birthTick: 0,
      deathTick: null,
      supremeEntity: null,
      recentEvents: []
    });
  };
  const totalInfluence = actors.reduce((sum, actor) => sum + actor.influence, 0);
  const averageInfluence = actors.length > 0 ? totalInfluence / actors.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Actors</p>
          <p className="mt-2 text-2xl font-semibold">{actors.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Average Influence</p>
          <p className="mt-2 text-2xl font-semibold">{averageInfluence.toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Most Recent Voice</p>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{actors[0]?.lastDecision ?? 'No decision trail yet.'}</p>
        </div>
      </div>

      <ObserverPanel eyebrow="Actors" title="Key agents and their latest decisions">
        {actorsQuery.isLoading && actors.length === 0 ? <ObserverLoadingState lines={4} /> : null}
        {actorsQuery.isError && actors.length === 0 ? (
          <ObserverErrorState
            title="Actor index is unavailable"
            description="The intelligence layer did not return actor data for this branch."
            onRetry={() => {
              void actorsQuery.refetch();
            }}
          />
        ) : null}
        {!actorsQuery.isLoading && actors.length === 0 ? (
          <ObserverEmptyState
            title="No actors are indexed for this universe"
            description="The branch is alive, but no observer-readable actor directory has been published yet. Advance the simulation or inspect control workflows to prompt new decision trails."
            action={
              <>
                <Link href={`/universes/${universeId}/control`} className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20">
                  Open control surface
                </Link>
                <Link href={`/universes/${universeId}/timeline`} className="rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-sm transition hover:bg-white/5">
                  Inspect timeline
                </Link>
              </>
            }
          />
        ) : null}
        {actors.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {actors.map((actor) => (
              <button
                key={actor.id}
                onClick={() => handleActorClick(actor)}
                className="block w-full text-left rounded-2xl border border-white/8 bg-background/35 p-5 transition hover:border-primary/30 hover:bg-background/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{actor.name}</h3>
                    <p className="mt-1 text-sm text-primary/80">{actor.role}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs font-mono text-muted-foreground">
                    Influence {actor.influence.toFixed(1)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground/85">{actor.alignment}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{actor.lastDecision}</p>
              </button>
            ))}
          </div>
        ) : null}
      </ObserverPanel>

      <ActorDeepDiveSidebar 
        actor={selectedActor} 
        onClose={() => setSelectedActor(null)} 
      />
    </div>
  );
}
