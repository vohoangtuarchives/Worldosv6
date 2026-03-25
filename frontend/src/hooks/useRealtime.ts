'use client';

import { useEffect, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import { useSimulationStore } from '@/store/useSimulationStore';

export const useRealtime = () => {
  const centrifugeRef = useRef<Centrifuge | null>(null);
  const updateFromAdvance = useSimulationStore((state) => state.updateFromAdvance);
  const addChronicle = useSimulationStore((state) => state.addChronicle);

  useEffect(() => {
    // Port 8000 as per simulation environment
    const centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket', {
      token: '', // Development mode might not require token if configured
    });

    centrifugeRef.current = centrifuge;

    const subAdvance = centrifuge.newSubscription('worldos.simulation.advanced');
    subAdvance.on('publication', (ctx) => {
      console.log('Realtime Advance:', ctx.data);
      updateFromAdvance(ctx.data);
    });

    const subNarrative = centrifuge.newSubscription('worldos.narrative.pulsed');
    subNarrative.on('publication', (ctx) => {
      console.log('Realtime Narrative:', ctx.data);
      if (ctx.data.chronicle) {
        addChronicle(ctx.data.chronicle);
      }
    });

    subAdvance.subscribe();
    subNarrative.subscribe();
    centrifuge.connect();

    return () => {
      centrifuge.disconnect();
    };
  }, [updateFromAdvance, addChronicle]);

  return centrifugeRef.current;
};
