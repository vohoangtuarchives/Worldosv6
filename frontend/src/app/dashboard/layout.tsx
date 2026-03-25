'use client';

import React from 'react';
import { RealityFilterProvider } from '@/components/RealityFilter';
import DashboardNav from './DashboardNav';
import AxiomResonance from '@/components/AxiomResonance';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealityFilterProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col p-6 space-y-6 relative overflow-hidden">
        {/* Background Systems */}
        <AxiomResonance />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-starfield opacity-[0.05] pointer-events-none bg-starfield-drift-slow z-10" />
        
        {/* Persistent Navigation */}
        <div className="flex justify-center relative z-30">
           <DashboardNav />
        </div>

        {/* Children (Pages) */}
        <div className="flex-1 flex flex-col space-y-6 relative z-20">
          {children}
        </div>

        {/* Global Footer */}
        <footer className="text-[10px] text-muted-foreground font-mono flex items-center justify-between opacity-50 relative z-20">
          <span>WorldOS Kernel 6.2.0-STABLE</span>
          <span>Observation Active // Multi-Link Infrastructure</span>
        </footer>
      </div>
    </RealityFilterProvider>
  );
}
