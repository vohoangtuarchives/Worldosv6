'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useObserverOmenContext } from '@/modules/observer/api';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { Sparkles, Brain, History, User, Zap, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function OmenLabPage({ params }: { params: { universeId: string } }) {
  const { universeId } = params;
  const contextQuery = useObserverOmenContext(universeId);
  const [isWeaving, setIsWeaving] = useState(false);
  const [omenResult, setOmenResult] = useState<{ type: string; description: string; sci_modifier: number; entropy_modifier: number } | null>(null);

  const weaveOmen = async () => {
    setIsWeaving(true);
    // Simulation: In a real scenario, this would call an AI action that uses the context
    setTimeout(() => {
      setOmenResult({
        type: "Void Resonance",
        description: "Một luồng năng lượng hư không lan tỏa, làm nhiễu loạn các quy luật vật lý cơ bản.",
        sci_modifier: -0.15,
        entropy_modifier: 0.25
      });
      setIsWeaving(false);
      toast.success("Omen woven successfully", {
          icon: <Sparkles className="text-primary" size={14} />
      });
    }, 2000);
  };

  if (contextQuery.isLoading) return <ObserverLoadingState lines={10} />;
  if (contextQuery.isError) return <ObserverErrorState 
    title="Narrative Intelligence Offline" 
    description="Could not establish connection to the Loom of Lore context engine." 
    onRetry={() => contextQuery.refetch()}
  />;

  const context = contextQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Omen Weaver Lab</h1>
        <p className="text-muted-foreground">Weave reality-altering events based on the current causal state.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ObserverPanel eyebrow="Input" title="Causal Context">
             <div className="space-y-6">
                <div>
                   <h4 className="text-xs uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                      <Brain size={14} /> Intelligence Metrics
                   </h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                         <p className="text-[10px] text-muted-foreground uppercase">Entropy</p>
                         <p className="text-xl font-mono text-white">{(context?.metrics.entropy ?? 0).toFixed(4)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                         <p className="text-[10px] text-muted-foreground uppercase">Stability</p>
                         <p className="text-xl font-mono text-white">{(context?.metrics.stability ?? 0).toFixed(4)}</p>
                       </div>
                   </div>
                </div>

                <div>
                   <h4 className="text-xs uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                      <User size={14} /> Key Actors
                   </h4>
                   <div className="space-y-2">
                      {context?.top_actors.slice(0, 3).map(actor => (
                        <div key={actor.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                           <span className="text-sm font-medium text-white">{actor.name}</span>
                           <span className="text-[10px] font-mono p-1 rounded bg-primary/20 text-primary uppercase">
                              {actor.archetype}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h4 className="text-xs uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                      <History size={14} /> Recent Chronicles
                   </h4>
                   <div className="space-y-3">
                      {context?.recent_history.slice(0, 2).map((c: { summary: string }, idx: number) => (
                        <div key={idx} className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">
                           &quot;{c.summary}&quot;
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </ObserverPanel>

          <button
            onClick={weaveOmen}
            disabled={isWeaving}
            className={`
              w-full py-4 rounded-[24px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all
              ${isWeaving ? 'bg-primary/50 cursor-wait' : 'bg-primary hover:bg-primary/80 glow-primary'}
            `}
          >
            {isWeaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles size={20} />
              </motion.div>
            ) : <Sparkles size={20} />}
            {isWeaving ? "Weaving Reality..." : "Weave Omen"}
          </button>
        </div>

        <div className="space-y-6">
           <ObserverPanel eyebrow="Output" title="Manifested Omen">
              {omenResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                   <div className="p-6 rounded-[32px] bg-primary/10 border border-primary/30 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                         <Zap size={64} className="text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-primary mb-2">{omenResult.type}</h3>
                      <p className="text-lg text-white leading-relaxed">{omenResult.description}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                         <p className="text-xs text-muted-foreground uppercase mb-1">SCI Impact</p>
                         <p className={`text-xl font-mono ${omenResult.sci_modifier >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {omenResult.sci_modifier >= 0 ? '+' : ''}{omenResult.sci_modifier.toFixed(2)}
                         </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                         <p className="text-xs text-muted-foreground uppercase mb-1">Entropy delta</p>
                         <p className={`text-xl font-mono ${omenResult.entropy_modifier >= 0 ? 'text-purple-400' : 'text-green-400'}`}>
                            {omenResult.entropy_modifier >= 0 ? '+' : ''}{omenResult.entropy_modifier.toFixed(2)}
                         </p>
                      </div>
                   </div>

                   <button className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 transition-all">
                      <Send size={18} /> Inject into Simulation
                   </button>
                </motion.div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                   <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                      <Sparkles size={32} className="text-muted-foreground" />
                   </div>
                   <p className="text-sm max-w-[200px]">Perform a causal weave to manifest a potential Omen.</p>
                </div>
              )}
           </ObserverPanel>
        </div>
      </div>
    </div>
  );
}
