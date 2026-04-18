'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Clock, CheckCircle, XCircle, Loader2, Copy, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getCentrifuge } from '@/lib/centrifugo';
import type { ConnectedContext, PublicationContext } from 'centrifuge';
import { useUniverse } from '@/contexts/UniverseContext';

interface PipelineNode {
  status: 'idle' | 'running' | 'completed' | 'error';
  startedAt?: number;
  completedAt?: number;
}

export default function ChronicleTab() {
  const { universes, activeUniverseId } = useUniverse();
  const currentUniverse = universes.find(u => u.id === activeUniverseId);
  const [isWeaving, setIsWeaving] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [pipelineNodes, setPipelineNodes] = useState<Record<string, PipelineNode>>({});
  const [completedAgents, setCompletedAgents] = useState<Record<string, { durationMs: number }>>({});
  const [narrativeResult, setNarrativeResult] = useState<{ headline?: string; prose?: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  useEffect(() => {
    if (!activeTaskId || !activeUniverseId) return;

    const centrifuge = getCentrifuge();
    const channelName = `narrative:${activeUniverseId}:${activeTaskId}`;
    
    const sub = centrifuge.newSubscription(channelName);
    
    sub.on('publication', (ctx: PublicationContext) => {
      const event = ctx.data;
      
      if (event.agent) {
        addLog(`[Agent] ${event.agent} ${event.stage || 'running'}`);
        
        if (event.stage === 'completed') {
          setPipelineNodes((prev) => ({
            ...prev,
            [event.agent]: { status: 'completed', completedAt: Date.now() }
          }));
          setCompletedAgents((prev) => ({
            ...prev,
            [event.agent]: { durationMs: event.duration_ms || 0 }
          }));
        } else if (event.stage === 'running') {
          setPipelineNodes((prev) => ({
            ...prev,
            [event.agent]: { status: 'running', startedAt: Date.now() }
          }));
        }
      }
      
      if (event.error) {
        addLog(`[Error] ${event.agent} failed: ${event.error}`);
        setPipelineNodes((prev) => ({
          ...prev,
          [event.agent]: { status: 'error' }
        }));
      }
      
      if (event.stage === 'complete') {
        addLog(`[Pipeline] Complete! Task ${activeTaskId} finished.`);
        setNarrativeResult({
          headline: event.news_headline,
          prose: event.final_prose
        });
        setIsWeaving(false);
        setActiveTaskId(null);
      }
    });

    sub.subscribe();
    
    return () => {
      sub.unsubscribe();
    };
  }, [activeTaskId, activeUniverseId, addLog]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startWeaving = async () => {
    if (!currentUniverse?.id) {
      toast.error('Please select a universe first');
      return;
    }

    setIsWeaving(true);
    setLogs([]);
    setPipelineNodes({});
    setCompletedAgents({});
    setNarrativeResult(null);

    try {
      const response = await api.post('/weave-chronicles', {
        world_id: activeUniverseId,
        world_era: 'genesis',
        tick_start: 1,
        tick_end: 100
      });

      const { task_id } = response.data;
      setActiveTaskId(task_id);
      addLog(`[Weave] Started task ${task_id}`);
      toast.success('Chronicle weaving started');
    } catch (error) {
      toast.error('Failed to start weaving');
      setIsWeaving(false);
    }
  };

  const stopWeaving = () => {
    setIsWeaving(false);
    setActiveTaskId(null);
    addLog('[Weave] Stopped by user');
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={isWeaving ? stopWeaving : startWeaving}
            disabled={!activeUniverseId}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isWeaving
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isWeaving ? (
              <>
                <Square className="w-4 h-4" />
                Stop Weaving
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Weaving
              </>
            )}
          </button>
          
          {isWeaving && (
            <div className="flex items-center gap-2 text-violet-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Task: {activeTaskId || 'None'}</span>
          <span>Agents: {Object.keys(completedAgents).length}</span>
        </div>
      </div>

      {/* Performance Stats */}
      {Object.keys(completedAgents).length > 0 && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-widest text-gray-500">Execution Performance</h3>
            <span className="text-[10px] text-gray-500">
              {Object.keys(completedAgents).length} agents • {Object.values(completedAgents).reduce((acc, a) => acc + a.durationMs, 0).toLocaleString()}ms total
            </span>
          </div>
          <div className="space-y-2">
            {Object.entries(completedAgents).map(([agentName, data], idx) => (
              <div key={agentName} className="flex items-center gap-3 text-xs">
                <span className="text-gray-500 w-6">{String(idx + 1).padStart(2, '0')}</span>
                <div className="flex-1 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
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
      )}

      {/* Real-time Logs */}
      <div className="p-4 bg-black border border-white/10 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Real-time Logs
          </h3>
          <button
            onClick={() => setLogs([])}
            className="text-[10px] text-gray-500 hover:text-gray-300"
          >
            Clear
          </button>
        </div>
        <div className="h-48 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.map((log, i) => (
            <p key={i} className="text-green-400/80">
              <span className="text-gray-600 mr-2">{String(i + 1).padStart(3, '0')}</span>
              {log}
            </p>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Output */}
      {narrativeResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-emerald-950/30 to-black/60 border border-emerald-500/20 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              Chronicle Complete
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(narrativeResult.prose || '');
                  toast.success('Copied to clipboard');
                }}
                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
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
                }}
                className="p-2 text-gray-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {narrativeResult.headline && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1">Headline</p>
              <p className="text-white font-semibold">{narrativeResult.headline}</p>
            </div>
          )}

          {narrativeResult.prose && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Final Prose</p>
              <p className="text-gray-300 text-sm leading-relaxed font-serif whitespace-pre-wrap">
                {narrativeResult.prose}
              </p>
              <p className="text-[10px] text-gray-600 mt-3">
                {narrativeResult.prose.length.toLocaleString()} characters
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
