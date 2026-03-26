import { notFound } from 'next/navigation';
import { getObserverAutonomyAuditServer, getObserverRealityPulseServer, getObserverUniverseDetailServer } from '@/modules/observer/api';
import { UniverseControlClient } from '@/modules/observer/components/UniverseControlClient';

export default async function UniverseControlPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const [universe, realityPulse, autonomyAudit] = await Promise.all([
    getObserverUniverseDetailServer(universeId),
    getObserverRealityPulseServer(universeId),
    getObserverAutonomyAuditServer(universeId),
  ]);

  if (!universe) {
    notFound();
  }

  return (
    <UniverseControlClient
      universeId={universeId}
      initialUniverse={universe}
      initialRealityPulse={realityPulse}
      initialAutonomyAudit={autonomyAudit}
    />
  );
}
