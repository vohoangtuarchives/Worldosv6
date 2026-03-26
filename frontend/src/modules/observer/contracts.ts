import type { UniverseSummary } from '@/modules/observer/types';

export interface UniverseMetrics {
  universeId: string;
  status: UniverseSummary['status'];
  currentTick: number;
  stability: number;
  entropy: number;
  snapshotCount: number;
  branchCount: number;
  actorCount: number;
  chronicleCount: number;
  anomalyCount: number;
}

export interface BranchComparison {
  universeId: string;
  branchId: string;
  source: {
    id: string;
    name: string;
    status: UniverseSummary['status'];
    tick: number;
    currentTick: number;
    entropy: number;
    stabilityIndex: number;
    metrics: Record<string, unknown>;
  };
  branch: {
    id: string;
    name: string;
    status: UniverseSummary['status'];
    tick: number;
    currentTick: number;
    entropy: number;
    stabilityIndex: number;
    metrics: Record<string, unknown>;
    forkedAtTick: number;
  };
  tickSpan: number;
  deltas: {
    currentTick: number;
    entropy: number;
    stabilityIndex: number;
  };
  metricDeltas: Record<string, number>;
}

export interface RealityPulse {
  universeId: string;
  tick: number;
  entropy: number;
  entropyThreshold: number;
  stabilityIndex: number;
  informationDensity: number;
  collapseProbability: number;
  informationalMass: number;
  singularityRisk: string;
  activeAttractor: string;
  lastMutationVector: string | null;
  mutationHistorySize: number;
}

export interface AutonomyAuditEntry {
  dslHash: string;
  dslPath: string | null;
  versionCount: number;
  hasCurrent: boolean;
  latestVersion: string | null;
  latestTimestamp: string | null;
  latestTick: number | null;
  vector: string | null;
  source: string;
  universeId: string | null;
}

export interface AutonomyAudit {
  totalMutations: number;
  chronicle: AutonomyAuditEntry[];
}

export interface MutationVersionSummary {
  file: string;
  timestamp: string | null;
  tick: number | null;
  vector: string | null;
  source: string;
}

export interface MutationDetail {
  dslHash: string;
  dslPath: string | null;
  versionCount: number;
  currentContent: string | null;
  previousContent: string | null;
  originalContent: string | null;
  latestVersion: string | null;
  latestTimestamp: string | null;
  metadata: Record<string, unknown>;
  versions: MutationVersionSummary[];
}
