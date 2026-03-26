import UniverseRealityStateClient from '@/modules/observer/components/UniverseRealityStateClient';

export default async function RealityPage({
  params
}: {
  params: Promise<{ universeId: string }>
}) {
  const { universeId } = await params;
  
  return <UniverseRealityStateClient universeId={universeId} />;
}
