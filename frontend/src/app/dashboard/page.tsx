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
import TransitionTimeline from '@/components/TransitionTimeline';
import RiskPredictor from '@/components/RiskPredictor';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  useRealtime();
  const { 
    currentTick, 
    universes, 
    chronicles, 
    transition, 
    realityStrain, 
    anomalyProbability,
    civilizationEra
  } = useSimulationStore();

  const normalizedEraClass = civilizationEra?.toLowerCase().replace(' ', '-') || 'genesis';
  const eraClass = `era-${normalizedEraClass}`;

  return (
    <div className="relative w-full h-full">
      <div className="p-6 space-y-6 w-full relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        

        {/* Main Grid Interface */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 auto-rows-min gap-6 relative z-20">
          
          {/* Row 1: Topology & Flux */}
          <section className="lg:col-span-8 h-[500px]">
            <ManifoldViz />
          </section>

          <section className="lg:col-span-4 h-[500px]">
            <AxiomFluxMonitor />
          </section>

          {/* Row 2: Multiverse Divergence */}
          <section className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[200px]">
             <div className="lg:col-span-8">
               <TimelineSplitter />
             </div>
             <div className="lg:col-span-4">
               {transition ? (
                 <TransitionTimeline 
                   phase={transition.phase} 
                   target={transition.target} 
                   startTick={transition.startTick}
                   currentTick={currentTick}
                 />
               ) : (
                 <div className="h-full bg-void/20 border border-white/5 rounded-[var(--radius)] flex flex-col items-center justify-center opacity-40">
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Causal Stability</span>
                   <span className="text-[9px] font-mono">NO_ACTIVE_REBINDING</span>
                 </div>
               )}
             </div>
          </section>

          {/* Row 3: Causal Intelligence & Ancient Mapping */}
          <section className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
            <div className="lg:col-span-8">
              <AncientLivingMap />
            </div>
            <div className="lg:col-span-4">
              <CausalGraph chronicles={chronicles} />
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
              <RiskPredictor strain={realityStrain} anomalyProbability={anomalyProbability} />
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
      </div>
    </div>
  );
};


export default DashboardPage;
