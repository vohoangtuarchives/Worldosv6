import {
  getObserverAutonomyAuditServer,
  getObserverUniverseChroniclesServer,
  getObserverUniverseForksServer,
  getObserverUniverseSnapshotsServer,
  getObserverUniverseTimelineServer,
} from '@/modules/observer/api';
import { UniverseTimelineClient } from '@/modules/observer/components/UniverseTimelineClient';

export default async function UniverseTimelinePage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const [timeline, chronicles, snapshots, forks, autonomyAudit] = await Promise.all([
    getObserverUniverseTimelineServer(universeId),
    getObserverUniverseChroniclesServer(universeId),
    getObserverUniverseSnapshotsServer(universeId),
    getObserverUniverseForksServer(universeId),
    getObserverAutonomyAuditServer(universeId),
  ]);

  return (
    <UniverseTimelineClient
      universeId={universeId}
      initialTimeline={timeline}
      initialChronicles={chronicles}
      initialSnapshots={snapshots}
      initialForks={forks}
      initialAutonomyAudit={autonomyAudit}
    />
  );
}
