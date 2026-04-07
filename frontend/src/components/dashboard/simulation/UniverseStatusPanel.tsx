'use client';

import { useState } from 'react';
import { Globe, Power, Trash2, RefreshCcw, Activity, Shield, Flame } from 'lucide-react';

import SectionPanel from '@/components/ui/shared/SectionPanel';
import BadgeLabel from '@/components/ui/shared/BadgeLabel';
import ModalShell from '@/components/ui/shared/ModalShell';
import { useUniverse } from '@/contexts/UniverseContext';
import { useUniverseMetrics } from '@/hooks/useUniverseDossier';
import { useToggleUniverse, useDeleteUniverse } from '@/hooks/useSimulationControls';

export default function UniverseStatusPanel() {
  const { activeUniverseId, universes } = useUniverse();
  const { metrics } = useUniverseMetrics(activeUniverseId);
  const toggleMutation = useToggleUniverse();
  const deleteMutation = useDeleteUniverse();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activeUniverse = universes.find((u) => u.id === activeUniverseId);
  const status = metrics?.status ?? activeUniverse?.status ?? 'unknown';
  const isActive = status === 'active';

  const handleToggle = () => {
    if (!activeUniverseId) return;
    toggleMutation.mutate(activeUniverseId);
  };

  const handleDelete = () => {
    if (!activeUniverseId) return;
    deleteMutation.mutate(activeUniverseId, {
      onSuccess: () => {
        setShowDeleteModal(false);
      },
    });
  };

  return (
    <>
      <SectionPanel>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Globe size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black tracking-tight text-white">
              {activeUniverse?.name ?? 'Universe'}
            </h3>
            <div className="mt-1">
              <BadgeLabel variant={isActive ? 'emerald' : 'slate'}>
                {status}
              </BadgeLabel>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
            <Activity size={14} className="mx-auto mb-1 text-cyan-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Tick
            </p>
            <p className="font-mono text-lg font-bold text-white">
              {metrics?.current_tick ?? activeUniverse?.current_tick ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
            <Flame size={14} className="mx-auto mb-1 text-amber-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Entropy
            </p>
            <p className="font-mono text-lg font-bold text-white">
              {metrics?.entropy != null ? metrics.entropy.toFixed(2) : '--'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
            <Shield size={14} className="mx-auto mb-1 text-emerald-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Stability
            </p>
            <p className="font-mono text-lg font-bold text-white">
              {metrics?.stability != null
                ? metrics.stability.toFixed(2)
                : '--'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleToggle}
            disabled={toggleMutation.isPending || !activeUniverseId}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {toggleMutation.isPending ? (
              <RefreshCcw size={14} className="animate-spin" />
            ) : (
              <Power size={14} />
            )}
            Toggle Status
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!activeUniverseId}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </SectionPanel>

      {/* Delete Confirmation Modal */}
      <ModalShell
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Universe"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10">
            <Trash2 size={24} className="text-rose-400" />
          </div>
          <p className="text-sm text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-bold text-white">
              {activeUniverse?.name ?? `Universe #${activeUniverseId}`}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleteMutation.isPending ? (
                <RefreshCcw size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
