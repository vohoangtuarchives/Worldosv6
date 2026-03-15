"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TerminalHorizonGauge } from './TerminalHorizonGauge';
import { AutopoieticConsole } from './AutopoieticConsole';
import { GreatFilterRadar } from './GreatFilterRadar';
import { CausalTopologyGraph } from './CausalTopologyGraph';
import { ConsciousnessHeatmap } from './ConsciousnessHeatmap';
import { ApexControlPanel } from '../ApexControlPanel';
import { Eye, ShieldAlert, Cpu, Activity, Share2, Brain, Shield } from 'lucide-react';

export const ApexObserverTab: React.FC<{ universeId: number }> = ({ universeId }) => {
  return (
    <div className="flex flex-col gap-10 p-6 bg-transparent overflow-visible">
      {/* HUD Header Section: Terminal Indicators */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-1 min-w-[280px]">
          <TerminalHorizonGauge 
            infoDensity={0.68} 
            entropy={0.42} 
            singularityProgress={0.15} 
          />
        </div>
        
        <div className="flex-1 min-w-[280px] p-6 bg-blue-500/[0.03] backdrop-blur-3xl border border-blue-500/10 rounded-[2rem] relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-all duration-700">
            <Activity className="w-20 h-20 text-blue-400" />
          </div>
          <h4 className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Stability Engine
          </h4>
          <div className="text-4xl font-light text-white mb-2 tracking-tighter">0.9994</div>
          <p className="text-[10px] text-blue-300/40 leading-relaxed max-w-[200px]">High stability achieved via the Singularity Stability Engine.</p>
          <div className="mt-6 flex items-center gap-2 text-[8px] font-mono text-blue-400/40 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>ZENITH_OMEGA_ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Feature: Causal Topology (V8) - Spaced out and large */}
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between px-2">
           <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
             <Share2 className="w-3.5 h-3.5 text-fuchsia-500" /> Causal Topology (V8)
           </h3>
           <span className="text-[9px] font-mono text-fuchsia-400/40">QUANTUM BRIDGES ACTIVE</span>
        </div>
        <CausalTopologyGraph universeId={universeId} />
      </div>

      {/* Meso Layer: Great Filters (V9) & Consciousness (V10) */}
      <div className="flex flex-wrap gap-8 items-stretch">
        <div className="flex-1 min-w-[320px]">
          <div className="mb-4 px-2">
             <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
               <Shield className="w-3.5 h-3.5 text-emerald-500" /> Ascension Filters (V9)
             </h3>
          </div>
          <GreatFilterRadar universeId={universeId} />
        </div>
        
        <div className="flex-1 min-w-[320px]">
           <div className="mb-4 px-2">
             <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
               <Brain className="w-3.5 h-3.5 text-amber-500" /> Resonance Field (V10)
             </h3>
          </div>
          <ConsciousnessHeatmap universeId={universeId} />
        </div>
      </div>

      {/* Logic & Compute Layer */}
      <div className="flex flex-wrap gap-6 items-stretch pt-8 border-t border-white/5">
        <div className="flex-1 min-w-[380px]">
          <AutopoieticConsole />
        </div>

        <div className="flex-1 min-w-[300px] p-6 bg-card/20 backdrop-blur-2xl border border-white/5 rounded-[2rem] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Compute Manifold</h4>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] text-purple-300/40 uppercase font-bold tracking-widest">
                <span>Dyson Swarm Load</span>
                <span>42.1%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: '42.1%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="p-4 border border-blue-500/10 rounded-xl bg-blue-500/[0.02] flex flex-col items-center">
               <Eye className="w-8 h-8 text-blue-500/40 animate-pulse mb-2" />
               <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em]">Omniscient Mode</span>
               <span className="text-[7px] text-white/10 mt-1 font-mono uppercase">APEX-SERAPH-CODE-01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Apex Override Controller - Global Bottom Positioning */}
      <div className="pt-8">
        <ApexControlPanel universeId={universeId} />
      </div>
    </div>
  );
};
