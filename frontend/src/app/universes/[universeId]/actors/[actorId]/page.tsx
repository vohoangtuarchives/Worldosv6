import { notFound } from 'next/navigation';
import {
  getObserverActorDecisionsServer,
  getObserverActorDetailServer,
  getObserverActorEventsServer,
  getObserverUniverseActorsServer,
} from '@/modules/observer/api';
import { UniverseActorDetailClient } from '@/modules/observer/components/UniverseActorDetailClient';

export default async function UniverseActorDetailPage({
  params,
}: {
  params: Promise<{ universeId: string; actorId: string }>;
}) {
  const { universeId, actorId } = await params;
  const [actor, actors, events, decisions] = await Promise.all([
    getObserverActorDetailServer(actorId),
    getObserverUniverseActorsServer(universeId),
    getObserverActorEventsServer(actorId),
    getObserverActorDecisionsServer(actorId),
  ]);

  const actorExistsInUniverse = actors.some((entry) => entry.id === actorId);
  if (!actor || !actorExistsInUniverse) {
    notFound();
  }

  return (
    <UniverseActorDetailClient
      actorId={actorId}
      initialActor={actor}
      initialEvents={events}
      initialDecisions={decisions}
    />
  );
}
