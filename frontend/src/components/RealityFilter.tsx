'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface RealityFilterContextValue {
  mood: string;
  manualMood?: string;
  setMood: (mood: string) => void;
}

const RealityFilterContext = createContext<RealityFilterContextValue | undefined>(undefined);

export const RealityFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [mood, setMood] = useState('stable');

  const value = useMemo(
    () => ({
      mood,
      manualMood: undefined,
      setMood,
    }),
    [mood],
  );

  return <RealityFilterContext.Provider value={value}>{children}</RealityFilterContext.Provider>;
};

export const useRealityFilter = () => {
  const context = useContext(RealityFilterContext);

  if (!context) {
    throw new Error('useRealityFilter must be used within a RealityFilterProvider');
  }

  return context;
};
