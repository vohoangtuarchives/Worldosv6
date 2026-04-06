'use client';

import React, { useEffect, useState } from 'react';
import AgentNode from '@/components/ui/narrative/AgentNode';
import api from '@/lib/api';
import { Centrifuge } from 'centrifuge';

interface AgentConfig {
  id?: string;
  provider: string;
  model: string;
  role: string;
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

export default function NarrativeStudio() {
  const [data, setData] = useState<LoomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "System initialized.",
    "Awaiting chronicles and raw triggers from Core Simulation..."
  ]);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/loom-status');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch Narrative Loom status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Reduce polling to 30s only for health check
    
    // Khởi tạo Centrifugo WebSocket
    const centrifuge = new Centrifuge('ws://127.0.0.1:8000/connection/websocket', {
      // In production, we'd fetch a JWT token. Assuming insecure allows connection for dev:
    });

    centrifuge.on('connected', (ctx) => {
      setLogs(prev => [...prev, `[Centrifugo] Connected to socket. Node: ${ctx.client}`]);
    });

    const sub = centrifuge.newSubscription('universe.1.narrative');
    sub.on('publication', (ctx) => {
      const eventName = ctx.data.event || ctx.data.__type || 'Unknown Event';
      setLogs(prev => [...prev, `[Weaving Stream] ${eventName} detect! Payload: ${JSON.stringify(ctx.data)}`].slice(-20));
    });
    
    sub.subscribe();
    centrifuge.connect();

    return () => {
      clearInterval(interval);
      centrifuge.disconnect();
    };
  }, []);

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
          </div>
        </header>

        {/* System Overview */}
        <section className="mb-12">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-l-2 border-violet-500 pl-2">AI Providers Network</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data?.providers && (Array.isArray(data.providers) ? data.providers : Object.entries(data.providers).map(([key, info]) => ({ id: key, ...info }))).map((info: ProviderConfig, idx: number) => {
              const keyName = info.id || info.name || `provider-${idx}`;
              return (
              <div key={keyName} className="p-3 border border-white/5 bg-white/5 rounded-lg flex items-center justify-between">
                <span className="text-xs font-bold uppercase">{keyName}</span>
                <div className={`w-2 h-2 rounded-full ${info.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
              </div>
            )})}
          </div>
        </section>

        {/* Agents Topography */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-6 border-l-2 border-violet-500 pl-2">Loom Agents Topography</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Draw imaginary connection strings later using SVG if needed */}
            {data?.agents ? (Array.isArray(data.agents) ? data.agents : Object.entries(data.agents).map(([id, config]) => ({ id, ...config }))).map((config: AgentConfig, idx: number) => {
              const agentId = config.id || `agent-${idx}`;
              return (
              <AgentNode 
                key={agentId} 
                id={agentId} 
                provider={config.provider} 
                model={config.model} 
                role={config.role}
                isActive={data?.status === 'online'} 
              />
            )}) : (
               <div className="col-span-full h-32 flex items-center justify-center border border-dashed border-gray-800 rounded-xl">
                 <span className="text-gray-600 uppercase text-xs tracking-widest">No Active Nodes Detected.</span>
               </div>
            )}
          </div>
        </section>

        {/* Experimental Event Weaver Terminal */}
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-l-2 border-violet-500 pl-2">Real-time Weaving Terminal (Centrifugo)</h2>
          <div className="bg-black border border-white/10 rounded-xl h-64 p-4 overflow-y-auto font-mono text-[11px] shadow-inner text-green-400/80 flex flex-col gap-1">
            {logs.map((log, i) => (
              <p key={i} className={log.includes('[Centrifugo]') ? 'text-cyan-500' : 'text-green-400'}>{log}</p>
            ))}
            {data?.status === 'online' && (
              <p className="mt-2 text-violet-400">&gt; Polling Pulse: Connected to Loom Core v{data.version || '1.0.0'}. Health Ok.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
