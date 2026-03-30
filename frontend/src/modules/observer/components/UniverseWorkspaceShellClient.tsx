'use client';

import type { ReactNode } from 'react';
import { useObserverUniverseDetail } from '@/modules/observer/api';
import { UniverseSummaryStrip } from '@/modules/observer/components/UniverseSummaryStrip';
import { UniverseWorkspaceHeader } from '@/modules/observer/components/UniverseWorkspaceHeader';
import SimulationControlFAB from '@/modules/observer/components/SimulationControlFAB';
import type { UniverseDetail } from '@/modules/observer/types';
import { motion } from 'framer-motion';

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

  if (!universe) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-12"
    >
      {/* Workspace Contextual Header */}
      <div className="space-y-6">
        <UniverseWorkspaceHeader universe={universe} />
        <UniverseSummaryStrip universe={universe} />
      </div>

      {/* Main Workspace Content Area */}
      <div className="min-w-0">
        {children}
      </div>

      {/* Floating Simulation Controls */}
      <SimulationControlFAB universeId={universe.id} />
    </motion.div>
  );
}
