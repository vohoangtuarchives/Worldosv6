import { getObserverUniverseSnapshotsServer } from '@/modules/observer/api';
import { UniverseSnapshotsClient } from '@/modules/observer/components/UniverseSnapshotsClient';

export default async function UniverseSnapshotsPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const snapshots = await getObserverUniverseSnapshotsServer(universeId);

  return <UniverseSnapshotsClient universeId={universeId} initialSnapshots={snapshots} />;
}
