'use client';

import { Activity, Radio, ShieldAlert, Sparkles } from 'lucide-react';
import { useObserverAutonomyAudit, useObserverRealityPulse, useObserverUniverseDetail } from '@/modules/observer/api';
import type { AutonomyAudit, RealityPulse } from '@/modules/observer/contracts';
import { MutationStream } from '@/modules/observer/components/MutationStream';
import { ObserverControlSurface } from '@/modules/observer/components/ObserverControlSurface';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import { RealityCore } from '@/modules/observer/components/RealityCore';
import type { UniverseDetail } from '@/modules/observer/types';
import { useObserverUniverseRealtime } from '@/modules/observer/useObserverUniverseRealtime';

function getConnectionTone(state: 'idle' | 'connecting' | 'connected' | 'disconnected') {
  if (state === 'connected') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }

  if (state === 'connecting') {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
  }

  if (state === 'disconnected') {
    return 'border-rose-400/30 bg-rose-500/10 text-rose-100';
  }

  return 'border-sky-400/30 bg-sky-500/10 text-sky-100';
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function UniverseControlClient({
  universeId,
  initialUniverse,
  initialRealityPulse,
  initialAutonomyAudit,
}: {
  universeId: string;
  initialUniverse: UniverseDetail;
  initialRealityPulse?: RealityPulse;
  initialAutonomyAudit?: AutonomyAudit;
}) {
  const universeQuery = useObserverUniverseDetail(universeId, initialUniverse);
  const realityPulseQuery = useObserverRealityPulse(universeId, initialRealityPulse);
  const autonomyAuditQuery = useObserverAutonomyAudit(universeId, initialAutonomyAudit);
  const realtime = useObserverUniverseRealtime(universeId);

  if (universeQuery.isError && !universeQuery.data) {
    return (
      <ObserverErrorState
        title="Control surface is unavailable"
        description="The observer could not refresh the active branch state before rendering controls."
        onRetry={() => {
          void universeQuery.refetch();
        }}
      />
    );
  }

  if (!universeQuery.data) {
    return <ObserverLoadingState lines={2} />;
  }

  const universe = universeQuery.data;
  const pulse = realityPulseQuery.data;
  const audit = autonomyAuditQuery.data;
  const pressure = pulse && pulse.entropyThreshold > 0 ? pulse.entropy / pulse.entropyThreshold : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(140deg,rgba(15,23,42,0.94),rgba(30,41,59,0.82))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/70">Observer Console / Auditor Expansion</p>
            <h1 className="text-3xl font-semibold tracking-tight">Reality pulse, mutation audit, v� intervention controls d� d?ng chung m?t m?t di?u khi?n.</h1>
            <p className="text-sm leading-7 text-muted-foreground">
              Thay v� do�n h? t? tr? dang l�m g�, b?n gi? nh�n du?c nh?p entropy, mutation chronicle v� t�n hi?u realtime t? c�ng m?t dashboard. M?i h�nh d?ng can thi?p cung d� b�m v�o invalidation r� r�ng n�n panel li�n quan t? c?p nh?t theo c�ng resource keys.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <StatusBadge icon={Radio} label="Realtime" value={realtime.connectionState.toUpperCase()} tone={getConnectionTone(realtime.connectionState)} />
            <StatusBadge icon={Activity} label="Universe" value={`${universe.status.toUpperCase()} / T${universe.currentTick}`} tone="border-white/10 bg-white/5 text-white" />
            <StatusBadge icon={ShieldAlert} label="Entropy pressure" value={pulse ? formatPercent(Math.min(pressure, 1.5)) : 'N/A'} tone="border-orange-400/30 bg-orange-500/10 text-orange-100" />
            <StatusBadge icon={Sparkles} label="Mutation depth" value={String(audit?.totalMutations ?? 0)} tone="border-sky-400/30 bg-sky-500/10 text-sky-100" />
          </div>
        </div>

        {realtime.lastEventLabel ? (
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-muted-foreground">Live signal: {realtime.lastEventLabel}</div>
        ) : null}
      </section>

      <ObserverPanel eyebrow="Reality Core" title="Nh?p d?p trung t�m c?a vu tr?">
        {realityPulseQuery.isError && !pulse ? (
          <ObserverErrorState
            title="Reality pulse is unavailable"
            description="The observer could not read the live wavefunction or informational mass."
            onRetry={() => {
              void realityPulseQuery.refetch();
            }}
          />
        ) : (
          <RealityCore pulse={pulse} />
        )}
      </ObserverPanel>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <ObserverPanel eyebrow="Autonomy Audit" title="Mutation stream and diff ledger">
          <MutationStream universeId={universeId} />
        </ObserverPanel>

        <ObserverPanel eyebrow="Intervene" title="Core workflow controls">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              Advance, fork, toggle status v� capture snapshot d?u dang di qua React Query mutations v?i invalidation r� r�ng, n�n control tab kh�ng c�n ph? thu?c v�o refresh th� d? k�o d? li?u m?i.
            </p>
            <ObserverControlSurface universeId={universe.id} currentTick={universe.currentTick} status={universe.status} />
          </div>
        </ObserverPanel>
      </div>
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold tracking-tight">{value}</p>
    </div>
  );
}
