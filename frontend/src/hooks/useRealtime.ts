'use client';

import { useEffect, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import { useSimulationStore } from '@/store/useSimulationStore';

export const useRealtime = () => {
  const centrifugeRef = useRef<Centrifuge | null>(null);
  const updateFromAdvance = useSimulationStore((state) => state.updateFromAdvance);
  const addChronicle = useSimulationStore((state) => state.addChronicle);

  useEffect(() => {
    // Check if we already have an active or connecting instance
    if (centrifugeRef.current && (centrifugeRef.current.state === 'connected' || centrifugeRef.current.state === 'connecting')) {
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/connection/websocket`;
    
    console.log('Centrifuge Connecting to:', wsUrl);
    
    const centrifuge = new Centrifuge(wsUrl, {
      token: '', 
    });

    centrifugeRef.current = centrifuge;

    const subAdvance = centrifuge.newSubscription('worldos.simulation.advanced');
    subAdvance.on('publication', (ctx) => {
      updateFromAdvance(ctx.data);
    });

    const subNarrative = centrifuge.newSubscription('worldos.narrative.pulsed');
    subNarrative.on('publication', (ctx) => {
      if (ctx.data.chronicle) {
        addChronicle(ctx.data.chronicle);
      }
    });

    subAdvance.subscribe();
    subNarrative.subscribe();
    centrifuge.connect();

    return () => {
      console.log('Centrifuge Disconnecting');
      centrifuge.disconnect();
      centrifugeRef.current = null;
    };
  }, [updateFromAdvance, addChronicle]);

  return centrifugeRef.current;
};
