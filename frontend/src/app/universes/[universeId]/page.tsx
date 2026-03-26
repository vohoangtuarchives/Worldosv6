import { notFound } from "next/navigation";
import { getObserverUniverseChroniclesServer, getObserverUniverseDetailServer } from "@/modules/observer/api";
import { UniverseOverviewClient } from "@/modules/observer/components/UniverseOverviewClient";

export default async function UniverseOverviewPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const [universe, chronicles] = await Promise.all([
    getObserverUniverseDetailServer(universeId),
    getObserverUniverseChroniclesServer(universeId),
  ]);

  if (!universe) {
    notFound();
  }

  return <UniverseOverviewClient universeId={universeId} initialUniverse={universe} initialChronicles={chronicles} />;
}
