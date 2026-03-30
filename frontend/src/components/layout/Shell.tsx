'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AxiomResonance from '@/components/AxiomResonance';
import MultiverseTicker from '@/components/media/MultiverseTicker';
import VFXOverlay from '@/components/media/VFXOverlay';
import MediaStationPanel from '@/components/media/MediaStationPanel';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useObserverUniverseSummaries } from '@/modules/observer/api';

const Shell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: universes } = useObserverUniverseSummaries();
  const { selectedNarrative, setSelectedNarrative } = useSimulationStore();
  
  // Decide if we need a footer (usually yes, except for immersive simulation views)
  const showFooter = !pathname.includes('/reality');

  return (
    <div className="min-h-screen relative flex bg-slate-50 text-slate-900 font-body selection:bg-primary/10 selection:text-primary transition-colors duration-700">
      <VFXOverlay />

      <AnimatePresence>
        {selectedNarrative && (
          <MediaStationPanel 
            activeNarrative={selectedNarrative} 
            universes={(universes ?? []).map(u => ({ id: Number(u.id), name: u.name }))}
            onClose={() => setSelectedNarrative(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Background Layer: Resonance & Grid */}
      <AxiomResonance />
      
      {/* Structural Components */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10 transition-all duration-300 ml-[78px]">
        <Navbar />
        
        <main className="flex-1 mt-16 p-6 lg:p-8 transition-all duration-300">
          {children}
        </main>

        <MultiverseTicker />

        {showFooter && (
          <footer className="px-8 py-6 flex items-center justify-between border-t border-slate-100/50 bg-white/30 backdrop-blur-sm text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] relative z-20">
            <div className="flex items-center gap-6">
              <span>WorldOS Kernel 6.2.1-STABLE</span>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-primary/70">Liên kết Đa vũ trụ: Đang hoạt động</span>
            </div>
            <div className="flex items-center gap-6">
              <span>Hệ thống Tiên đề: Tần số tối ưu</span>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span>Giao thức Quan sát Active</span>
            </div>
          </footer>
        )}
      </div>

      {/* Global VFX Overlays could go here */}
    </div>
  );
};

export default Shell;
