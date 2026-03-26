import { getObserverUniverseSummariesServer } from "@/modules/observer/api";
import { ObserverPortalClient } from "@/modules/observer/components/ObserverPortalClient";

export default async function Home() {
  const universes = await getObserverUniverseSummariesServer();

  return <ObserverPortalClient initialUniverses={universes} />;
}
