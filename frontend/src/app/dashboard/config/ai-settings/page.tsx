'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  Cpu,
  FlaskConical,
  Layers,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNarrativeRuntime } from '@/features/narrative-runtime/useNarrativeRuntime';
import { NARRATIVE_PIPELINE_NODES } from '@/features/narrative-runtime/types';

// ── Types ─────────────────────────────────────

interface AgentConfig {
  agentId: string;
  model: string;
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
}

interface EpistemicConfig {
  noiseLevel: number;
  tier: 'oracle' | 'historian' | 'myth';
  strictMode: boolean;
}

// ── Constants ─────────────────────────────────

const AVAILABLE_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'anthropic' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google' },
  { value: 'gemini-flash', label: 'Gemini Flash', provider: 'google' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'deepseek' },
  { value: 'llama-3.1-8b', label: 'Llama 3.1 8B', provider: 'local' },
];

const ERA_TIERS = [
  { value: 'oracle' as const, label: 'Oracle', description: 'Omniscient perspective, highest quality', color: 'violet' },
  { value: 'historian' as const, label: 'Historian', description: 'Balanced factual + narrative blend', color: 'cyan' },
  { value: 'myth' as const, label: 'Myth', description: 'Mythic resonance, poetic license', color: 'amber' },
];

// ── Sub-components ─────────────────────────────

function SectionHeader({ icon, label, description, color = 'cyan' }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className={`rounded-2xl border p-3 ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${colorMap[color].split(' ')[0]}`}>{label}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function RangeSlider({ label, value, min, max, step, unit, onChange, color = 'cyan' }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const colorMap: Record<string, string> = {
    cyan: 'accent-cyan-400',
    violet: 'accent-violet-400',
    amber: 'accent-amber-400',
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-black text-white">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 ${colorMap[color]}`}
        style={{
          background: `linear-gradient(to right, ${color === 'cyan' ? '#22d3ee' : color === 'violet' ? '#a78bfa' : '#f59e0b'} ${pct}%, #1e293b ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ModelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = AVAILABLE_MODELS.find(m => m.value === value);

  const providerColors: Record<string, string> = {
    openai: 'text-emerald-400',
    anthropic: 'text-orange-400',
    google: 'text-blue-400',
    deepseek: 'text-cyan-400',
    local: 'text-slate-400',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs transition hover:border-slate-600"
      >
        <span className="font-bold text-white">{selected?.label ?? value}</span>
        <div className="flex items-center gap-2">
          {selected && (
            <span className={`text-[10px] font-black uppercase ${providerColors[selected.provider]}`}>
              {selected.provider}
            </span>
          )}
          <ChevronDown size={12} className="text-slate-500" />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-700 bg-[#12141a] shadow-2xl"
          >
            {AVAILABLE_MODELS.map(m => (
              <button
                key={m.value}
                onClick={() => { onChange(m.value); setOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-xs transition hover:bg-slate-800 ${value === m.value ? 'bg-slate-800' : ''}`}
              >
                <span className={`font-bold ${value === m.value ? 'text-white' : 'text-slate-300'}`}>{m.label}</span>
                <span className={`text-[10px] font-black uppercase ${providerColors[m.provider]}`}>{m.provider}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──────────────────────────────────

export default function AISettingsPage() {
  const runtime = useNarrativeRuntime();

  // Build initial agent configs from loom status
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(() =>
    NARRATIVE_PIPELINE_NODES.map(node => {
      const loomAgent = runtime.loomStatus?.agents?.[node.id];
      return {
        agentId: node.id,
        model: loomAgent?.model ?? 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2048,
        retryAttempts: 3,
      };
    })
  );

  const [epistemic, setEpistemic] = useState<EpistemicConfig>({
    noiseLevel: 0.3,
    tier: 'historian',
    strictMode: false,
  });

  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'routing' | 'params' | 'epistemic'>('routing');

  // Sync models from loom status once available
  useEffect(() => {
    if (!runtime.loomStatus?.agents) return;
    setAgentConfigs(prev =>
      prev.map(cfg => {
        const loomAgent = runtime.loomStatus!.agents[cfg.agentId];
        if (loomAgent?.model) return { ...cfg, model: loomAgent.model };
        return cfg;
      })
    );
  }, [runtime.loomStatus]);

  const updateAgentConfig = (agentId: string, patch: Partial<AgentConfig>) => {
    setAgentConfigs(prev => prev.map(c => c.agentId === agentId ? { ...c, ...patch } : c));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: POST to backend when endpoint is available
      await new Promise(r => setTimeout(r, 800));
      toast.success('AI configuration saved.');
    } catch {
      toast.error('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const engineNodes = NARRATIVE_PIPELINE_NODES.filter(n => n.phase === 'engine');
  const agentNodes = NARRATIVE_PIPELINE_NODES.filter(n => n.phase === 'agent');

  const sections = [
    { id: 'routing' as const, label: 'LLM Routing', icon: <Cpu size={14} /> },
    { id: 'params' as const, label: 'Agent Params', icon: <Sliders size={14} /> },
    { id: 'epistemic' as const, label: 'Epistemic Layer', icon: <FlaskConical size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#05060a] px-4 pb-24 pt-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 rounded-[36px] border border-slate-800 bg-[#0d0f14] px-6 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-3 inline-flex items-center gap-3 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-violet-400"
          >
            <Settings2 size={12} />
            AI Configuration
          </motion.div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">AI Settings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                Configure LLM routing per agent, tune model parameters, and manage the epistemic layer
                that governs how the pipeline interprets world events.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setAgentConfigs(
                    NARRATIVE_PIPELINE_NODES.map(n => ({
                      agentId: n.id,
                      model: 'gpt-4o-mini',
                      temperature: 0.7,
                      maxTokens: 2048,
                      retryAttempts: 3,
                    }))
                  );
                  setEpistemic({ noiseLevel: 0.3, tier: 'historian', strictMode: false });
                  toast.info('Reset to defaults.');
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white"
              >
                <RotateCcw size={15} />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-violet-400 disabled:opacity-50"
              >
                <Save size={15} />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </header>

        {/* Section nav */}
        <nav className="mb-8 flex flex-wrap gap-2 rounded-[24px] border border-slate-800 bg-[#0d0f14] p-3">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeSection === s.id
                  ? 'bg-white text-black'
                  : 'border border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >

          {/* ── Section A: LLM Routing ── */}
          {activeSection === 'routing' && (
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
                <SectionHeader
                  icon={<Cpu size={18} />}
                  label="LLM Routing"
                  description="Assign a language model to each pipeline node. Engine nodes derive analysis; Agent nodes produce creative output."
                />

                {/* Provider health summary */}
                {runtime.loomStatus?.providers && (
                  <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Object.entries(runtime.loomStatus.providers).map(([name, info]) => (
                      <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{name}</span>
                          <span className={`h-2 w-2 rounded-full ${info.status === 'ok' || info.key_present ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        </div>
                        <p className={`mt-2 text-xs font-bold ${info.status === 'ok' || info.key_present ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {info.status ?? (info.key_present ? 'Key present' : 'No key')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Phase 1: Engines */}
                <div className="mb-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
                    Phase 1 — Engines (Data Analysis)
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {engineNodes.map(node => {
                      const cfg = agentConfigs.find(c => c.agentId === node.id)!;
                      return (
                        <div key={node.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: node.accent }}
                            />
                            <span className="text-xs font-bold text-white truncate">{node.label}</span>
                          </div>
                          <ModelSelect value={cfg.model} onChange={v => updateAgentConfig(node.id, { model: v })} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Phase 2: Agents */}
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">
                    Phase 2 — Agents (Content Creation)
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {agentNodes.map(node => {
                      const cfg = agentConfigs.find(c => c.agentId === node.id)!;
                      return (
                        <div key={node.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: node.accent }}
                            />
                            <span className="text-xs font-bold text-white truncate">{node.label}</span>
                            <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-violet-400">
                              {node.role.split(' ')[0]}
                            </span>
                          </div>
                          <ModelSelect value={cfg.model} onChange={v => updateAgentConfig(node.id, { model: v })} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Section B: Agent Parameters ── */}
          {activeSection === 'params' && (
            <div className="space-y-4">
              <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
                <SectionHeader
                  icon={<Sliders size={18} />}
                  label="Agent Parameters"
                  description="Fine-tune generation settings for each agent. Click an agent to expand its parameters."
                  color="cyan"
                />

                <div className="space-y-2">
                  {NARRATIVE_PIPELINE_NODES.map(node => {
                    const cfg = agentConfigs.find(c => c.agentId === node.id)!;
                    const isOpen = expandedAgent === node.id;
                    return (
                      <div key={node.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                        <button
                          onClick={() => setExpandedAgent(isOpen ? null : node.id)}
                          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-slate-900/60"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: node.accent }}
                            />
                            <span className="text-sm font-bold text-white">{node.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                              node.phase === 'engine' ? 'bg-amber-500/15 text-amber-400' : 'bg-violet-500/15 text-violet-400'
                            }`}>
                              {node.phase}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>T: {cfg.temperature}</span>
                            <span>Tokens: {cfg.maxTokens.toLocaleString()}</span>
                            <ChevronDown
                              size={14}
                              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 gap-6 border-t border-slate-800/60 px-5 pb-6 pt-5 sm:grid-cols-3">
                                <RangeSlider
                                  label="Temperature"
                                  value={cfg.temperature}
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  onChange={v => updateAgentConfig(node.id, { temperature: v })}
                                  color="cyan"
                                />
                                <RangeSlider
                                  label="Max Tokens"
                                  value={cfg.maxTokens}
                                  min={256}
                                  max={8192}
                                  step={256}
                                  onChange={v => updateAgentConfig(node.id, { maxTokens: v })}
                                  color="violet"
                                />
                                <RangeSlider
                                  label="Retry Attempts"
                                  value={cfg.retryAttempts}
                                  min={1}
                                  max={5}
                                  step={1}
                                  onChange={v => updateAgentConfig(node.id, { retryAttempts: v })}
                                  color="amber"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Section C: Epistemic Layer ── */}
          {activeSection === 'epistemic' && (
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-800 bg-[#111116] p-6">
                <SectionHeader
                  icon={<FlaskConical size={18} />}
                  label="Epistemic Layer"
                  description="Control how the pipeline processes world truth. Noise levels affect dramatic tension; epistemic tiers shape the narrator's omniscience."
                  color="amber"
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Noise level */}
                  <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex items-center gap-3">
                      <Zap size={16} className="text-amber-400" />
                      <p className="text-sm font-black text-white">World Noise Level</p>
                    </div>
                    <RangeSlider
                      label="Noise Intensity"
                      value={epistemic.noiseLevel}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={v => setEpistemic(e => ({ ...e, noiseLevel: v }))}
                      color="amber"
                    />
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                        <span>0.0 — Perfectly stable world</span>
                        <span className="font-bold text-emerald-400">Calm chronicle</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                        <span>0.5 — Moderate volatility</span>
                        <span className="font-bold text-amber-400">Dramatic tension</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                        <span>1.0 — Chaotic collapse state</span>
                        <span className="font-bold text-rose-400">Epic crisis</span>
                      </div>
                    </div>
                  </div>

                  {/* Epistemic tier */}
                  <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex items-center gap-3">
                      <Layers size={16} className="text-violet-400" />
                      <p className="text-sm font-black text-white">Epistemic Tier</p>
                    </div>
                    <div className="space-y-2">
                      {ERA_TIERS.map(tier => (
                        <button
                          key={tier.value}
                          onClick={() => setEpistemic(e => ({ ...e, tier: tier.value }))}
                          className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                            epistemic.tier === tier.value
                              ? 'border-violet-500/40 bg-violet-500/10'
                              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                          }`}
                        >
                          <div className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                            tier.color === 'violet' ? 'bg-violet-400' :
                            tier.color === 'cyan' ? 'bg-cyan-400' : 'bg-amber-400'
                          }`} />
                          <div>
                            <p className={`text-sm font-black ${epistemic.tier === tier.value ? 'text-white' : 'text-slate-300'}`}>
                              {tier.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{tier.description}</p>
                          </div>
                          {epistemic.tier === tier.value && (
                            <div className="ml-auto rounded-full bg-violet-500/20 p-1">
                              <Sparkles size={10} className="text-violet-400" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strict mode */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield size={16} className="text-rose-400" />
                        <div>
                          <p className="text-sm font-black text-white">Epistemic Strict Mode</p>
                          <p className="mt-1 text-xs text-slate-500">
                            When enabled, the Critic agent will enforce strict epistemic coherence and reject prose that contradicts world axioms.
                            Increases revision loop likelihood.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEpistemic(e => ({ ...e, strictMode: !e.strictMode }))}
                        className={`relative h-7 w-12 rounded-full transition ${epistemic.strictMode ? 'bg-rose-500' : 'bg-slate-700'}`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${epistemic.strictMode ? 'left-6' : 'left-1'}`}
                        />
                      </button>
                    </div>

                    {/* Resonance Scar display */}
                    <div className="mt-5 border-t border-slate-800 pt-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot size={13} className="text-slate-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Resonance Scars (read-only — populated by pipeline)
                        </p>
                      </div>
                      <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-xs text-slate-600">
                        No resonance scars recorded yet. Run the pipeline to populate mythic echo patterns.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
