'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { usePathname } from 'next/navigation';
import { useSimulationStore } from '@/store/useSimulationStore';

const Shell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { civilizationEra } = useSimulationStore();
  
  // Decide which era class to apply
  const normalizedEraClass = civilizationEra?.toLowerCase().replace(' ', '-') || 'genesis';
  const eraClass = `era-${normalizedEraClass}`;

  // Some pages might not need the full shell (e.g., if we had a minimalist landing page later)
  // For now, let's use it everywhere as requested.
  
  return (
    <div className={`min-h-screen relative flex bg-background text-foreground transition-colors duration-1000 ${eraClass}`}>
      {/* Visual Background Elements */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-tr from-background via-background/95 to-primary/5 pointer-events-none z-0" />
      
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
