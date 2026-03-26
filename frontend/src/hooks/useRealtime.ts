'use client';

import { useEffect, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import { useSimulationStore, type ChronicleRecord } from '@/store/useSimulationStore';

interface ChroniclePublication {
  chronicle?: ChronicleRecord;
}

export const useRealtime = () => {
  const centrifugeRef = useRef<Centrifuge | null>(null);
  const updateFromAdvance = useSimulationStore((state) => state.updateFromAdvance);
  const addChronicle = useSimulationStore((state) => state.addChronicle);

  useEffect(() => {
    if (centrifugeRef.current) {
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/connection/websocket`;
    const centrifuge = new Centrifuge(wsUrl, { token: '' });
    centrifugeRef.current = centrifuge;

    const subAdvance = centrifuge.newSubscription('worldos.simulation.advanced');
    subAdvance.on('publication', (ctx) => {
      updateFromAdvance(ctx.data);
    });

    const subNarrative = centrifuge.newSubscription('worldos.narrative.pulsed');
    subNarrative.on('publication', (ctx) => {
      const payload = ctx.data as ChroniclePublication;
      if (payload.chronicle) {
        addChronicle(payload.chronicle);
      }
    });

    subAdvance.subscribe();
    subNarrative.subscribe();
    centrifuge.connect();

    return () => {
      subAdvance.unsubscribe();
      subNarrative.unsubscribe();
      centrifuge.disconnect();
      centrifugeRef.current = null;
    };
  }, [addChronicle, updateFromAdvance]);
};
