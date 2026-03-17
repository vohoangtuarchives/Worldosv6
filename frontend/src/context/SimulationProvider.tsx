"use client";

/**
 * context/SimulationProvider.tsx
 *
 * Composite provider — bao gồm tất cả domain contexts.
 * Sử dụng trong layout để wrap toàn bộ app.
 *
 * Usage:
 *   <SimulationProvider>
 *     {children}
 *   </SimulationProvider>
 *
 * Sau đó trong component:
 *   const { universeId, latestSnapshot } = useSimulationCore();
 *   const { actors } = useEntities();
 *   const { chronicles } = useWorldData();
 *   const { universes } = useUniverseList();
 */

import React from 'react';
import { SimulationCoreProvider } from './SimulationCoreContext';
import { EntityProvider } from './EntityContext';
import { WorldDataProvider } from './WorldDataContext';
import { UniverseListProvider } from './UniverseListContext';

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  return (
    <UniverseListProvider>
      <SimulationCoreProvider>
        <EntityProvider>
          <WorldDataProvider>
            {children}
          </WorldDataProvider>
        </EntityProvider>
      </SimulationCoreProvider>
    </UniverseListProvider>
  );
}

// Re-export hooks for convenience
export { useSimulationCore } from './SimulationCoreContext';
export { useEntities } from './EntityContext';
export { useWorldData } from './WorldDataContext';
export { useUniverseList } from './UniverseListContext';
