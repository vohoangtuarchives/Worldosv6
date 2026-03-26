import { getObserverUniverseForksServer } from '@/modules/observer/api';
import { UniverseForksClient } from '@/modules/observer/components/UniverseForksClient';

export default async function UniverseForksPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const forks = await getObserverUniverseForksServer(universeId);

  return <UniverseForksClient universeId={universeId} initialForks={forks} />;
}
