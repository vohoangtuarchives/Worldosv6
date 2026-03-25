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
  
  // Actions
  updateFromAdvance: (data: any) => void;
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

  updateFromAdvance: (data) => set((state) => ({
    currentTick: data.tick ?? state.currentTick,
    universes: data.universes ?? state.universes,
    axioms: data.axioms ?? state.axioms,
    entities: data.entities ?? state.entities,
  })),

  addChronicle: (chronicle) => set((state) => ({
    chronicles: [chronicle, ...state.chronicles].slice(0, 50),
  })),

  setUniverses: (universes) => set({ universes }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
