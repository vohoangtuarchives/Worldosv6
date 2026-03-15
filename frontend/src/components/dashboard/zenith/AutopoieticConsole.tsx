"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Zap, RefreshCw } from 'lucide-react';

interface RuleMutation {
  id: string;
  ruleName: string;
  changeType: 'MUTATE' | 'INJECT' | 'OPTIMIZE' | 'FIX';
  timestamp: string;
  stability: number;
}

export const AutopoieticConsole: React.FC = () => {
  const [logs, setLogs] = useState<RuleMutation[]>([]);

  // Simulation of incoming rule mutations
  useEffect(() => {
    const mutations = [
      { ruleName: 'Entropy_Decay_Mod', type: 'MUTATE', stability: 0.94 },
      { ruleName: 'Causal_Anchor_V3', type: 'INJECT', stability: 0.88 },
      { ruleName: 'Resource_Diffusion_Opt', type: 'OPTIMIZE', stability: 0.99 },
      { ruleName: 'Anomaly_Boundary_Seal', type: 'FIX', stability: 0.92 },
    ];

    const interval = setInterval(() => {
      const source = mutations[Math.floor(Math.random() * mutations.length)];
      const newLog: RuleMutation = {
        id: Math.random().toString(36).substr(2, 9),
        ruleName: source.ruleName,
        changeType: source.type as any,
        timestamp: new Date().toLocaleTimeString(),
        stability: source.stability + (Math.random() * 0.1 - 0.05),
      };

      setLogs(prev => [newLog, ...prev].slice(0, 6));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2 text-blue-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Autopoietic Console</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-500/80">SOVEREIGN_MODE_ACTIVE</span>
          </div>
          <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin-slow" />
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      log.changeType === 'MUTATE' ? 'bg-purple-500/20 text-purple-400' :
                      log.changeType === 'INJECT' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.changeType}
                    </span>
                    <span className="text-white/80 font-medium">{log.ruleName}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Action: Adjusting wavefunction constants to prevent causal debt.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/30">{log.timestamp}</div>
                  <div className={`text-xs font-bold mt-1 ${log.stability > 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    S: {(log.stability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Decorative side line */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-500/30 group-hover:bg-blue-500 rounded-full transition-colors" />
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-4">
            <Shield className="w-12 h-12 opacity-10" />
            <span className="text-xs italic">Awaiting axiomatic drift events...</span>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
        <div className="text-[10px] text-white/40 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" /> 1.2k Mut/Tick
          </span>
          <span>Entropy Resist: 0.9992</span>
        </div>
        <div className="text-[10px] font-mono text-blue-500/50">
          WorldOS Protocol V1.0-V10.x
        </div>
      </div>
    </div>
  );
};
