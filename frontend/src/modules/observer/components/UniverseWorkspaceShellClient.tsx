'use client';

import type { ReactNode } from 'react';
import { useObserverUniverseDetail } from '@/modules/observer/api';
import { ObserverSidebar } from '@/modules/observer/components/ObserverSidebar';
import { UniverseSummaryStrip } from '@/modules/observer/components/UniverseSummaryStrip';
import { UniverseWorkspaceHeader } from '@/modules/observer/components/UniverseWorkspaceHeader';
import SimulationControlFAB from '@/modules/observer/components/SimulationControlFAB';
import type { UniverseDetail } from '@/modules/observer/types';

export function UniverseWorkspaceShellClient({
  universeId,
  initialUniverse,
  children,
}: {
  universeId: string;
  initialUniverse: UniverseDetail;
  children: ReactNode;
}) {
  const { data: universe } = useObserverUniverseDetail(universeId, initialUniverse);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto max-w-[1540px] space-y-4 sm:space-y-6">
        <UniverseWorkspaceHeader universe={universe} />
        <UniverseSummaryStrip universe={universe} />

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-6">
          <ObserverSidebar universeId={universe.id} />
          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>

      {/* Simulation Control Interface */}
      <SimulationControlFAB universeId={universe.id} />
    </div>
  );
}
