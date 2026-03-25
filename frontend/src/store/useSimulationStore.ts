import { create } from 'zustand';

interface Universe {
  id: number;
  name: string;
  entropy: number;
  stability: number;
}

interface SimulationState {
  currentTick: number;
  universes: Universe[];
  axioms: Record<string, number>;
  chronicles: any[];
  entities: any[];
  isPaused: boolean;
  
  // Transition State
  transition?: {
    target: string;
    phase: number;
    startTick: number;
  };
  realityStrain: number;
  anomalyProbability: number;
  civilizationEra: string;

  // Actions
  updateFromAdvance: (data: any) => void;
  updateTransition: (data: any) => void;
  addChronicle: (chronicle: any) => void;
  setUniverses: (universes: Universe[]) => void;
  togglePause: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  currentTick: 0,
  universes: [],
  axioms: {},
  chronicles: [],
  entities: [],
  isPaused: false,
  realityStrain: 0,
  anomalyProbability: 0,
  civilizationEra: 'Genesis',

  updateFromAdvance: (data) => set((state) => ({
    currentTick: data.snapshot_tick ?? state.currentTick,
    universes: data.universes ?? state.universes,
    axioms: data.axioms ?? state.axioms,
    entities: data.entities ?? state.entities,
    transition: data.transition ?? state.transition,
    realityStrain: data.reality_strain ?? state.realityStrain,
    anomalyProbability: data.anomaly_probability ?? state.anomalyProbability,
    civilizationEra: data.civilization_era ?? state.civilizationEra,
  })),

  updateTransition: (data) => set({
    transition: data.transition,
    realityStrain: data.reality_strain ?? 0.1,
    anomalyProbability: data.anomaly_probability ?? 0.05,
  }),

  addChronicle: (chronicle) => set((state) => ({
    chronicles: [chronicle, ...state.chronicles].slice(0, 50),
  })),

  setUniverses: (universes) => set({ universes }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
