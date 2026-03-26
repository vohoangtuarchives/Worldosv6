import { getObserverUniverseChroniclesServer } from '@/modules/observer/api';
import { UniverseChroniclesClient } from '@/modules/observer/components/UniverseChroniclesClient';

export default async function UniverseChroniclesPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const chronicles = await getObserverUniverseChroniclesServer(universeId);

  return <UniverseChroniclesClient universeId={universeId} initialChronicles={chronicles} />;
}
