'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Atom, 
  Users, 
  ScrollText, 
  Globe, 
  Zap, 
  Database,
  Layers,
  ChevronRight
} from 'lucide-react';

// Custom Minimal UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "", variant = "outline" }: { children: React.ReactNode, className?: string, variant?: string }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${variant === 'outline' ? 'border border-white/20 text-white/70' : 'bg-primary/20 text-primary border border-primary/30'} ${className}`}>
    {children}
  </span>
);

const Progress = ({ value, className = "" }: { value: number, className?: string }) => (
  <div className={`h-1 w-full bg-white/10 rounded-full overflow-hidden ${className}`}>
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      className="h-full bg-blue-500"
    />
  </div>
);

interface RealityState {
  universe_id: number;
  tick: number;
  layers: {
    physical: any;
    life: any;
    social: any;
    narrative: any;
  };
  materials: any[];
  civilization: {
    complexity: number;
    knowledge_nodes: number;
    settlements: any[];
  };
}

export default function UniverseRealityStateClient({ 
  universeId 
}: { 
  universeId: string 
}) {
  const [state, setState] = useState<RealityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'physical' | 'social' | 'narrative'>('physical');

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/worldos/universes/${universeId}/reality-state`);
        const data = await res.json();
        setState(data);
      } catch (err) {
        console.error('Failed to fetch reality state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [universeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Atom className="w-12 h-12 text-blue-500 opacity-50" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Trạm Nghiên Cứu Thực Tại
          </h1>
          <p className="text-muted-foreground italic">
            "Bóc tách các lớp hiện hữu của vũ trụ số #{universeId}"
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 border-blue-500/30 bg-blue-500/10">
            Tick: {state?.tick}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 border-purple-500/30 bg-purple-500/10">
            Complexity: {state?.civilization.complexity.toFixed(2)}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reality Layers Map */}
        <Card className="lg:col-span-2 border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden group">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 text-lg font-bold">
            <Layers className="w-5 h-5 text-blue-400" />
            Sơ Đồ Các Lớp Thực Tại (Multiverse Topology)
          </div>
          <div className="p-0 relative h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[80%] border border-blue-500/10 rounded-full animate-pulse" />
              <div className="absolute w-[60%] h-[60%] border border-purple-500/10 rounded-full animate-pulse delay-700" />
            </div>

            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-8">
              {['narrative', 'social', 'physical'].map((layer) => (
                <motion.button
                  key={layer}
                  onClick={() => setActiveLayer(layer as any)}
                  whileHover={{ scale: 1.05, x: 10 }}
                  className={`relative w-full max-w-md p-4 rounded-xl border transition-all duration-300 ${
                    activeLayer === layer 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        layer === 'physical' ? 'bg-emerald-500/20 text-emerald-400' :
                        layer === 'social' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {layer === 'physical' ? <Globe className="w-5 h-5" /> :
                         layer === 'social' ? <Users className="w-5 h-5" /> :
                         <ScrollText className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <div className="font-bold capitalize text-white">{layer} Layer</div>
                        <div className="text-xs text-muted-foreground">
                          {layer === 'physical' ? 'Geography, Resources, Entropy' :
                           layer === 'social' ? 'Institutions, Population, Culture' :
                           'History, Ideology, Myths'}
                        </div>
                      </div>
                    </div>
                    {activeLayer === layer && (
                      <motion.div layoutId="active-indicator">
                        <ChevronRight className="w-5 h-5 text-blue-400" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </Card>

        {/* Civilization Metrics */}
        <div className="space-y-6">
          <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="p-4 flex items-center gap-2 text-md font-bold">
              <Zap className="w-4 h-4 text-yellow-400" />
              Civilization Pulse
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Complexity Score</span>
                  <span className="text-blue-400 font-mono">{(state?.civilization.complexity || 0).toFixed(2)}</span>
                </div>
                <Progress value={Math.min(100, (state?.civilization.complexity || 0) * 10)} className="h-1 bg-white/5" />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Knowledge Nodes</span>
                <Badge variant="secondary" className="font-mono text-white">{state?.civilization.knowledge_nodes}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Active Settlements</span>
                <Badge variant="secondary" className="font-mono text-white">{state?.civilization.settlements.length}</Badge>
              </div>
            </div>
          </Card>

          <Card className="border-white/5 bg-black/40 backdrop-blur-xl flex-1">
            <div className="p-4 flex items-center gap-2 text-md font-bold">
              <Database className="w-4 h-4 text-emerald-400" />
              Ontological Materials
            </div>
            <div className="p-0 max-h-[220px] overflow-y-auto">
              <div className="divide-y divide-white/5">
                {state?.materials.map((cat: any) => (
                  <div key={cat.ontology} className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
                      <span>{cat.ontology}</span>
                      <span>{cat.count} items</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.items.slice(0, 4).map((item: any) => (
                        <div key={item.id} className="text-xs p-2 bg-white/5 rounded border border-white/5 flex flex-col gap-1">
                          <span className="font-medium truncate text-white">{item.name}</span>
                          <span className="text-blue-400/70 font-mono text-[10px]">Val: {item.current_value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Layer Detail View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLayer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="p-4 flex flex-row items-center justify-between border-b border-white/5">
              <div className="text-lg font-bold flex items-center gap-2 capitalize text-white">
                {activeLayer === 'physical' ? <Globe className="w-5 h-5" /> :
                 activeLayer === 'social' ? <Users className="w-5 h-5" /> :
                 <ScrollText className="w-5 h-5" />}
                {activeLayer} Layer Analysis
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30">
                AI Deep-Scan Active
              </Badge>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(Object.entries(state?.layers[activeLayer] || {})).map(([key, value]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">{key}</div>
                    <div className="text-2xl font-mono text-white/90">
                      {typeof value === 'number' ? value.toFixed(3) : 
                       Array.isArray(value) ? `${value.length} nodes` : 
                       'STABLE'}
                    </div>
                  </div>
                ))}
                {activeLayer === 'social' && (
                  <div className="lg:col-span-4 mt-6">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-white">
                      <Users className="w-4 h-4" /> Civilizational Settlements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {state?.civilization.settlements.map((s: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white">{s.name || `Khu định cư #${i+1}`}</span>
                            <Badge variant="outline" className="text-[10px] text-white">Pop: {s.population || 0}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground italic mb-3">"{s.founder || 'System Spawned'}"</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${(s.stability || 0.5) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-white">{(s.stability || 0.5).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
