'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Activity, Shield, Info } from 'lucide-react';
import type { ActorDetail } from '@/modules/observer/types';

interface ActorDeepDiveSidebarProps {
  actor: ActorDetail | null;
  onClose: () => void;
}

const ActorDeepDiveSidebar = ({ actor, onClose }: ActorDeepDiveSidebarProps) => {
  if (!actor) return null;

  // Derive Aura properties from actor metrics (or defaults)
  const complexity = (actor.influence / 100) || 0.4;
  const entropy = (actor.metrics?.entropy as number) || 0.3;
  
  // Aura color: Scale from blue (stable) to purple/red (complex/chaotic)
  const auraColor = entropy > 0.7 ? '#f43f5e' : complexity > 0.6 ? '#a855f7' : '#0ea5e9';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end pointer-events-none">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-void/40 backdrop-blur-sm pointer-events-auto"
        />
        
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-screen bg-void/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl pointer-events-auto overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between p-6 bg-void/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Brain size={18} />
               </div>
               <h2 className="text-sm font-bold uppercase tracking-widest text-white">Entity Deep Dive</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Mind-state Aura Visualization */}
            <div className="relative flex flex-col items-center justify-center py-10">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: auraColor }}
              />
              
              <div className="relative w-32 h-32 rounded-[2rem] bg-void border border-white/10 flex items-center justify-center overflow-hidden glow-primary">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                 <Brain size={48} className="text-primary relative z-10" />
                 
                 {/* Aura Rings */}
                 <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute inset-0 border border-dashed border-primary/20 rounded-full scale-150"
                 />
              </div>

              <div className="mt-6 text-center">
                 <h3 className="text-2xl font-bold text-white">{actor.name}</h3>
                 <p className="text-primary text-sm font-mono uppercase tracking-widest">{actor.role}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                     <Zap size={14} />
                     <span className="text-[10px] uppercase tracking-wider">Influence</span>
                  </div>
                  <p className="text-xl font-mono text-white">{actor.influence.toFixed(1)}</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                     <Activity size={14} />
                     <span className="text-[10px] uppercase tracking-wider">Complexity</span>
                  </div>
                  <p className="text-xl font-mono text-white">{(complexity * 100).toFixed(0)}%</p>
               </div>
            </div>

            {/* Biography & Traits */}
            <div className="space-y-4">
               <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Info size={14} /> Narrative Profile
               </h4>
               <p className="text-sm leading-relaxed text-muted-foreground">
                  {actor.biography || "This entity has not yet manifested a significant narrative biography in the current causal flow."}
               </p>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Shield size={14} /> Alignment & Stance
               </h4>
               <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-white font-medium">{actor.alignment}</p>
               </div>
            </div>

            <div className="pt-6 border-t border-white/5">
                <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all">
                   Focus Observer Lens
                </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};

export default ActorDeepDiveSidebar;
