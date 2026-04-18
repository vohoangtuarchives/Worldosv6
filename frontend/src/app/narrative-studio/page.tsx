'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  Cable,
  LayoutGrid,
  RadioTower,
  Route,
  Sparkles,
} from 'lucide-react';
import NarrativeOfficeView from '@/components/ui/narrative/NarrativeOfficeView';
import { useNarrativeRuntime } from '@/features/narrative-runtime/useNarrativeRuntime';

function LegacyCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-800 bg-[#111116] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function NarrativeStudioPage() {
  const runtime = useNarrativeRuntime();

  return (
    <div className="min-h-screen bg-[#05060a] px-4 pb-24 pt-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-slate-800 bg-[#0d0f14] px-6 py-8 sm:px-8">
          <div className="mb-3 inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">
            <Sparkles size={12} />
            Legacy Route
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Narrative Studio
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
                This route now acts as a legacy bridge. The canonical product surface for
                Narrative Loom lives in Loom Workshop so runtime state, office mode, and
                review no longer drift across separate pages.
              </p>
            </div>
            <Link
              href="/dashboard/loom-workshop"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-400"
            >
              Open Loom Workshop
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LegacyCard
            label="Loom Status"
            value={(runtime.loomStatus?.status ?? 'unknown').toUpperCase()}
            hint="Status fetched through the same shared runtime hook."
          />
          <LegacyCard
            label="Connection"
            value={runtime.connectionState.toUpperCase()}
            hint="Shared Centrifugo connection state."
          />
          <LegacyCard
            label="Active Task"
            value={runtime.activeTaskId ?? 'None'}
            hint="Only live sessions are restored here."
          />
          <LegacyCard
            label="Progress"
            value={`${runtime.progress.completed}/${runtime.progress.total}`}
            hint="The same node counters used by Loom Workshop."
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
              <div className="mb-5 flex items-center gap-3">
                <RadioTower size={18} className="text-cyan-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Why this changed
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">One source of truth</h2>
                </div>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-400">
                <p>
                  `Loom Workshop` now owns the main flow: submit run, watch progress,
                  switch to office mode, and review final outputs.
                </p>
                <p>
                  `Narrative Studio` remains available so old links do not become dead
                  ends, but it should no longer be treated as the primary workflow.
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
              <div className="mb-5 flex items-center gap-3">
                <Route size={18} className="text-violet-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Runtime Snapshot
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">Shared state summary</h2>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Cable size={16} className="text-cyan-400" />
                    Connection
                  </span>
                  <span className="font-black text-white">{runtime.connectionState}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Brain size={16} className="text-violet-400" />
                    Current agent
                  </span>
                  <span className="font-black text-white">{runtime.currentAgent ?? 'Idle'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <LayoutGrid size={16} className="text-emerald-400" />
                    Completed nodes
                  </span>
                  <span className="font-black text-white">{runtime.completedCount}</span>
                </div>
              </div>
            </div>
          </div>

          <NarrativeOfficeView
            nodes={runtime.pipelineNodes}
            selectedNode={runtime.selectedNode}
            onSelectNode={runtime.setSelectedNode}
            currentAgent={runtime.currentAgent}
            connectionState={runtime.connectionState}
            loomStatus={runtime.loomStatus}
          />
        </div>
      </div>
    </div>
  );
}
