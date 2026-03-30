'use client';

import React from 'react';
import { RealityFilterProvider } from '@/components/RealityFilter';
import DashboardNav from './DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealityFilterProvider>
      <div className="flex flex-col space-y-8 animate-in fade-in duration-700">
        {/* Secondary Dashboard Navigation */}
        <div className="flex justify-center">
           <DashboardNav />
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </RealityFilterProvider>
  );
}
