'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

type RealityMood = 'STABLE' | 'UNSTABLE' | 'CRITICAL';

interface RealityFilterContextType {
  mood: RealityMood;
  setManualMood: (mood: RealityMood | null) => void;
}

const RealityFilterContext = createContext<RealityFilterContextType | undefined>(undefined);

export const RealityFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentTick, universes } = useSimulationStore();
  const [mood, setMood] = useState<RealityMood>('STABLE');
  const [manualMood, setManualMood] = useState<RealityMood | null>(null);

  useEffect(() => {
    if (manualMood) {
      setMood(manualMood);
      return;
    }

    // Logic based on first universe (Primary) stability
    const primaryUniverse = universes[0];
    if (!primaryUniverse) return;

    // Use a pseudo-random entropy based on tick if metrics are missing
    const simulatedStability = 100 - (Math.sin(currentTick * 0.01) * 5 + 5); 
    
    if (simulatedStability < 70) {
      setMood('CRITICAL');
    } else if (simulatedStability < 90) {
      setMood('UNSTABLE');
    } else {
      setMood('STABLE');
    }
  }, [currentTick, universes, manualMood]);

  // Update CSS Variables based on mood
  useEffect(() => {
    const root = document.documentElement;
    if (mood === 'CRITICAL') {
      root.style.setProperty('--cosmos', '280 100% 50%'); // Deep purple
      root.style.setProperty('--primary', '0 100% 50%');  // Danger red
      root.style.setProperty('--void', '240 20% 5%');    // Darker void
    } else if (mood === 'UNSTABLE') {
      root.style.setProperty('--cosmos', '260 80% 60%');
      root.style.setProperty('--primary', '30 100% 50%'); // Warning orange
      root.style.setProperty('--void', '240 10% 8%');
    } else {
      // Default / Stable
      root.style.setProperty('--cosmos', '262 83% 58%');
      root.style.setProperty('--primary', '262 83% 58%');
      root.style.setProperty('--void', '240 10% 10%');
    }
  }, [mood]);

  return (
    <RealityFilterContext.Provider value={{ mood, setManualMood }}>
      <div className={`reality-mood-${mood.toLowerCase()} transition-all duration-1000 w-full h-full`}>
        {children}
        
        {/* Global Glitch Overlay (Active in CRITICAL) */}
        {mood === 'CRITICAL' && (
          <div className="absolute inset-0 pointer-events-none z-[100] opacity-10 animate-pulse bg-red-500/10 mix-blend-overlay" />
        )}
      </div>
    </RealityFilterContext.Provider>
  );
};

export const useRealityFilter = () => {
  const context = useContext(RealityFilterContext);
  if (context === undefined) {
    throw new Error('useRealityFilter must be used within a RealityFilterProvider');
  }
  return context;
};
