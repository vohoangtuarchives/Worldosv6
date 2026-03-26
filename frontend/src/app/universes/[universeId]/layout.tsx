import { notFound } from 'next/navigation';
import { getObserverUniverseDetailServer } from '@/modules/observer/api';
import { UniverseWorkspaceShellClient } from '@/modules/observer/components/UniverseWorkspaceShellClient';

export default async function UniverseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ universeId: string }>;
}) {
  const { universeId } = await params;
  const universe = await getObserverUniverseDetailServer(universeId);

  if (!universe) {
    notFound();
  }

  return (
    <UniverseWorkspaceShellClient universeId={universeId} initialUniverse={universe}>
      {children}
    </UniverseWorkspaceShellClient>
  );
}
