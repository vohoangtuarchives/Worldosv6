'use client';

import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useRealtime } from '@/hooks/useRealtime';
import ManifoldViz from '@/components/ManifoldViz';
import LayerStackObserver from '@/components/LayerStackObserver';
import AxiomFluxMonitor from '@/components/AxiomFluxMonitor';
import ChronicleStream from '@/components/ChronicleStream';
import SimulationControls from '@/components/SimulationControls';
import CausalGraph from '@/components/CausalGraph';
import EntityFluxMap from '@/components/EntityFluxMap';
import ObserverDials from '@/components/ObserverDials';
import AncientLivingMap from '@/components/AncientLivingMap';
import NarrativeArchive from '@/components/NarrativeArchive';
import TimelineSplitter from '@/components/TimelineSplitter';
import AxiomResonance from '@/components/AxiomResonance';
import { RealityFilterProvider } from '@/components/RealityFilter';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  useRealtime();
  const { currentTick, universes, chronicles } = useSimulationStore();

  return (
    <RealityFilterProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col p-6 space-y-6 relative overflow-hidden">
        {/* Background Systems */}
        <AxiomResonance />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-starfield opacity-[0.05] pointer-events-none bg-starfield-drift-slow z-10" />
        
        {/* Header Stat Bar */}
        <header className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[var(--radius)] bg-card/40 border border-border/50 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-left-brain to-cosmos glow-cosmos" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Observer Hub</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Multiverse Surveillance</p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
             <SimulationControls />
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Current Tick</span>
              <span className="text-2xl font-bold text-primary tabular-nums">{currentTick.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Entropy</span>
              <span className="text-2xl font-bold text-cosmos tabular-nums">0.0342</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Stability</span>
              <span className="text-2xl font-bold text-right-brain tabular-nums">92.4%</span>
            </div>
          </div>
        </header>

        {/* Main Grid Interface */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 auto-rows-min gap-6 relative z-20">
          
          {/* Row 1: Topology & Flux */}
          <section className="lg:col-span-8 h-[500px]">
            <ManifoldViz />
          </section>

          <section className="lg:col-span-4 h-[500px]">
            <AxiomFluxMonitor />
          </section>

          {/* Row 2: Multiverse Divergence (New) */}
          <section className="lg:col-span-12 h-[200px]">
             <TimelineSplitter />
          </section>

          {/* Row 3: Causal Intelligence & Ancient Mapping */}
          <section className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[400px]">
            <div className="lg:col-span-8">
              <CausalGraph chronicles={chronicles} />
            </div>
            <div className="lg:col-span-4">
              <AncientLivingMap />
            </div>
          </section>

          {/* Row 4: Layer Stack, Entity Map, and Intervention */}
          <section className="lg:col-span-4 h-[400px]">
            <LayerStackObserver />
          </section>

          <section className="lg:col-span-4 h-[400px] flex flex-col gap-6">
            <div className="flex-1">
              <EntityFluxMap />
            </div>
            <div className="h-[120px]">
              <div className="h-full bg-void/40 backdrop-blur-md rounded-[var(--radius)] border border-white/5 p-4 flex flex-col justify-center">
                <span className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Reality Convergence</span>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cosmos"
                    animate={{ width: ['40%', '85%', '60%'] }}
                    transition={{ duration: 10, repeat: Infinity }}
                  />
                </div>
                <span className="text-[10px] text-cosmos mt-2 font-mono">STABLE_FLOW // 0.82β</span>
              </div>
            </div>
          </section>

          <section className="lg:col-span-4 h-[400px] flex flex-col gap-6">
            <div className="flex-1">
              <ObserverDials />
            </div>
            <div className="flex-1 overflow-hidden">
               <NarrativeArchive />
            </div>
          </section>

        </main>

        <footer className="text-[10px] text-muted-foreground font-mono flex items-center justify-between opacity-50 relative z-20">
          <span>WorldOS Kernel 6.2.0-STABLE</span>
          <span>Observation Active // Port 8000</span>
        </footer>
      </div>
    </RealityFilterProvider>
  );
};


export default DashboardPage;
