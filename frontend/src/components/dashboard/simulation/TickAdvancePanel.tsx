'use client';

import { useState } from 'react';
import { Play, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

import SectionPanel from '@/components/ui/shared/SectionPanel';
import { useUniverse } from '@/contexts/UniverseContext';
import { useAdvanceSimulation } from '@/hooks/useSimulationControls';

export default function TickAdvancePanel() {
  const { activeUniverseId, universes } = useUniverse();
  const advanceMutation = useAdvanceSimulation();

  const [ticks, setTicks] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeUniverse = universes.find((u) => u.id === activeUniverseId);

  const handleAdvance = () => {
    if (!activeUniverseId) return;

    if (ticks > 100 && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    setShowSuccess(false);

    advanceMutation.mutate(
      {
        universeId: activeUniverseId,
        ticks,
      },
      {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
      },
    );
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <SectionPanel>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
          <Play size={18} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight text-white">
            Tick Advance
          </h3>
          {activeUniverse && (
            <p className="text-xs text-slate-500">
              Current tick:{' '}
              <span className="font-mono text-cyan-400">
                {activeUniverse.current_tick ?? 0}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Tick Input */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">
          Ticks to advance
        </label>
        <input
          type="number"
          min={1}
          max={1000}
          value={ticks}
          onChange={(e) => setTicks(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
        />
      </div>

      {/* Confirm Warning */}
      {showConfirm && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-300">
              Advancing {ticks} ticks may take a while.
            </p>
            <p className="mt-0.5 text-[11px] text-amber-400/60">
              Are you sure you want to continue?
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleAdvance}
                className="rounded-lg bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-inset ring-amber-500/20 transition-colors hover:bg-amber-500/20"
              >
                Yes, advance
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg bg-slate-800/50 px-3 py-1 text-[11px] font-bold text-slate-400 transition-colors hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <p className="text-xs font-semibold text-emerald-300">
            Simulation advanced successfully!
          </p>
        </div>
      )}

      {/* Advance Button */}
      <button
        onClick={handleAdvance}
        disabled={advanceMutation.isPending || !activeUniverseId}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {advanceMutation.isPending ? (
          <>
            <RefreshCcw size={16} className="animate-spin" />
            Advancing...
          </>
        ) : (
          <>
            <Play size={16} />
            Advance Simulation
          </>
        )}
      </button>
    </SectionPanel>
  );
}
