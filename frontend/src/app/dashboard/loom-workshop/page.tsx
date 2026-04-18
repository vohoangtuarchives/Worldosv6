'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenText,
  Brain,
  Cable,
  Copy,
  FileText,
  Hammer,
  LayoutGrid,
  PlayCircle,
  RadioTower,
  RefreshCcw,
  Route,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUniverse } from '@/contexts/UniverseContext';
import { useNarrativeRuntime } from '@/features/narrative-runtime/useNarrativeRuntime';
import { NARRATIVE_NODE_MAP } from '@/features/narrative-runtime/types';
import FlowDiagram from '@/components/ui/narrative/FlowDiagram';
import IntermediateOutputsPanel from '@/components/ui/narrative/IntermediateOutputsPanel';
import NarrativeOfficeView from '@/components/ui/narrative/NarrativeOfficeView';
import ActorIntentTab from './sections/ActorIntentTab';
import ScribeTab from './sections/ScribeTab';
import AssetForgeTab from './sections/AssetForgeTab';

type WorkshopTab = 'run' | 'office' | 'review' | 'utilities';
type UtilityTab = 'actor' | 'scribe' | 'forge';

const workshopTabs: Array<{
  id: WorkshopTab;
  label: string;
  icon: typeof PlayCircle;
  description: string;
}> = [
  {
    id: 'run',
    label: 'Run',
    icon: PlayCircle,
    description: 'Submit and monitor the active pipeline.',
  },
  {
    id: 'office',
    label: 'Office',
    icon: LayoutGrid,
    description: 'Visual office mode for the same runtime state.',
  },
  {
    id: 'review',
    label: 'Review',
    icon: BookOpenText,
    description: 'Inspect outputs, prose, and intermediates.',
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: Wand2,
    description: 'Sidecar tools that are not part of the main weave path.',
  },
];

const utilityTabs: Array<{
  id: UtilityTab;
  label: string;
  icon: typeof Brain;
}> = [
  { id: 'actor', label: 'Actor Intent', icon: Brain },
  { id: 'scribe', label: 'History Scribe', icon: FileText },
  { id: 'forge', label: 'Asset Forge', icon: Hammer },
];

function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone?: 'slate' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';
}) {
  const toneMap: Record<typeof tone, string> = {
    slate: 'bg-slate-900/60 border-slate-800 text-slate-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  };

  return (
    <div className={`rounded-3xl border p-5 ${toneMap[tone]}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-white/5 p-3">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-white/55">{hint}</p>
    </div>
  );
}

export default function LoomWorkshopPage() {
  const { activeUniverseId } = useUniverse();
  const [activeTab, setActiveTab] = useState<WorkshopTab>('run');
  const [activeUtilityTab, setActiveUtilityTab] = useState<UtilityTab>('actor');
  const runtime = useNarrativeRuntime();

  const selectedNodeDefinition = runtime.selectedNode
    ? NARRATIVE_NODE_MAP[runtime.selectedNode]
    : undefined;

  const renderRunTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Loom Status"
          value={(runtime.loomStatus?.status ?? 'unknown').toUpperCase()}
          hint="Direct health/config bridge from Narrative Loom"
          icon={<RadioTower size={18} />}
          tone={runtime.loomStatus?.status === 'online' ? 'emerald' : 'amber'}
        />
        <SummaryCard
          label="Connection"
          value={runtime.connectionState.toUpperCase()}
          hint="Centrifugo subscription and fallback polling state"
          icon={<Cable size={18} />}
          tone={runtime.connectionState === 'connected' ? 'cyan' : 'amber'}
        />
        <SummaryCard
          label="Agents"
          value={String(runtime.agentCount)}
          hint="Configured Loom agents currently reported by the service"
          icon={<Brain size={18} />}
          tone="violet"
        />
        <SummaryCard
          label="Providers"
          value={String(runtime.providerCount)}
          hint="Configured runtime providers visible to Loom status"
          icon={<Sparkles size={18} />}
          tone="cyan"
        />
        <SummaryCard
          label="Progress"
          value={`${runtime.progress.completed}/${runtime.progress.total}`}
          hint="Completed pipeline nodes for the active run"
          icon={<Route size={18} />}
          tone={runtime.errorCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
              Canonical Narrative Surface
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">Run Chronicle Weave</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              The workshop now owns the primary weave flow. Use this panel to submit,
              monitor, and inspect a pipeline run for the currently selected universe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void runtime.refreshLoomStatus()}
              disabled={runtime.isLoadingLoomStatus}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white disabled:opacity-50"
            >
              <RefreshCcw size={16} />
              Refresh Status
            </button>
            <button
              onClick={() => runtime.clearTrackedSession()}
              disabled={!runtime.activeTaskId}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              <FileText size={16} />
              Clear Live Session
            </button>
            <button
              onClick={() => void runtime.startWeave()}
              disabled={runtime.isSubmitting || runtime.isWeaving || !activeUniverseId}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <PlayCircle size={16} />
              {runtime.isSubmitting
                ? 'Submitting...'
                : runtime.isWeaving
                  ? 'Run Active'
                  : `Start Weave${activeUniverseId ? ` • Universe ${activeUniverseId}` : ''}`}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Active Run
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {runtime.activeTaskId
                  ? runtime.activeTaskId
                  : 'No live task is currently being tracked.'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Current Agent
              </p>
              <p className="mt-1 text-sm font-bold text-cyan-300">
                {runtime.currentAgent
                  ? NARRATIVE_NODE_MAP[runtime.currentAgent]?.label ?? runtime.currentAgent
                  : 'Idle'}
              </p>
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${runtime.progress.pct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {runtime.progress.completed} completed • {runtime.runningCount} running •{' '}
              {runtime.errorCount} error
            </span>
            <span>
              {runtime.connectionState === 'connected'
                ? 'Realtime live via Centrifugo'
                : 'Realtime degraded, fallback status polling enabled'}
            </span>
          </div>
        </div>

        {runtime.isRestoredSession ? (
          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            A previous active task session was restored for continuity after navigation.
          </div>
        ) : null}

        {runtime.lastError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {runtime.lastError}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              Pipeline Graph
            </p>
            <h3 className="mt-2 text-xl font-black text-white">Execution Topology</h3>
          </div>
          <FlowDiagram
            nodes={runtime.pipelineNodes}
            selectedNode={runtime.selectedNode}
            onNodeClick={runtime.setSelectedNode}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Node Inspector
              </p>
              <h3 className="mt-2 text-xl font-black text-white">
                {selectedNodeDefinition?.label ?? 'Select a node'}
              </h3>
            </div>

            {selectedNodeDefinition ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm font-bold text-white">{selectedNodeDefinition.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {selectedNodeDefinition.description}
                  </p>
                </div>

                {runtime.selectedNodeDetails?.stage ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                      Stage
                    </p>
                    <p className="mt-2 text-sm font-bold text-cyan-300">
                      {runtime.selectedNodeDetails.stage}
                    </p>
                  </div>
                ) : null}

                {runtime.selectedNodeDetails?.input ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                      Input
                    </p>
                    <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                      {JSON.stringify(runtime.selectedNodeDetails.input, null, 2)}
                    </pre>
                  </div>
                ) : null}

                {runtime.selectedNodeDetails?.output ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                      Output
                    </p>
                    <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                      {JSON.stringify(runtime.selectedNodeDetails.output, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-10 text-center text-sm text-slate-500">
                Pick a node from the graph to inspect its role and runtime payloads.
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Runtime Terminal
                </p>
                <h3 className="mt-2 text-xl font-black text-white">Event Stream</h3>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                {runtime.logs.length} lines
              </span>
            </div>
            <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-2xl border border-slate-900 bg-black px-4 py-4 font-mono text-[11px]">
              {runtime.logs.map((line, index) => {
                let tone = 'text-emerald-400';
                if (line.includes('[Error]')) tone = 'text-rose-400';
                if (line.includes('[Pipeline]')) tone = 'text-violet-400';
                if (line.includes('[Centrifugo]') || line.includes('[Polling]')) tone = 'text-cyan-400';

                return (
                  <p key={`${line}-${index}`} className={tone}>
                    <span className="mr-2 text-slate-700">
                      {String(index + 1).padStart(3, '0')}
                    </span>
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOfficeTab = () => (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
          Visual Pipeline Mode
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">Chibi Office MVP</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
          This office view is now backed by the same runtime state as the workshop run
          panel. It is intentionally a visualization layer, not a separate orchestration
          surface, so the team only has one source of truth for pipeline state.
        </p>
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
  );

  const renderReviewTab = () => (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
          Output Review
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">Intermediate and Final Artifacts</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
          Use this surface after or during a run to inspect the structured outline,
          storyboard, and final prose without switching into a legacy page.
        </p>
      </div>

      {runtime.narrativeResult?.headline || runtime.narrativeResult?.prose ? (
        <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                Final Output
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                {runtime.narrativeResult.headline ?? 'Narrative chronicle ready'}
              </h3>
              {runtime.narrativeResult.newsSlogan ? (
                <p className="mt-2 text-sm text-emerald-200/80">
                  {runtime.narrativeResult.newsSlogan}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(runtime.narrativeResult?.prose ?? '');
                  toast.success('Final prose copied.');
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white"
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>

          {runtime.narrativeResult.prose ? (
            <div className="rounded-3xl border border-slate-800 bg-black/50 p-6">
              <p className="whitespace-pre-wrap font-serif text-sm leading-8 text-slate-200">
                {runtime.narrativeResult.prose}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-slate-800 bg-[#111116] px-6 py-12 text-center text-sm text-slate-500">
          No final prose yet. Start a weave from the Run tab or wait for the active task to complete.
        </div>
      )}

      {runtime.intermediateOutputs.historical_outline ||
      runtime.intermediateOutputs.storyboard ||
      runtime.intermediateOutputs.final_prose ? (
        <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Intermediate Outputs
          </p>
          <div className="mt-5">
            <IntermediateOutputsPanel
              historicalOutline={runtime.intermediateOutputs.historical_outline}
              storyboard={runtime.intermediateOutputs.storyboard}
              finalProse={runtime.intermediateOutputs.final_prose}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderUtilitiesTab = () => (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">
          Sidecar Tools
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">Utilities</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
          These tools remain available, but they are now clearly separated from the
          main weave flow so the workshop stays focused on chronicle generation first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[24px] border border-slate-800 bg-[#111116] p-3">
        {utilityTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveUtilityTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
              activeUtilityTab === tab.id
                ? 'bg-white text-black'
                : 'border border-slate-700/50 bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeUtilityTab === 'actor' ? <ActorIntentTab /> : null}
      {activeUtilityTab === 'scribe' ? <ScribeTab /> : null}
      {activeUtilityTab === 'forge' ? <AssetForgeTab /> : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05060a] px-4 pb-24 pt-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[36px] border border-slate-800 bg-[#0d0f14] px-6 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-3 inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-400"
          >
            <Sparkles size={12} />
            Canonical Narrative Loom Surface
          </motion.div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Loom Workshop
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
                Unified home for submitting runs, watching realtime progress, using the
                office view, and reviewing outputs. Narrative Studio now becomes a legacy
                monitor instead of a parallel product surface.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              Active universe: <span className="font-black text-white">{activeUniverseId ?? 'None selected'}</span>
            </div>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 rounded-[24px] border border-slate-800 bg-[#0d0f14] p-3">
          {workshopTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'border border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'run' ? renderRunTab() : null}
          {activeTab === 'office' ? renderOfficeTab() : null}
          {activeTab === 'review' ? renderReviewTab() : null}
          {activeTab === 'utilities' ? renderUtilitiesTab() : null}
        </motion.div>
      </div>
    </div>
  );
}
