'use client';

import { useObserverActorDecisions, useObserverActorDetail, useObserverActorEvents } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { ActorDecision, ActorDetail, ActorEventEntry } from '@/modules/observer/types';

export function UniverseActorDetailClient({
  actorId,
  initialActor,
  initialEvents,
  initialDecisions,
}: {
  actorId: string;
  initialActor: ActorDetail;
  initialEvents: ActorEventEntry[];
  initialDecisions: ActorDecision[];
}) {
  const actorQuery = useObserverActorDetail(actorId, initialActor);
  const eventsQuery = useObserverActorEvents(actorId, initialEvents);
  const decisionsQuery = useObserverActorDecisions(actorId, initialDecisions);

  if (actorQuery.isError && !actorQuery.data) {
    return (
      <ObserverErrorState
        title="Actor detail is unavailable"
        description="The observer could not load the current actor profile."
        onRetry={() => {
          void actorQuery.refetch();
        }}
      />
    );
  }

  if (!actorQuery.data) {
    return <ObserverLoadingState lines={3} />;
  }

  const actor = actorQuery.data;
  const visibleEvents = (eventsQuery.data ?? initialEvents).length > 0 ? eventsQuery.data ?? initialEvents : actor.recentEvents;
  const decisions = decisionsQuery.data ?? initialDecisions;
  const traitEntries = Object.entries(actor.traits).slice(0, 6);

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <div className="space-y-6">
        <ObserverPanel eyebrow="Actor profile" title={actor.name}>
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>{actor.biography}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Role</p>
                <p className="mt-2 text-base font-semibold text-foreground">{actor.role}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Alignment</p>
                <p className="mt-2 text-base font-semibold text-foreground">{actor.alignment}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Life Stage</p>
                <p className="mt-2 text-base font-semibold text-foreground">{actor.lifeStage}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                <p className="mt-2 text-base font-semibold text-foreground">{actor.isAlive ? 'Alive' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </ObserverPanel>

        <ObserverPanel eyebrow="Decision trail" title="Recent reasoning outputs">
          {decisionsQuery.isLoading && decisions.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {decisionsQuery.isError && decisions.length === 0 ? (
            <ObserverErrorState
              title="Decision trail is unavailable"
              description="The actor reasoning history could not be refreshed."
              onRetry={() => {
                void decisionsQuery.refetch();
              }}
            />
          ) : null}
          {!decisionsQuery.isLoading && decisions.length === 0 ? (
            <ObserverEmptyState
              title="No decision trail available"
              description="This actor has not published any retrievable decisions yet. Once reasoning traces are stored, they will appear here with confidence and utility scores."
            />
          ) : null}
          {decisions.length > 0 ? (
            <div className="space-y-3">
              {decisions.map((decision) => (
                <article key={decision.id} className="rounded-2xl border border-white/8 bg-background/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold capitalize">{decision.actionType.replaceAll('_', ' ')}</h3>
                    <span className="text-xs font-mono text-primary/80">Tick {decision.tick.toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{decision.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1">
                      Confidence {(decision.confidence * 100).toFixed(0)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1">
                      Utility {decision.utilityScore.toFixed(2)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>
      </div>

      <div className="space-y-6">
        <ObserverPanel eyebrow="Influence" title="Decision weight and traits">
          <div className="rounded-3xl border border-white/8 bg-background/35 p-6">
            <p className="text-4xl font-semibold text-primary">{actor.influence.toFixed(1)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Influence score inferred from actor metrics, supreme-entity linkage, and decision pressure.</p>
          </div>
          {traitEntries.length > 0 ? (
            <div className="mt-4 space-y-3">
              {traitEntries.map(([trait, value]) => (
                <div key={trait} className="flex items-center justify-between rounded-2xl border border-white/8 bg-background/35 px-4 py-3">
                  <p className="text-sm font-medium capitalize">{trait.replaceAll('_', ' ')}</p>
                  <p className="text-sm font-mono text-primary">{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </ObserverPanel>

        <ObserverPanel eyebrow="Events" title="Recent life events">
          {eventsQuery.isLoading && visibleEvents.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {eventsQuery.isError && visibleEvents.length === 0 ? (
            <ObserverErrorState
              title="Actor events are unavailable"
              description="The actor event timeline could not be refreshed."
              onRetry={() => {
                void eventsQuery.refetch();
              }}
            />
          ) : null}
          {!eventsQuery.isLoading && visibleEvents.length === 0 ? (
            <ObserverEmptyState
              title="No actor events recorded"
              description="Once the actor timeline is available, this panel will show milestone events that explain the current posture and decisions."
            />
          ) : null}
          {visibleEvents.length > 0 ? (
            <div className="space-y-3">
              {visibleEvents.slice(0, 6).map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/8 bg-background/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold capitalize">{event.type.replaceAll('_', ' ')}</h3>
                    <span className="text-xs font-mono text-muted-foreground">Tick {event.tick.toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>
      </div>
    </div>
  );
}
