'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSimulationStore } from '@/store/useSimulationStore';

const Shell = ({ children }: { children: React.ReactNode }) => {
  const { civilizationEra } = useSimulationStore();
  
  // Decide which era class to apply
  const normalizedEraClass = civilizationEra?.toLowerCase().replace(' ', '-') || 'genesis';
  const eraClass = `era-${normalizedEraClass}`;

  // Some pages might not need the full shell (e.g., if we had a minimalist landing page later)
  // For now, let's use it everywhere as requested.
  
  return (
    <div className={`min-h-screen relative flex bg-slate-50 text-slate-900 transition-colors duration-1000 ${eraClass}`}>
      {/* Visual Background Elements */}
      <div className="fixed inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-tr from-slate-50 via-white/80 to-sky-50/30 pointer-events-none z-0" />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10 transition-all duration-300 pl-[72px]">
        <Navbar />
        
        <main className="flex-1 mt-16 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Shell;
