import AxiomaticArchives from '@/modules/observer/components/wiki/AxiomaticArchives';

export default async function AxiomPage({
  params
}: {
  params: Promise<{ universeId: string; id: string }>
}) {
  const { universeId, id } = await params;
  
  return <AxiomaticArchives universeId={universeId} axiomId={id} />;
}
