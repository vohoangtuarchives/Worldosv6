'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Centrifuge } from 'centrifuge';
import { toast } from 'sonner';
import { invalidateObserverUniverseQueries } from '@/modules/observer/api';

interface UniversePulsePublication {
  tick?: number;
  entropy?: number;
}

interface MutationPublication {
  summary?: {
    dsl_hash?: string;
    dsl_path?: string | null;
    vector?: string | null;
    tick?: number | null;
  };
}

export interface ObserverRealtimeState {
  connectionState: 'idle' | 'connecting' | 'connected' | 'disconnected';
  lastEventLabel: string | null;
}

export function useObserverUniverseRealtime(universeId: string): ObserverRealtimeState {
  const queryClient = useQueryClient();
  const clientRef = useRef<Centrifuge | null>(null);
  const [connectionState, setConnectionState] = useState<ObserverRealtimeState['connectionState']>('connecting');
  const [lastEventLabel, setLastEventLabel] = useState<string | null>(null);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/connection/websocket`;
    const centrifuge = new Centrifuge(wsUrl, { token: '' });
    clientRef.current = centrifuge;

    const pulseSubscription = centrifuge.newSubscription(`universes.${universeId}`);
    pulseSubscription.on('publication', (ctx) => {
      const payload = (ctx.data ?? {}) as UniversePulsePublication;
      const tickLabel = typeof payload.tick === 'number' ? `Tick ${payload.tick.toLocaleString()}` : 'Universe pulse';
      setLastEventLabel(tickLabel);
      void invalidateObserverUniverseQueries(queryClient, universeId, ['detail', 'metrics', 'realityPulse', 'timeline']);
    });

    const mutationSubscription = centrifuge.newSubscription(`universes.${universeId}.autopoiesis`);
    mutationSubscription.on('publication', (ctx) => {
      const payload = (ctx.data ?? {}) as MutationPublication;
      const summary = payload.summary ?? {};
      const label = typeof summary.dsl_path === 'string' && summary.dsl_path.length > 0 ? summary.dsl_path : 'mutated rule pack';
      setLastEventLabel(`Autopoiesis touched ${label}`);
      toast.message('Autopoiesis mutation applied', {
        description: typeof summary.vector === 'string' && summary.vector.length > 0 ? summary.vector : `Observer detected a live rule mutation on ${label}.`,
      });
      void invalidateObserverUniverseQueries(queryClient, universeId, ['realityPulse', 'autonomyAudit', 'timeline']);
    });

    centrifuge.on('connecting', () => setConnectionState('connecting'));
    centrifuge.on('connected', () => setConnectionState('connected'));
    centrifuge.on('disconnected', () => setConnectionState('disconnected'));

    pulseSubscription.subscribe();
    mutationSubscription.subscribe();
    centrifuge.connect();

    return () => {
      pulseSubscription.unsubscribe();
      mutationSubscription.unsubscribe();
      centrifuge.disconnect();
      clientRef.current = null;
      setConnectionState('disconnected');
    };
  }, [queryClient, universeId]);

  return { connectionState, lastEventLabel };
}

