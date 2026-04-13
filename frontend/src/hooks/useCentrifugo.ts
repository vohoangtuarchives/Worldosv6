'use client';

import { useEffect, useRef, useState } from 'react';
import type { Centrifuge, Subscription, PublicationContext } from 'centrifuge';
import { getCentrifuge } from '@/lib/centrifugo';

// ────────────────────────────────────────────────────────
// Connection state
// ────────────────────────────────────────────────────────

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * Manages the Centrifuge WebSocket connection lifecycle.
 *
 * Returns the current connection state so consumers can decide
 * whether to fall back to polling.
 */
export function useCentrifugoConnection(): {
  state: ConnectionState;
  client: Centrifuge | null;
} {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const client = typeof window === 'undefined' ? null : getCentrifuge();

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    const client = getCentrifuge();

    client.on('connected', () => setState('connected'));
    client.on('connecting', () => setState('connecting'));
    client.on('disconnected', () => setState('disconnected'));

    client.connect();

    return () => {
      // Don't disconnect — singleton shared across components
    };
  }, []);

  return { state, client };
}

// ────────────────────────────────────────────────────────
// Channel subscription with callback
// ────────────────────────────────────────────────────────

/**
 * Subscribes to a Centrifugo channel and calls `onMessage` on each publish.
 *
 * Automatically unsubscribes when the component unmounts or the channel changes.
 */
export function useCentrifugoSubscription(
  channel: string | null,
  onMessage: (data: Record<string, unknown>) => void,
): void {
  const callbackRef = useRef(onMessage);
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!channel || typeof window === 'undefined') return;

    const client = getCentrifuge();
    const sub: Subscription = client.newSubscription(channel);

    sub.on('publication', (ctx: PublicationContext) => {
      callbackRef.current(ctx.data as Record<string, unknown>);
    });

    sub.subscribe();

    return () => {
      sub.unsubscribe();
      sub.removeAllListeners();
    };
  }, [channel]);
}

// ────────────────────────────────────────────────────────
// Refetch interval helper
// ────────────────────────────────────────────────────────

/**
 * Returns a refetchInterval that adapts to WebSocket connection state.
 *
 * - Connected: `false` (no polling — WebSocket handles invalidation)
 * - Disconnected: `fallbackMs` (fallback polling, default 60s)
 */
export function useAdaptiveRefetchInterval(
  state: ConnectionState,
  fallbackMs = 60_000,
): number | false {
  return state === 'connected' ? false : fallbackMs;
}
