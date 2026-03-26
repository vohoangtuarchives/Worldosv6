import ActorWikiDetail from '@/modules/observer/components/wiki/ActorWikiDetail';

export default async function ActorPage({
  params
}: {
  params: Promise<{ universeId: string; id: string }>
}) {
  const { universeId, id } = await params;
  
  return <ActorWikiDetail universeId={universeId} actorId={id} />;
}
