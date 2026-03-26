'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  useAdvanceUniverseMutation,
  useCreateUniverseSnapshotMutation,
  useForkUniverseMutation,
  useToggleUniverseStatusMutation,
} from '@/modules/observer/api';

function parseInteger(value: string, minimum: number, maximum?: number): number | undefined {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    return undefined;
  }

  if (typeof maximum === 'number' && parsed > maximum) {
    return undefined;
  }

  return parsed;
}

export function ObserverControlSurface({
  universeId,
  currentTick,
  status,
}: {
  universeId: string;
  currentTick: number;
  status: 'active' | 'paused' | 'forked';
}) {
  const advanceMutation = useAdvanceUniverseMutation(universeId);
  const forkMutation = useForkUniverseMutation(universeId);
  const toggleMutation = useToggleUniverseStatusMutation(universeId);
  const snapshotMutation = useCreateUniverseSnapshotMutation(universeId);
  const [advanceTicks, setAdvanceTicks] = useState('5');
  const [forkTick, setForkTick] = useState(String(currentTick));
  const [forkName, setForkName] = useState('');

  const isBusy = advanceMutation.isPending || forkMutation.isPending || toggleMutation.isPending || snapshotMutation.isPending;

  async function handleAdvance() {
    const ticks = parseInteger(advanceTicks, 1, 1000);
    if (ticks === undefined) {
      toast.error('Tick window must be an integer from 1 to 1000.');
      return;
    }

    try {
      await advanceMutation.mutateAsync(ticks);
      toast.success(`Advanced the simulation by ${ticks} ticks.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Advance failed.');
    }
  }

  async function handleFork() {
    const divergenceTick = parseInteger(forkTick, 0, currentTick);
    if (divergenceTick === undefined) {
      toast.error(`Divergence tick must be an integer from 0 to ${currentTick}.`);
      return;
    }

    if (forkName.trim().length > 120) {
      toast.error('Branch label must stay under 120 characters.');
      return;
    }

    try {
      const payload = await forkMutation.mutateAsync({
        tick: divergenceTick,
        name: forkName.trim() || undefined,
      });
      const data = typeof payload === 'object' && payload ? (payload.data as Record<string, unknown> | undefined) : undefined;
      const branchId = typeof data?.child_universe_id === 'number' ? data.child_universe_id : 'new';
      setForkName('');
      toast.success(`Forked branch ${branchId} from tick ${divergenceTick}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fork failed.');
    }
  }

  async function handleToggleStatus() {
    try {
      const payload = await toggleMutation.mutateAsync();
      const nextStatus = typeof payload?.new_status === 'string' ? payload.new_status : 'updated';
      toast.success(`Universe status changed to ${nextStatus}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status update failed.');
    }
  }

  async function handleSnapshot() {
    try {
      const payload = await snapshotMutation.mutateAsync();
      const data = typeof payload === 'object' && payload ? (payload.data as Record<string, unknown> | undefined) : undefined;
      const snapshot = data?.snapshot as Record<string, unknown> | undefined;
      const tick = typeof snapshot?.tick === 'number' ? snapshot.tick : currentTick;
      toast.success(`Captured snapshot at tick ${tick}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Snapshot capture failed.');
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
      <form
        className="rounded-2xl border border-white/8 bg-background/35 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleAdvance();
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.26em] text-primary/70">Advance</p>
        <h3 className="mt-2 text-lg font-semibold">Move the causal state forward</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use bounded tick windows so the observer can inspect changes without losing the narrative trail.
        </p>
        <label className="mt-5 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Tick Window
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
            inputMode="numeric"
            min="1"
            step="1"
            value={advanceTicks}
            onChange={(event) => setAdvanceTicks(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={isBusy}
          className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {advanceMutation.isPending ? 'Advancing...' : 'Advance Simulation'}
        </button>
      </form>

      <form
        className="rounded-2xl border border-white/8 bg-background/35 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleFork();
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.26em] text-primary/70">Fork</p>
        <h3 className="mt-2 text-lg font-semibold">Split a parallel trajectory</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Fork from a known causal checkpoint to compare outcomes without mutating the active branch.
        </p>
        <label className="mt-5 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Divergence Tick
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
            inputMode="numeric"
            min="0"
            max={currentTick}
            step="1"
            value={forkTick}
            onChange={(event) => setForkTick(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Branch Label
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
            value={forkName}
            onChange={(event) => setForkName(event.target.value)}
            placeholder="Counterfactual Dawn"
            maxLength={120}
          />
        </label>
        <button
          type="submit"
          disabled={isBusy}
          className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {forkMutation.isPending ? 'Forking...' : 'Create Branch'}
        </button>
      </form>

      <div className="rounded-2xl border border-white/8 bg-background/35 p-5">
        <p className="text-[10px] uppercase tracking-[0.26em] text-primary/70">Status</p>
        <h3 className="mt-2 text-lg font-semibold">Observation posture</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Current branch status is <span className="font-medium text-foreground">{status}</span>. Toggle it when you need to pause automatic progression or resume active observation.
        </p>
        <p className="mt-5 text-3xl font-semibold text-primary">Tick {currentTick.toLocaleString()}</p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            void handleToggleStatus();
          }}
          className="mt-5 rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {toggleMutation.isPending ? 'Updating...' : 'Toggle Active State'}
        </button>
      </div>

      <div className="rounded-2xl border border-white/8 bg-background/35 p-5">
        <p className="text-[10px] uppercase tracking-[0.26em] text-primary/70">Snapshot</p>
        <h3 className="mt-2 text-lg font-semibold">Capture the present state</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Persist a checkpoint now so the snapshots lane and future branch comparisons share a stable reference frame.
        </p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            void handleSnapshot();
          }}
          className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {snapshotMutation.isPending ? 'Capturing...' : 'Create Snapshot'}
        </button>
      </div>
    </div>
  );
}
