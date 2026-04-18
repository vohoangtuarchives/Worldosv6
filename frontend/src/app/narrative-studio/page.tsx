'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import AgentNode from '@/components/ui/narrative/AgentNode';
import FlowDiagram from '@/components/ui/narrative/FlowDiagram';
import IntermediateOutputsPanel from '@/components/ui/narrative/IntermediateOutputsPanel';
import api from '@/lib/api';
import { getCentrifuge } from '@/lib/centrifugo';
import type { ConnectedContext, PublicationContext } from 'centrifuge';
import { useUniverse } from '@/contexts/UniverseContext';
import { toast } from 'sonner';

interface AgentConfig {
  id?: string;
  provider: string;
  model: string;
  role: string;
  tier?: string;
}

interface ProviderConfig {
  id?: string;
  name?: string;
  status: string;
}

interface LoomStatus {
  status: 'online' | 'offline' | 'degraded';
  agents: Record<string, AgentConfig> | AgentConfig[];
  providers: Record<string, ProviderConfig> | ProviderConfig[];
  version: string;
}

interface PipelineProgress {
  completed: number;
  total: number;
  pct: number;
}

interface CentrifugoEvent {
  type: string;
  agent?: string;
  duration_ms?: number;
  progress?: PipelineProgress;
  error?: string;
  final_prose?: string;
  news_headline?: string;
  historical_outline?: any;
  storyboard?: any;
  vfx_config?: any;
  news_slogan?: string;
  ts: number;
  input?: any;
  output?: any;
  stage?: string;
}

export default function NarrativeStudio() {
  const { activeUniverseId } = useUniverse();
  const [data, setData] = useState<LoomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    'System initialized.',
    'Awaiting chronicles and raw triggers from Core Simulation...'
  ]);
  const [centrifugoReady, setCentrifugoReady] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<number | null>(null);
  const [progress, setProgress] = useState<PipelineProgress>({ completed: 0, total: 18, pct: 0 });
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('idle');
  const [completedAgents, setCompletedAgents] = useState<Record<string, { durationMs: number }>>({});
  const [narrativeResult, setNarrativeResult] = useState<{ headline?: string; prose?: string } | null>(null);
  const [pipelineNodes, setPipelineNodes] = useState<Record<string, { status: 'idle' | 'running' | 'completed' | 'error'; startedAt?: number; completedAt?: number }>>({});
  const [intermediateOutputs, setIntermediateOutputs] = useState<{ historical_outline?: any; storyboard?: any; final_prose?: string }>({});
  const [agentDetails, setAgentDetails] = useState<Record<string, { input?: any; output?: any; stage?: string }>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Helper function to determine current phase based on agent
  const getPhaseFromAgent = (agent: string | null): string => {
    if (!agent) return 'idle';
    if (['Event_Normalizer', 'Universe_Bridge'].includes(agent)) return 'normalization';
    if (['Entropy_Engine', 'Style_Analyzer', 'Attractor_Engine', 'Dramatic_Arc', 'Phase_Engine', 'Singularity_Engine', 'Chief_Editor'].includes(agent)) return 'engines';
    if (['The_Historian', 'The_Mythologist', 'The_Psychologist', 'The_Director', 'The_Wordsmith', 'The_Critic'].includes(agent)) return 'agents';
    if (['VFX_Director', 'The_Archivist', 'News_Anchor'].includes(agent)) return 'export';
    return 'unknown';
  };

  // Update current phase when currentAgent changes
  useEffect(() => {
    setCurrentPhase(getPhaseFromAgent(currentAgent));
  }, [currentAgent]);

  // Calculate estimated time remaining
  useEffect(() => {
    if (progress.completed > 0 && progress.total > 0) {
      const completedDuration = Object.values(completedAgents).reduce((sum, { durationMs }) => sum + durationMs, 0);
      const avgDurationPerAgent = completedDuration / progress.completed;
      const remainingAgents = progress.total - progress.completed;
      const estimatedRemaining = avgDurationPerAgent * remainingAgents;
      setEstimatedTimeRemaining(estimatedRemaining);
    }
  }, [progress, completedAgents]);

  // Defined before startWeaveTask so it is stable when captured in the closure.
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, msg].slice(-50));
    requestAnimationFrame(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    });
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/loom-status');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch Narrative Loom status', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startWeaveTask = useCallback(async () => {
    if (!activeUniverseId) {
      addLog('[Error] No active universe selected');
      return;
    }

    try {
      addLog(`[Weave] Dispatching chronicle generation for universe ${activeUniverseId}...`);
      setCompletedAgents({});
      setNarrativeResult(null);
      setProgress({ completed: 0, total: 18, pct: 0 });
      setPipelineNodes({});
      setIntermediateOutputs({});
      setCurrentAgent(null);

      setActiveTaskId(`local-${Date.now()}`);

      const res = await api.post(`/worldos/universes/${activeUniverseId}/generate-chronicle`);
      const responseData = res.data?.data ?? res.data;

      // Lưu task_id và world_id từ narrative-loom response
      if (responseData?.task_id) {
        setActiveTaskId(responseData.task_id);
        setWorldId(responseData.world_id ?? null);
        addLog(`[Weave] Task submitted: ${responseData.task_id}`);
      } else {
        // Fallback: nếu không có task_id (PHP service), set narrativeResult ngay
        setNarrativeResult({
          headline: responseData?.title ?? null,
          prose: responseData?.content ?? null,
        });
        addLog(`[Pipeline] Complete! Chronicle #${responseData?.id} generated (ticks ${responseData?.from_tick}\u2013${responseData?.to_tick}).`);
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error('Failed to start weave task', err);
      addLog(`[Error] Failed to start weave: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setActiveTaskId(null);
    }
  }, [activeUniverseId, addLog]);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => { void fetchStatus(); }, 30_000);

    const centrifuge = getCentrifuge();

    // Store handler refs so we can remove them on cleanup.
    // Using named functions prevents duplicate listener accumulation on the singleton.
    const onConnected = (ctx: ConnectedContext) => {
      setCentrifugoReady(true);
      addLog(`[Centrifugo] Connected. Node: ${ctx.client}`);
    };
    const onDisconnected = () => {
      setCentrifugoReady(false);
      addLog('[Centrifugo] Disconnected.');
    };
    const onConnecting = () => {
      addLog('[Centrifugo] Connecting...');
    };

    centrifuge.on('connected', onConnected);
    centrifuge.on('disconnected', onDisconnected);
    centrifuge.on('connecting', onConnecting);

    centrifuge.connect();

    return () => {
      clearInterval(interval);
      centrifuge.off('connected', onConnected);
      centrifuge.off('disconnected', onDisconnected);
      centrifuge.off('connecting', onConnecting);
      // Do NOT disconnect — getCentrifuge() returns a singleton shared across the app.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — fetchStatus/addLog are stable useCallback refs

  // Subscribe to task-specific Centrifugo channel for narrative events from NarrativeLoom pipeline.
  // Backend (Loom) publishes agent/pipeline progress to narrative:{world_id}:{task_id}.
  useEffect(() => {
    if (!centrifugoReady || !activeTaskId || !worldId) return;

    const centrifuge = getCentrifuge();
    const taskChannel = `narrative:${worldId}:${activeTaskId}`;
    const pubSub = centrifuge.newSubscription(taskChannel);

    pubSub.on('publication', (ctx: PublicationContext) => {
      const event = ctx.data as CentrifugoEvent;

      switch (event.type) {
        case 'agent_started':
          if (event.agent) {
            const agentKey = event.agent;
            setCurrentAgent(agentKey);
            setPipelineNodes(prev => ({
              ...prev,
              [agentKey]: { status: 'running', startedAt: Date.now() }
            }));
            if (event.input || event.stage) {
              setAgentDetails(prev => ({
                ...prev,
                [agentKey]: {
                  input: event.input,
                  output: prev[agentKey]?.output,
                  stage: event.stage
                }
              }));
            }
            addLog(`[Agent] ${agentKey} started${event.stage ? ` (${event.stage})` : ''}`);
          }
          break;

        case 'agent_done':
          if (event.agent && event.duration_ms !== undefined) {
            const agentKey = event.agent;
            const durationMs = event.duration_ms;
            setCurrentAgent(null);
            setCompletedAgents(prev => ({
              ...prev,
              [agentKey]: { durationMs }
            }));
            setPipelineNodes(prev => ({
              ...prev,
              [agentKey]: { status: 'completed', startedAt: prev[agentKey]?.startedAt, completedAt: Date.now() }
            }));
            if (event.output || event.stage) {
              setAgentDetails(prev => ({
                ...prev,
                [agentKey]: {
                  input: prev[agentKey]?.input,
                  output: event.output,
                  stage: event.stage
                }
              }));
            }
            if (event.progress) {
              setProgress(event.progress);
            }
            addLog(`[Agent] ${agentKey} completed (${durationMs}ms)`);
          }
          break;

        case 'agent_error':
          if (event.agent && event.error) {
            const agentKey = event.agent;
            setCurrentAgent(null);
            setPipelineNodes(prev => ({
              ...prev,
              [agentKey]: { status: 'error', startedAt: prev[agentKey]?.startedAt, completedAt: Date.now() }
            }));
            if (event.error) {
              setAgentDetails(prev => ({
                ...prev,
                [agentKey]: {
                  input: prev[agentKey]?.input,
                  output: { error: event.error },
                  stage: event.stage
                }
              }));
            }
            addLog(`[Error] ${agentKey} failed: ${event.error}`);
          }
          break;

        case 'pipeline_done':
          setCurrentAgent(null);
          setProgress({ completed: 18, total: 18, pct: 100 });
          setIntermediateOutputs({
            historical_outline: event.historical_outline,
            storyboard: event.storyboard,
            final_prose: event.final_prose,
          });
          setNarrativeResult({
            headline: event.news_headline,
            prose: event.final_prose,
          });
          addLog(`[Pipeline] Complete! Task ${activeTaskId} finished.`);
          setActiveTaskId(null);
          break;

        case 'pipeline_error':
          setCurrentAgent(null);
          addLog(`[Error] Pipeline failed: ${event.error}`);
          setActiveTaskId(null);
          break;
      }
    });

    pubSub.subscribe();
    addLog(`[Centrifugo] Subscribed to ${taskChannel}`);

    return () => {
      pubSub.unsubscribe();
      pubSub.removeAllListeners();
    };
  }, [centrifugoReady, activeTaskId, worldId, addLog]);


  return (
    <div className="min-h-screen bg-[#050508] text-white p-8 font-mono bg-[url('/grid.svg')] bg-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#050508] to-[#050508] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 border-b border-white/10 pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-violet-400 mb-2">Narrative Studio</h1>
            <p className="text-sm text-gray-400">Monitoring the WorldOS Python Language Generation Core.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest text-gray-500">Core Status:</span>
            {loading ? (
              <span className="text-xs animate-pulse text-yellow-400 font-bold">SCANNING...</span>
            ) : (
              <span className={`text-xs font-bold px-3 py-1 rounded-sm border ${data?.status === 'online' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/50 text-rose-400 bg-rose-500/10'}`}>
                {data?.status?.toUpperCase() || 'DISCONNECTED'}
              </span>
            )}
            <span className={`w-2 h-2 rounded-full ${centrifugoReady ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-gray-600 animate-pulse'}`}
              title={centrifugoReady ? 'Centrifugo connected' : 'Centrifugo disconnected'} />

            {/* Weave Control Button */}
            <button
              onClick={startWeaveTask}
              disabled={!!activeTaskId}
              className={`ml-4 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all
                ${!!activeTaskId
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-violet-500 hover:bg-violet-400 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                }`}
            >
              {activeTaskId ? 'WEAVING...' : `START WEAVE (Universe: ${activeUniverseId || 'N/A'})`}
            </button>
          </div>
        </header>

        {/* Pipeline Progress */}
        {activeTaskId && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs uppercase tracking-widest text-violet-400">Narrative Generation</h2>
              {progress.pct > 0
                ? <span className="text-xs text-gray-400">{progress.completed}/{progress.total} agents ({progress.pct}%)</span>
                : <span className="text-xs text-cyan-400 animate-pulse">Processing...</span>
              }
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              {progress.pct > 0 ? (
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progress.pct}%` }}
                />
              ) : (
                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 animate-pulse" style={{ width: '100%' }} />
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              {currentAgent && (
                <p className="text-xs text-cyan-400">Current: {currentAgent}</p>
              )}
              {currentPhase !== 'idle' && (
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Phase: {currentPhase}
                </p>
              )}
              {estimatedTimeRemaining > 0 && progress.completed > 0 && (
                <p className="text-xs text-gray-500">
                  ETA: ~{Math.round(estimatedTimeRemaining / 1000)}s
                </p>
              )}
            </div>
          </section>
        )}

        {/* Pipeline Nodes Summary */}
        {Object.keys(pipelineNodes).length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-l-2 border-violet-500 pl-2">Pipeline Nodes Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-2xl font-black text-emerald-400">
                  {Object.values(pipelineNodes).filter(n => n.status === 'completed').length}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 mt-1">Completed</p>
              </div>
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                <p className="text-2xl font-black text-violet-400">
                  {Object.values(pipelineNodes).filter(n => n.status === 'running').length}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-violet-400/70 mt-1">Running</p>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <p className="text-2xl font-black text-rose-400">
                  {Object.values(pipelineNodes).filter(n => n.status === 'error').length}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-rose-400/70 mt-1">Error</p>
              </div>
              <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-xl">
                <p className="text-2xl font-black text-gray-400">
                  {Object.values(pipelineNodes).filter(n => n.status === 'idle').length}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-400/70 mt-1">Pending</p>
              </div>
            </div>
          </section>
        )}

        {/* Execution Performance */}
        {Object.keys(completedAgents).length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 border-l-2 border-violet-500 pl-2">Execution Performance</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500">
                  {Object.keys(completedAgents).length} agents • {Object.values(completedAgents).reduce((acc, a) => acc + a.durationMs, 0).toLocaleString()}ms total
                </span>
              </div>
            </div>
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <div className="space-y-2">
                {Object.entries(completedAgents).map(([agentName, data], idx) => (
                  <div key={agentName} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500 w-6">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-gray-300">{agentName}</span>
                    </div>
                    <span className="text-gray-500">{data.durationMs}ms</span>
                    <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (data.durationMs / 5000) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Agent Details Panel */}
        {selectedAgent && agentDetails[selectedAgent] && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 border-l-2 border-cyan-500 pl-2">
                Agent Details: {selectedAgent}
              </h2>
              <button
                onClick={() => setSelectedAgent(undefined)}
                className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input */}
              {agentDetails[selectedAgent].input && (
                <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Input</p>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(agentDetails[selectedAgent].input, null, 2)}
                  </pre>
                </div>
              )}
              {/* Output */}
              {agentDetails[selectedAgent].output && (
                <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Output</p>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(agentDetails[selectedAgent].output, null, 2)}
                  </pre>
                </div>
              )}
              {/* Stage */}
              {agentDetails[selectedAgent].stage && (
                <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Stage</p>
                  <p className="text-sm text-cyan-400">{agentDetails[selectedAgent].stage}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Intermediate Outputs Panel */}
        {(intermediateOutputs.historical_outline || intermediateOutputs.storyboard || intermediateOutputs.final_prose) && (
          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-6 border-l-2 border-cyan-500 pl-2">Intermediate Outputs</h2>
            <IntermediateOutputsPanel
              historicalOutline={intermediateOutputs.historical_outline}
              storyboard={intermediateOutputs.storyboard}
              finalProse={intermediateOutputs.final_prose}
            />
          </section>
        )}

        {/* Real-time Weaving Terminal */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 border-l-2 border-violet-500 pl-2">Real-time Weaving Terminal (Centrifugo)</h2>
            <div className="flex items-center gap-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-gray-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Logs</option>
                <option value="agent">Agent</option>
                <option value="pipeline">Pipeline</option>
                <option value="error">Error</option>
                <option value="centrifugo">Centrifugo</option>
              </select>
            </div>
          </div>
          <div ref={terminalRef} className="bg-black border border-white/10 rounded-xl h-64 p-4 overflow-y-auto font-mono text-[11px] shadow-inner flex flex-col gap-0.5">
            {logs
              .filter((logLine) => {
                if (logFilter === 'all') return true;
                if (logFilter === 'agent') return logLine.includes('[Agent]');
                if (logFilter === 'pipeline') return logLine.includes('[Pipeline]');
                if (logFilter === 'error') return logLine.includes('[Error]');
                if (logFilter === 'centrifugo') return logLine.includes('[Centrifugo]');
                return true;
              })
              .map((logLine, i) => {
                let color = 'text-green-400';
                if (logLine.includes('[Centrifugo]')) color = 'text-cyan-500';
                else if (logLine.includes('[Error]')) color = 'text-rose-400';
                else if (logLine.includes('[Pipeline]')) color = 'text-violet-400';
                else if (logLine.includes('[Agent]')) color = 'text-emerald-400';
                else if (logLine.includes('[Weave]')) color = 'text-amber-400';
                return (
                  <p key={i} className={color}>
                    <span className="text-gray-600 mr-2 select-none">{String(i + 1).padStart(2, '0')}</span>
                    {logLine}
                  </p>
                );
              })}
            {data?.status === 'online' && (
              <p className="mt-2 text-violet-400/60">&gt; Loom Core v{data.version || '2.0.0'} — health ok</p>
            )}
          </div>
        </section>

        {/* Narrative Preview Panel */}
        {narrativeResult && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 border-l-2 border-emerald-500 pl-2">Last Narrative Output</h2>
              <button
                onClick={() => setNarrativeResult(null)}
                className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-wider transition-colors"
              >
                dismiss
              </button>
            </div>

            {/* Headline */}
            {narrativeResult.headline && (
              <div className="mb-4 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 mb-1">Headline</p>
                <p className="text-white font-bold text-lg leading-tight">{narrativeResult.headline}</p>
              </div>
            )}

            {/* Prose Preview */}
            {narrativeResult.prose && (
              <div className="p-5 bg-black/60 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Final Prose</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(narrativeResult.prose || '');
                        toast.success('Copied to clipboard');
                      }}
                      className="px-3 py-1.5 text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([narrativeResult.prose || ''], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `chronicle-${new Date().toISOString().slice(0,10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Exported to file');
                      }}
                      className="px-3 py-1.5 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 transition-colors"
                    >
                      Export
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed font-serif whitespace-pre-wrap">
                  {narrativeResult.prose}
                </p>
                <p className="text-[10px] text-gray-600 mt-3">
                  {narrativeResult.prose.length.toLocaleString()} characters
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
