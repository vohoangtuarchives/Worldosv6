'use client';

import React, { useState } from 'react';
import { useAiDiagnosticsMutation } from '../api';
import { ObserverPanel } from './ObserverPanel';
import { Terminal, Send, ShieldCheck, AlertCircle, Loader2, Cpu } from 'lucide-react';

/**
 * AiDiagnosticsLab: A playground to verify AI Driver connectivity and auth.
 */
export function AiDiagnosticsLab() {
  const [driver, setDriver] = useState('openrouter');
  const [prompt, setPrompt] = useState('Verify reality stabilization parameters.');
  const mutation = useAiDiagnosticsMutation();

  const handleRun = () => {
    mutation.mutate({ driver, prompt });
  };

  const response = mutation.data as any;

  return (
    <ObserverPanel eyebrow="Intelligence" title="AI Diagnostic Lab">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Driver Interface</label>
            <select 
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-background/40 px-4 py-2 text-sm text-white focus:border-primary/50 focus:outline-none transition"
            >
              <option value="openrouter">OpenRouter (Remote)</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="openai">OpenAI (Legacy)</option>
              <option value="mock">Simulated Driver</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
            <div className="flex h-[42px] items-center gap-3 rounded-xl border border-white/5 bg-background/20 px-4">
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : mutation.isSuccess ? (
                <ShieldCheck size={16} className="text-emerald-400" />
              ) : mutation.isError ? (
                <AlertCircle size={16} className="text-red-400" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-white/20" />
              )}
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {mutation.isPending ? 'PROCESSING' : mutation.isSuccess ? 'CONNECTED' : mutation.isError ? 'FAILED' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Probe (Prompt)</label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter diagnostic command..."
              className="h-24 w-full rounded-2xl border border-white/10 bg-background/40 p-4 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none transition resize-none"
            />
            <button
              onClick={handleRun}
              disabled={mutation.isPending}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition"
            >
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* Diagnostic Output */}
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 font-mono">
          <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
             <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Terminal size={12} />
                <span>Raw Intelligence Feed</span>
             </div>
             {response?.meta?.latency && (
               <span className="text-[10px] text-primary">{response.meta.latency}ms</span>
             )}
          </div>
          
          <div className="h-48 overflow-y-auto text-xs leading-relaxed text-emerald-400/90 custom-scrollbar">
            {mutation.isIdle && (
              <span className="text-white/20 italic">// Awaiting probe initialization...</span>
            )}
            {mutation.isPending && (
              <span className="animate-pulse">// Establishing neural link to {driver.toUpperCase()}...</span>
            )}
            {mutation.isError && (
              <span className="text-red-400">ERROR: Internal Neural Gateway Failure. Check logs.</span>
            )}
            {mutation.isSuccess && (
              <pre className="whitespace-pre-wrap">
                {typeof response?.data === 'string' ? response.data : JSON.stringify(response?.data ?? response, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-3">
           <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Cpu size={18} />
           </div>
           <div>
              <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Security Protocol</p>
              <p className="text-[10px] text-muted-foreground">All diagnostics are encrypted and audited via the Apex observer layer.</p>
           </div>
        </div>
      </div>
    </ObserverPanel>
  );
}
