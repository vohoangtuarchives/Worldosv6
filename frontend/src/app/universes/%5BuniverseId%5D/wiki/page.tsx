import WikiPortalClient from '@/modules/observer/components/WikiPortalClient';

export default async function WikiPage({
  params
}: {
  params: Promise<{ universeId: string }>
}) {
  const { universeId } = await params;
  
  return <WikiPortalClient universeId={universeId} />;
}
