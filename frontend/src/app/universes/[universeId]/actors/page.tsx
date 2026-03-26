import { getObserverUniverseActorsServer } from '@/modules/observer/api';
import { UniverseActorsClient } from '@/modules/observer/components/UniverseActorsClient';

export default async function UniverseActorsPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const actors = await getObserverUniverseActorsServer(universeId);

  return <UniverseActorsClient universeId={universeId} initialActors={actors} />;
}
