import { create } from "zustand";

export interface ZoneData {
  zone_id: number;
  x: number;
  y: number;
  urban_density: number;
  entropy: number;
  resource_extraction: number;
  fear: number;
  danger_level: string; // e.g., 'SAFE', 'WARNING', 'CRITICAL'
}

export interface ActorNode {
  id: string;
  name: string;
  dominance: number;
  faction_id: number;
  archetype: string;
  hunger?: number;
  tech_level?: string;
}

export interface FactionRelation {
  source: string;
  target: string;
  type: string; // 'ALLY', 'ENEMY', 'VASSAL', 'LINEAGE'
}

export interface CalamityEvent {
  id: string;
  type: string;
  epicenter_zone_id: number;
  intensity: number;
  description: string;
  tick: number;
}

interface WorldState {
  // Global Meta
  universeId: number | null;
  currentTick: number;
  
  // 2.5D HexMap Data
  zones: Record<number, ZoneData>;
  
  // 3D Graph Data
  actorNodes: ActorNode[];
  graphEdges: FactionRelation[];
  
  // Timeline Feeds & FX Triggers
  activeCalamities: CalamityEvent[];
  sagas: string[];
  
  // UI State
  viewMode: 'MACRO' | 'MICRO'; // MACRO = HexMap, MICRO = Astral Web
  
  // Actions
  setUniverseId: (id: number) => void;
  updateTick: (tick: number) => void;
  updateZones: (zones: ZoneData[]) => void;
  updateGraph: (nodes: ActorNode[], edges: FactionRelation[]) => void;
  addCalamity: (calamity: CalamityEvent) => void;
  addSaga: (saga: string) => void;
  clearExpiredCalamities: (currentTick: number) => void;
  setViewMode: (mode: 'MACRO' | 'MICRO') => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  universeId: null,
  currentTick: 0,
  
  zones: {},
  
  actorNodes: [],
  graphEdges: [],
  
  activeCalamities: [],
  sagas: [],
  
  viewMode: 'MACRO',
  
  setUniverseId: (id) => set({ universeId: id }),
  updateTick: (tick) => set({ currentTick: tick }),
  
  updateZones: (zonesData) => 
    set((state) => {
      const newZones = { ...state.zones };
      zonesData.forEach(z => { newZones[z.zone_id] = z; });
      return { zones: newZones };
    }),
    
  updateGraph: (nodes, edges) => set({ actorNodes: nodes, graphEdges: edges }),
  
  addCalamity: (calamity) =>
    set((state) => ({
      activeCalamities: [...state.activeCalamities, calamity]
    })),
    
  addSaga: (saga) =>
    set((state) => ({
      sagas: [saga, ...state.sagas].slice(0, 50) // Keep last 50 sagas
    })),
    
  clearExpiredCalamities: (currentTick) =>
    set((state) => ({
      // A calamity effect lingers for 100 ticks visually
      activeCalamities: state.activeCalamities.filter(c => currentTick - c.tick < 100)
    })),
    
  setViewMode: (mode) => set({ viewMode: mode })
}));
