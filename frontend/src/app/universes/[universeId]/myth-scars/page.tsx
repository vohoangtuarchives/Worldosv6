import { getObserverUniverseMythScarsServer } from '@/modules/observer/api';
import { UniverseMythScarsClient } from '@/modules/observer/components/UniverseMythScarsClient';

export default async function UniverseMythScarsPage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const mythScars = await getObserverUniverseMythScarsServer(universeId);

  return <UniverseMythScarsClient universeId={universeId} initialMythScars={mythScars} />;
}
