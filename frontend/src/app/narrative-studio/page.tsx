'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  Globe2,
  Loader2,
  PlayCircle,
  ScrollText,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUniverse } from '@/contexts/UniverseContext';
import { useNarrativeRuntime } from '@/features/narrative-runtime/useNarrativeRuntime';
import { NARRATIVE_PIPELINE_NODES, NARRATIVE_NODE_MAP } from '@/features/narrative-runtime/types';

// ── Types ─────────────────────────────────────

type OutputTab = 'prose' | 'storyboard' | 'vfx';

// ── ERA options ───────────────────────────────

const ERAS = [
  { value: 'genesis', label: 'Genesis', description: 'Stone age, primordial conflicts' },
  { value: 'ancient', label: 'Ancient', description: 'City-states, early empires' },
  { value: 'medieval', label: 'Medieval', description: 'Feudal kingdoms, chivalric code' },
  { value: 'renaissance', label: 'Renaissance', description: 'Art, science, early capitalism' },
  { value: 'industrial', label: 'Industrial', description: 'Steam power, mass movement' },
  { value: 'modern', label: 'Modern', description: 'Geopolitics, technology, ideology' },
  { value: 'transcendent', label: 'Transcendent', description: 'Post-scarcity, cosmic scope' },
];

// ── Agent Timeline ─────────────────────────────

function AgentTimeline({ nodes, currentAgent }: {
  nodes: Record<string, { status: string; startedAt?: number; completedAt?: number; durationMs?: number }>;
  currentAgent: string | null;
}) {
  return (
    <div className="space-y-1">
      {NARRATIVE_PIPELINE_NODES.map(node => {
        const state = nodes[node.id];
        const status = state?.status ?? 'idle';
        const isCurrent = currentAgent === node.id;
        const duration = state?.durationMs ? `${(state.durationMs / 1000).toFixed(1)}s` : null;

        return (
          <div
            key={node.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
              isCurrent ? 'bg-violet-500/10 border border-violet-500/20' : 'border border-transparent'
            }`}
          >
            {/* Status icon */}
            <div className="flex-shrink-0">
              {status === 'running' && <Loader2 size={13} className="animate-spin text-violet-400" />}
              {status === 'completed' && <CheckCircle2 size={13} className="text-emerald-400" />}
              {status === 'error' && <XCircle size={13} className="text-rose-400" />}
              {status === 'idle' && (
                <div className="h-3 w-3 rounded-full border border-slate-700 bg-slate-900" />
              )}
            </div>

            {/* Accent dot + label */}
            <span
              className="h-1.5 w-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: node.accent }}
            />
            <span className={`text-xs font-bold flex-1 truncate ${
              isCurrent ? 'text-white' : status === 'completed' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {node.label}
            </span>

            {/* Phase badge */}
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              node.phase === 'engine' ? 'text-amber-500' : 'text-violet-500'
            }`}>
              {node.phase}
            </span>

            {/* Duration */}
            {duration && (
              <span className="text-[10px] text-slate-600 tabular-nums">{duration}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Output Tab Panel ───────────────────────────

function OutputPanel({ tab, runtime }: {
  tab: OutputTab;
  runtime: ReturnType<typeof useNarrativeRuntime>;
}) {
  if (tab === 'prose') {
    const prose = runtime.narrativeResult?.prose ?? runtime.intermediateOutputs.final_prose;
    const headline = runtime.narrativeResult?.headline;
    const slogan = runtime.narrativeResult?.newsSlogan;

    if (!prose) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 px-4 py-16 text-center">
          <ScrollText size={28} className="mb-3 text-slate-700" />
          <p className="text-sm font-bold text-slate-600">No prose yet</p>
          <p className="mt-1 text-xs text-slate-700">Submit a weave from the left panel to generate output.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {headline && (
          <div>
            <h3 className="text-xl font-black text-white leading-snug">{headline}</h3>
            {slogan && <p className="mt-1 text-sm text-emerald-300/80 italic">{slogan}</p>}
          </div>
        )}
        <div className="relative rounded-2xl border border-slate-800 bg-black/50 p-6">
          <button
            onClick={() => { navigator.clipboard.writeText(prose); toast.success('Copied.'); }}
            className="absolute right-4 top-4 rounded-xl border border-slate-800 bg-slate-900 p-2 transition hover:bg-slate-800"
          >
            <Copy size={13} className="text-slate-400" />
          </button>
          <p className="whitespace-pre-wrap font-serif text-sm leading-8 text-slate-200">
            {prose}
          </p>
        </div>
      </div>
    );
  }

  if (tab === 'storyboard') {
    const sb = runtime.intermediateOutputs.storyboard;
    if (!sb) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 px-4 py-16 text-center">
          <BookOpen size={28} className="mb-3 text-slate-700" />
          <p className="text-sm font-bold text-slate-600">No storyboard yet</p>
        </div>
      );
    }
    return (
      <pre className="overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/50 p-5 text-xs leading-relaxed text-slate-300">
        {typeof sb === 'string' ? sb : JSON.stringify(sb, null, 2)}
      </pre>
    );
  }

  if (tab === 'vfx') {
    const vfx = runtime.intermediateOutputs.vfx_config;
    if (!vfx) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 px-4 py-16 text-center">
          <Sparkles size={28} className="mb-3 text-slate-700" />
          <p className="text-sm font-bold text-slate-600">No VFX config yet</p>
        </div>
      );
    }
    return (
      <pre className="overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/50 p-5 text-xs leading-relaxed text-slate-300">
        {JSON.stringify(vfx, null, 2)}
      </pre>
    );
  }

  return null;
}

// ── Main Page ──────────────────────────────────

export default function NarrativeStudioPage() {
  const { activeUniverseId } = useUniverse();
  const runtime = useNarrativeRuntime();

  // Form state
  const [selectedEra, setSelectedEra] = useState('genesis');
  const [tickStart, setTickStart] = useState(1);
  const [tickEnd, setTickEnd] = useState(100);
  const [customContext, setCustomContext] = useState('');
  const [outputTab, setOutputTab] = useState<OutputTab>('prose');

  const outputTabs: Array<{ id: OutputTab; label: string; icon: React.ReactNode }> = [
    { id: 'prose', label: 'Prose', icon: <ScrollText size={14} /> },
    { id: 'storyboard', label: 'Storyboard', icon: <BookOpen size={14} /> },
    { id: 'vfx', label: 'Visual Config', icon: <Sparkles size={14} /> },
  ];

  const completedNodes = Object.values(runtime.pipelineNodes).filter(n => n.status === 'completed').length;
  const totalNodes = NARRATIVE_PIPELINE_NODES.length;

  const handleSubmit = async () => {
    if (!activeUniverseId) {
      toast.error('Select a universe first.');
      return;
    }
    if (tickEnd <= tickStart) {
      toast.error('Tick end must be greater than tick start.');
      return;
    }
    await runtime.startWeave();
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white">

      {/* ── Header ── */}
      <div className="border-b border-slate-800/60 bg-[#08090e] px-6 py-6 sm:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                <Wand2 size={11} />
                Narrative Studio
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Chronicle Weaver</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Submit raw world events and watch the 18-node pipeline transform them into epic prose.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm">
              Universe: <span className="font-black text-white">{activeUniverseId ?? 'None selected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: 3 panels ── */}
      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr_400px] xl:grid-cols-[380px_1fr_440px]">

          {/* ─────── Panel 1: Submit Form ─────── */}
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-800 bg-[#111116] p-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-400">
                Weave Parameters
              </p>

              {/* Era selector */}
              <div className="mb-4 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Globe2 size={12} className="text-slate-500" />
                  World Era
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {ERAS.map(era => (
                    <button
                      key={era.value}
                      onClick={() => setSelectedEra(era.value)}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        selectedEra === era.value
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <ChevronRight
                        size={12}
                        className={`mt-0.5 flex-shrink-0 transition ${selectedEra === era.value ? 'text-emerald-400' : 'text-slate-700'}`}
                      />
                      <div>
                        <span className={`text-xs font-bold ${selectedEra === era.value ? 'text-white' : 'text-slate-400'}`}>
                          {era.label}
                        </span>
                        <p className="text-[10px] text-slate-600">{era.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tick range pickers */}
              <div className="mb-4 space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Calendar size={12} className="text-slate-500" />
                  Tick Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[10px] text-slate-500">Start tick</p>
                    <input
                      type="number"
                      min={0}
                      max={tickEnd - 1}
                      value={tickStart}
                      onChange={e => setTickStart(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] text-slate-500">End tick</p>
                    <input
                      type="number"
                      min={tickStart + 1}
                      value={tickEnd}
                      onChange={e => setTickEnd(Math.max(tickStart + 1, parseInt(e.target.value) || tickStart + 1))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                {/* Tick range visual */}
                <div className="rounded-xl bg-slate-900 px-3 py-2 text-center text-xs text-slate-500">
                  <span className="font-black text-white">{tickEnd - tickStart}</span> ticks · Era:{' '}
                  <span className="font-black text-emerald-400">{ERAS.find(e => e.value === selectedEra)?.label}</span>
                </div>
              </div>

              {/* Custom context */}
              <div className="mb-5 space-y-2">
                <label className="text-xs font-bold text-slate-300">Custom Context (optional)</label>
                <textarea
                  value={customContext}
                  onChange={e => setCustomContext(e.target.value)}
                  placeholder="Add narrative hints, emphasis points, or special instructions for the pipeline…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 placeholder-slate-600 transition focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              {/* Submit button */}
              <button
                onClick={() => void handleSubmit()}
                disabled={runtime.isSubmitting || runtime.isWeaving || !activeUniverseId}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {runtime.isSubmitting ? (
                  <><Loader2 size={15} className="animate-spin" />Submitting…</>
                ) : runtime.isWeaving ? (
                  <><Loader2 size={15} className="animate-spin" />Run Active…</>
                ) : (
                  <><PlayCircle size={15} />Start Weave</>
                )}
              </button>

              {runtime.lastError && (
                <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {runtime.lastError}
                </div>
              )}
            </div>
          </div>

          {/* ─────── Panel 2: Pipeline Progress ─────── */}
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-800 bg-[#111116] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-400">
                  Pipeline Execution
                </p>
                <span className="text-xs text-slate-500">
                  {completedNodes}/{totalNodes} nodes
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-900">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${runtime.progress.pct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Status badges */}
              <div className="mb-5 flex flex-wrap gap-2">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                  runtime.connectionState === 'connected'
                    ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${runtime.connectionState === 'connected' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
                  {runtime.connectionState}
                </div>
                {runtime.currentAgent && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-violet-400">
                    <Loader2 size={10} className="animate-spin" />
                    {NARRATIVE_NODE_MAP[runtime.currentAgent]?.label ?? runtime.currentAgent}
                  </div>
                )}
                {runtime.errorCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-400">
                    {runtime.errorCount} error{runtime.errorCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Agent timeline */}
              <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-slate-900 bg-slate-950/40 p-3">
                <AgentTimeline nodes={runtime.pipelineNodes} currentAgent={runtime.currentAgent} />
              </div>
            </div>
          </div>

          {/* ─────── Panel 3: Output ─────── */}
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-800 bg-[#111116] p-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-amber-400">
                Output Review
              </p>

              {/* Output tab pills */}
              <div className="mb-5 flex gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-1.5">
                {outputTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setOutputTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition ${
                      outputTab === tab.id ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Output content with animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={outputTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <OutputPanel tab={outputTab} runtime={runtime} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
