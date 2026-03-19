import { create } from "zustand";

export type DashboardTab =
  | "topology"
  | "causality"
  | "cognitive"
  | "evolution"
  | "chronicles"
  | "actors"
  | "archive"
  | "apex"
  | "multiverse"
  | "narrative";

interface DashboardState {
  activeTab: DashboardTab;
  showRightPanel: boolean;
  noise: number;
  clarity: string;
  setActiveTab: (tab: DashboardTab) => void;
  setShowRightPanel: (show: boolean) => void;
  setNoise: (noise: number) => void;
  setClarity: (clarity: string) => void;
  toggleRightPanel: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: "topology",
  showRightPanel: true,
  noise: 0,
  clarity: "Canonical",
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowRightPanel: (show) => set({ showRightPanel: show }),
  setNoise: (noise) => set({ noise }),
  setClarity: (clarity) => set({ clarity }),
  toggleRightPanel: () => set((state) => ({ showRightPanel: !state.showRightPanel })),
}));
