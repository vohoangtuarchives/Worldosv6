import { create } from "zustand";

export interface Universe {
  id: number;
  name: string;
  entropy: number;
  stability: number;
  status?: string;
  current_tick?: number;
}

export interface ChronicleRecord {
  id?: string | number;
  title?: string;
  content?: string;
  type?: string;
  raw_payload?: string | any;
}

export interface SimulationEntity {
  id: string | number;
  name?: string;
  weight?: number;
  vocation?: string;
  intent?: string;
}

export interface TransitionState {
  target: string;
  phase: number;
  startTick: number;
}

interface AdvancePayload {
  snapshot_tick?: number;
  universes?: Universe[];
  axioms?: Record<string, number>;
  chronicles?: ChronicleRecord[];
  entities?: SimulationEntity[];
  transition?: TransitionState;
  reality_strain?: number;
  anomaly_probability?: number;
  civilization_era?: string;
}

interface TransitionPayload {
  transition?: TransitionState;
  reality_strain?: number;
  anomaly_probability?: number;
}

interface SimulationState {
  currentTick: number;
  universes: Universe[];
  axioms: Record<string, number>;
  chronicles: ChronicleRecord[];
  entities: SimulationEntity[];
  isPaused: boolean;
  transition?: TransitionState;
  realityStrain: number;
  anomalyProbability: number;
  civilizationEra: string;
  updateFromAdvance: (data: AdvancePayload) => void;
  updateTransition: (data: TransitionPayload) => void;
  addChronicle: (chronicle: ChronicleRecord) => void;
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
  civilizationEra: "Genesis",

  updateFromAdvance: (data) =>
    set((state) => ({
      currentTick: data.snapshot_tick ?? state.currentTick,
      universes: data.universes ?? state.universes,
      axioms: data.axioms ?? state.axioms,
      chronicles: data.chronicles ?? state.chronicles,
      entities: data.entities ?? state.entities,
      transition: data.transition ?? state.transition,
      realityStrain: data.reality_strain ?? state.realityStrain,
      anomalyProbability: data.anomaly_probability ?? state.anomalyProbability,
      civilizationEra: data.civilization_era ?? state.civilizationEra,
    })),

  updateTransition: (data) =>
    set((state) => ({
      transition: data.transition ?? state.transition,
      realityStrain: data.reality_strain ?? state.realityStrain,
      anomalyProbability: data.anomaly_probability ?? state.anomalyProbability,
    })),

  addChronicle: (chronicle) =>
    set((state) => ({
      chronicles: [chronicle, ...state.chronicles].slice(0, 50),
    })),

  setUniverses: (universes) => set({ universes }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
