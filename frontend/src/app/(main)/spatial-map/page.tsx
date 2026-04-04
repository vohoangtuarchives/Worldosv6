"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import api from "@/lib/api";

// --- Mock Metadata for Terminal ---
const MOCK_ZONES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Sector-${(i + 1).toString().padStart(3, '0')}`,
  entropy: 0.1245 + Math.random() * 0.5,
  stability: 0.8921 - Math.random() * 0.2,
  stress: 0.05 + Math.random() * 0.4,
  population: Math.floor(Math.random() * 10000),
  active_events: Math.random() > 0.7 ? ["Conflict", "Resource Scarcity"] : [],
}));

const MOCK_ENTITIES = [
  { id: 1, name: "Thales Citadel", type: "Celebrity_Home", status: "Active", logs: "Thinking deeply..." },
  { id: 2, name: "Rosetta Site B", type: "Artifact_Cache", status: "Dormant", logs: "Knowledge encoding pulse detected." },
  { id: 3, name: "Singularity Core", type: "Anomaly", status: "Critical", logs: "Reality strain extreme." }
];

export default function DataObserverTerminal() {
  const [universeData, setUniverseData] = useState({
    tick: 1420,
    entropy: 4.2561,
    stability: 0.7621,
    causal_pressure: 1.25,
  });
  
  const [zones, setZones] = useState(MOCK_ZONES);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    "[14:20:01] System Pulse Initialized.",
    "[14:20:05] Sector-003: Detected Material Stress Spike (0.42)",
    "[14:20:10] Anomaly 'Singularity Core' emitted Gamma Burst.",
  ]);

  const [selectedActorIntent, setSelectedActorIntent] = useState<string | null>(null);

  // Simulated Real-time Data Flux
  useEffect(() => {
    const interval = setInterval(() => {
      setUniverseData(prev => ({
        ...prev,
        tick: prev.tick + 1,
        entropy: prev.entropy + (Math.random() - 0.4) * 0.01,
        stability: Math.max(0, prev.stability + (Math.random() - 0.5) * 0.005),
      }));

      setZones(currentZones => 
        currentZones.map(z => ({
          ...z,
          entropy: Math.min(1, z.entropy + (Math.random() - 0.4) * 0.02),
          stress: Math.min(1, z.stress + (Math.random() - 0.5) * 0.01),
        }))
      );

      if (Math.random() > 0.8) {
          const newLog = `[${new Date().toLocaleTimeString()}] Zone-${Math.floor(Math.random() * 12 + 1)}: State update detected (Delta: ${(Math.random() * 0.1).toFixed(4)})`;
          setLiveLogs(prev => [newLog, ...prev.slice(0, 19)]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchActorIntent = async (id: number) => {
    try {
        const res = await api.post(`/worldos/actors/${id}/mind-meld`);
        const intent = res.data.action || "No intent detected.";
        setLiveLogs(prev => [`[INTENT INTERCEPT] Entity-${id}: ${intent}`, ...prev.slice(0, 19)]);
    } catch (e) {
        setLiveLogs(prev => [`[ERROR] Failed to intercept Entity-${id} neural link.`, ...prev.slice(0, 19)]);
    }
  };

  const forkReality = async () => {
    try {
        await api.post(`/worldos/universes/1/fork`);
        setLiveLogs(prev => [`[CRITICAL] Multiverse Branch Created at Tick ${universeData.tick}`, ...prev.slice(0, 19)]);
    } catch (e) {}
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#050505] text-[#00ff41] font-mono p-4 gap-4 overflow-hidden select-none">
      
      {/* Sidebar: Global Metrics */}
      <div className="w-80 border-r border-[#00ff41]/20 pr-4 flex flex-col gap-6">
        <div className="border border-[#00ff41]/40 p-4 bg-[#0a0a0a]">
          <h1 className="text-xl font-bold tracking-tighter border-b border-[#00ff41]/20 pb-2 mb-4 animate-pulse">
            TERMINAL OBSERVER V2.1
          </h1>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between">
              <span className="opacity-60">SIMULATION TICK</span>
              <span className="font-bold">{universeData.tick.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">GLOBAL ENTROPY</span>
              <span className={universeData.entropy > 8 ? "text-red-500" : ""}>
                {universeData.entropy.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">STABILITY INDEX</span>
              <span>{(universeData.stability * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">CAUSAL PRESSURE</span>
              <span>{universeData.causal_pressure.toFixed(2)} psi</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
            <h2 className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-2">Causal Commands</h2>
            <button 
                onClick={forkReality}
                className="w-full py-2 bg-[#00ff41]/5 border border-[#00ff41]/30 hover:bg-[#00ff41]/20 transition-all text-xs font-bold"
            >
                EXECUTE REALITY FORK ⑂
            </button>
            <div className="mt-4">
                <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-2 mb-2">Neural Targets</h3>
                <div className="space-y-1">
                    {MOCK_ENTITIES.map(ent => (
                        <div 
                            key={ent.id}
                            onClick={() => fetchActorIntent(ent.id)}
                            className="p-2 border border-[#00ff41]/10 hover:bg-[#00ff41]/5 cursor-pointer text-[10px] flex justify-between group"
                        >
                            <span>{ent.name}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-white">[Intercept]</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Main Grid: Zone Matrix */}
      <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 grid grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">
              {zones.map(z => (
                  <div key={z.id} className="border border-[#00ff41]/10 p-3 bg-[#080808] hover:border-[#00ff41]/40 transition-colors">
                      <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-bold">{z.name}</span>
                          <span className="text-[8px] opacity-40 font-mono">#{z.id.toString().padStart(3, '0')}</span>
                      </div>
                      <div className="space-y-1 text-[9px] font-mono">
                          <div className="flex justify-between">
                              <span className="opacity-50">ENTROPY</span>
                              <span className={z.entropy > 0.8 ? "text-red-400" : ""}>{z.entropy.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="opacity-50">STABILITY</span>
                              <span>{z.stability.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="opacity-50">STRESS</span>
                              <span>{z.stress.toFixed(4)}</span>
                          </div>
                          <div className="h-0.5 w-full bg-[#00ff41]/5 mt-2">
                              <motion.div 
                                className="h-full bg-[#00ff41]" 
                                initial={false} 
                                animate={{ width: `${z.entropy * 100}%` }}
                                transition={{ duration: 0.8 }}
                              />
                          </div>
                          {z.active_events.length > 0 && (
                              <div className="mt-2 text-[8px] text-red-400 flex flex-wrap gap-1">
                                  {z.active_events.map(ev => (
                                      <span key={ev} className="px-1 border border-red-500/20 bg-red-500/5">{ev}</span>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>

          {/* Bottom: Live Feed */}
          <div className="h-48 border-t border-[#00ff41]/20 pt-4 flex flex-col flex-shrink-0">
                <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2">Live Neural & Causal Stream</h3>
                <div className="flex-1 bg-black/40 border border-[#00ff41]/5 p-3 overflow-y-auto text-[10px] leading-relaxed space-y-1">
                    <AnimatePresence initial={false}>
                        {liveLogs.map((log, i) => (
                            <motion.div
                                key={`${log}-${i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1 - (i * 0.05), x: 0 }}
                                className={log.includes('[ERROR]') ? 'text-red-500' : log.includes('[CRITICAL]') ? 'text-violet-400 font-bold' : ''}
                            >
                                <span className="opacity-40 mr-2">»</span>
                                {log}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
          </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 255, 65, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 65, 0.4);
        }
      `}</style>
    </div>
  );
}
