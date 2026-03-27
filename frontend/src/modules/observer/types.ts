export interface UniverseSummary {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'forked';
  currentTick: number;
  stability: number;
  entropy: number;
  informationalMass: number;
  era: string;
  branchCount: number;
  anomalyCount: number;
  focus: string;
}

export interface CreateUniversePayload {
  name: string;
  base_genre: string;
  axioms: Record<string, number>;
  initial_state?: {
    entropy: number;
    stability_index: number;
    metrics: Record<string, number>;
  };
}

export interface ObserverAxiom {
  key: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChronicleEntry {
  id: string;
  tick: number;
  title: string;
  summary: string;
  type: 'transition' | 'conflict' | 'discovery' | 'institution';
  fromTick: number;
  toTick: number;
  importance: number;
}

export interface ActorSummary {
  id: string;
  name: string;
  role: string;
  influence: number;
  alignment: string;
  lastDecision: string;
}

export interface ActorEventEntry {
  id: string;
  tick: number;
  type: string;
  summary: string;
}

export interface ActorDecision {
  id: string;
  tick: number;
  actionType: string;
  summary: string;
  confidence: number;
  utilityScore: number;
  impact: Record<string, unknown>;
}

export interface ActorDetail extends ActorSummary {
  biography: string;
  traits: Record<string, unknown>;
  metrics: Record<string, unknown>;
  stats: Record<string, unknown>;
  capabilities: Record<string, unknown>;
  vitality: Record<string, unknown>;
  lifeStage: string;
  isAlive: boolean;
  birthTick: number;
  deathTick: number | null;
  supremeEntity: {
    id: string;
    name: string;
    entityType: string;
    domain: string;
    powerLevel: number;
    status: string;
  } | null;
  recentEvents: ActorEventEntry[];
}

export interface MythScar {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  originTick: number;
  consequence: string;
  severityScore: number;
}

export interface TimelineEvent {
  id: string;
  tick: number;
  year: number | null;
  category: string;
  zone: string;
  summary: string;
  actors: string[];
  institutions: string[];
  facts: string[];
}

export interface BranchSummary {
  id: string;
  label: string;
  divergenceTick: number;
  status: 'observed' | 'volatile' | 'stable';
  currentTick: number;
}

export interface SnapshotSummary {
  id: string;
  label: string;
  tick: number;
  capturedAt: string;
  note: string;
  entropy: number;
  stabilityIndex: number;
  metrics: Record<string, unknown>;
}

export interface UniverseDetail extends UniverseSummary {
  axioms: ObserverAxiom[];
  chronicles: ChronicleEntry[];
  actors: ActorSummary[];
  mythScars: MythScar[];
  branches: BranchSummary[];
  snapshots: SnapshotSummary[];
}

export interface OmenContext {
  universe_id: number;
  universe_name: string;
  current_tick: number;
  base_genre: string;
  current_epoch: string;
  metrics: {
    entropy: number;
    stability: number;
  };
  axioms: Record<string, any>;
  recent_history: {
    tick: number;
    type: string;
    summary: string;
    raw_action?: string;
  }[];
  top_actors: {
    id: number;
    name: string;
    archetype: string;
    is_heroic: boolean;
    heroic_type: string | null;
    metrics: Record<string, any>;
    traits: string[];
  }[];
  world_fields: Record<string, number>;
}

export interface ResonancePollen {
  id: number;
  universe_id: number;
  headline: string;
  slogan: string;
  intensity: number;
  distortion: number;
  vfx: {
    effect_type: string;
    intensity: number;
    color_scheme: string;
    bloom_pollen_type: string;
  };
  origin_tick: number;
  story_snippet: string;
  tags: string[];
}

export interface ResonanceResponse {
  resonance_pollen: ResonancePollen[];
  global_narrative_entropy: number;
}

export const observerSections = [
  { label: 'Tổng quan', href: '' },
  { label: 'Thực tại', href: '/reality' },
  { label: 'Wiki', href: '/wiki' },
  { label: 'Phòng Lab Omen', href: '/omen-lab' },
  { label: 'Dòng thời gian', href: '/timeline' },
  { label: 'Biên niên sử', href: '/chronicles' },
  { label: 'Vết sẹo Thần thoại', href: '/myth-scars' },
  { label: 'Thực thể', href: '/actors' },
  { label: 'Tiên đề', href: '/axioms' },
  { label: 'Điều khiển', href: '/control' },
  { label: 'Nhánh', href: '/forks' },
  { label: 'Ảnh chụp', href: '/snapshots' },
];
