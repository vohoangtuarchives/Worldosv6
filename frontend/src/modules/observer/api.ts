import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AutonomyAudit, BranchComparison, MutationDetail, RealityPulse, UniverseMetrics } from '@/modules/observer/contracts';
import type {
  ActorDecision,
  ActorDetail,
  ActorEventEntry,
  ActorSummary,
  BranchSummary,
  ChronicleEntry,
  CreateUniversePayload,
  MythScar,
  OmenContext,
  ObserverAxiom,
  SnapshotSummary,
  TimelineEvent,
  UniverseDetail,
  UniverseSummary,
} from '@/modules/observer/types';
import { asArray, asNumber, asRecord, asString, fetchClientJson, fetchServerJson, requestClientJson } from '@/shared/api/observer-http';

export const observerKeys = {
  root: ['observer'] as const,
  actorRoot: ['observer', 'actors'] as const,
  universes: {
    list: ['observer', 'universes', 'list'] as const,
    detail: (universeId: string) => ['observer', 'universes', universeId, 'detail'] as const,
    metrics: (universeId: string) => ['observer', 'universes', universeId, 'metrics'] as const,
    realityPulse: (universeId: string) => ['observer', 'universes', universeId, 'reality-pulse'] as const,
    autonomyAudit: (universeId: string) => ['observer', 'universes', universeId, 'autonomy-audit'] as const,
    mutationDetail: (universeId: string, dslHash: string) => ['observer', 'universes', universeId, 'autonomy-audit', dslHash] as const,
    chronicles: (universeId: string) => ['observer', 'universes', universeId, 'chronicles'] as const,
    mythScars: (universeId: string) => ['observer', 'universes', universeId, 'myth-scars'] as const,
    actors: (universeId: string) => ['observer', 'universes', universeId, 'actors'] as const,
    snapshots: (universeId: string) => ['observer', 'universes', universeId, 'snapshots'] as const,
    forks: (universeId: string) => ['observer', 'universes', universeId, 'forks'] as const,
    timeline: (universeId: string) => ['observer', 'universes', universeId, 'timeline'] as const,
    omenContext: (universeId: string) => ['observer', 'universes', universeId, 'omen-context'] as const,
  },
  actors: {
    detail: (actorId: string) => ['observer', 'actors', actorId, 'detail'] as const,
    events: (actorId: string) => ['observer', 'actors', actorId, 'events'] as const,
    decisions: (actorId: string) => ['observer', 'actors', actorId, 'decisions'] as const,
  },
  forks: {
    compare: (universeId: string, branchId: string) => ['observer', 'universes', universeId, 'forks', branchId, 'compare'] as const,
  },
};

type UniverseResourceKey = 'detail' | 'metrics' | 'realityPulse' | 'autonomyAudit' | 'chronicles' | 'mythScars' | 'actors' | 'snapshots' | 'forks' | 'timeline';

function unwrapPayload(payload: unknown): unknown {
  const record = asRecord(payload);
  if (record && 'data' in record) {
    return record.data;
  }

  return payload;
}

function asObject(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}

function asTextList(value: unknown): string[] {
  return asArray(value)
    .map((item) => asString(item).trim())
    .filter((item): item is string => item.length > 0);
}

function normalizeUniverseStatus(value: string): UniverseSummary['status'] {
  if (value === 'active' || value === 'paused' || value === 'forked') {
    return value;
  }

  return 'paused';
}

function normalizeBranchStatus(value: string): BranchSummary['status'] {
  if (value === 'stable' || value === 'volatile' || value === 'observed') {
    return value;
  }

  return 'observed';
}

function normalizeChronicleType(value: string): ChronicleEntry['type'] {
  if (value === 'transition' || value === 'conflict' || value === 'discovery' || value === 'institution') {
    return value;
  }

  return 'transition';
}

function normalizeScarSeverity(value: string): MythScar['severity'] {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }

  return 'medium';
}

function normalizeAxioms(value: unknown): ObserverAxiom[] {
  const record = asRecord(value);
  if (record) {
    return Object.entries(record).map(([key, rawValue]) => ({
      key,
      value: asNumber(rawValue, 0),
      trend: 'stable',
    }));
  }

  return asArray(value)
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) {
        return null;
      }

      return {
        key: asString(entry.key),
        value: asNumber(entry.value, 0),
        trend: entry.trend === 'up' || entry.trend === 'down' || entry.trend === 'stable' ? entry.trend : 'stable',
      } satisfies ObserverAxiom;
    })
    .filter((item): item is ObserverAxiom => item !== null);
}

function normalizeUniverseSummary(value: unknown): UniverseSummary | null {
  const record = asRecord(unwrapPayload(value));
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  if (!id) {
    return null;
  }

  return {
    id,
    name: asString(record.name, `Universe ${id}`),
    status: normalizeUniverseStatus(asString(record.status, 'paused')),
    currentTick: asNumber(record.current_tick, 0),
    stability: asNumber(record.stability, 0),
    entropy: asNumber(record.entropy, 0),
    informationalMass: asNumber(record.informational_mass ?? record.mass, 0),
    era: asString(record.era, 'Genesis'),
    branchCount: asNumber(record.branch_count, 0),
    anomalyCount: asNumber(record.anomaly_count, 0),
    focus: asString(record.focus, 'Observed universe branch.'),
  };
}

function normalizeUniverseDetail(value: unknown): UniverseDetail | undefined {
  const record = asRecord(unwrapPayload(value));
  const summary = normalizeUniverseSummary(record);
  if (!record || !summary) {
    return undefined;
  }

  return {
    ...summary,
    axioms: normalizeAxioms(record.axioms),
    chronicles: [],
    actors: [],
    mythScars: [],
    branches: [],
    snapshots: [],
  };
}

function normalizeChronicles(value: unknown): ChronicleEntry[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const fromTick = asNumber(record.from_tick, 0);
      const toTick = asNumber(record.to_tick, fromTick);

      return {
        id: asString(record.id, `chronicle-${index}`),
        tick: asNumber(record.tick, toTick),
        title: asString(record.title, `Chronicle ${index + 1}`),
        summary: asString(record.summary, 'No summary available.'),
        type: normalizeChronicleType(asString(record.type, 'transition')),
        fromTick,
        toTick,
        importance: asNumber(record.importance, 0),
      } satisfies ChronicleEntry;
    })
    .filter((item): item is ChronicleEntry => item !== null);
}

function normalizeActors(value: unknown): ActorSummary[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `actor-${index}`),
        name: asString(record.name, `Actor ${index + 1}`),
        role: asString(record.role, 'Unknown role'),
        influence: asNumber(record.influence, 0),
        alignment: asString(record.alignment, 'Adaptive'),
        lastDecision: asString(record.last_decision, 'No recent decision recorded.'),
      } satisfies ActorSummary;
    })
    .filter((item): item is ActorSummary => item !== null);
}

function normalizeActorEvents(value: unknown): ActorEventEntry[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `event-${index}`),
        tick: asNumber(record.tick, 0),
        type: asString(record.type, 'observation'),
        summary: asString(record.summary, 'No event summary available.'),
      } satisfies ActorEventEntry;
    })
    .filter((item): item is ActorEventEntry => item !== null);
}

function normalizeActorDecisions(value: unknown): ActorDecision[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `decision-${index}`),
        tick: asNumber(record.tick, 0),
        actionType: asString(record.action_type, 'observe'),
        summary: asString(record.summary, 'No decision summary available.'),
        confidence: asNumber(record.confidence, 0),
        utilityScore: asNumber(record.utility_score, 0),
        impact: asObject(record.impact),
      } satisfies ActorDecision;
    })
    .filter((item): item is ActorDecision => item !== null);
}

function normalizeActorDetail(value: unknown): ActorDetail | undefined {
  const record = asRecord(unwrapPayload(value));
  if (!record) {
    return undefined;
  }

  const summary = normalizeActors([record])[0];
  if (!summary) {
    return undefined;
  }

  const supremeEntity = asRecord(record.supreme_entity);

  return {
    ...summary,
    biography: asString(record.biography, 'No biography available yet.'),
    traits: asObject(record.traits),
    metrics: asObject(record.metrics),
    stats: asObject(record.stats),
    capabilities: asObject(record.capabilities),
    vitality: asObject(record.vitality),
    lifeStage: asString(record.life_stage, 'Unknown'),
    isAlive: Boolean(record.is_alive),
    birthTick: asNumber(record.birth_tick, 0),
    deathTick: record.death_tick === null ? null : asNumber(record.death_tick, 0),
    supremeEntity: supremeEntity
      ? {
          id: asString(supremeEntity.id),
          name: asString(supremeEntity.name, 'Unnamed entity'),
          entityType: asString(supremeEntity.entity_type, 'Unknown'),
          domain: asString(supremeEntity.domain, 'Unspecified'),
          powerLevel: asNumber(supremeEntity.power_level, 0),
          status: asString(supremeEntity.status, 'unknown'),
        }
      : null,
    recentEvents: normalizeActorEvents(record.recent_events),
  };
}

function normalizeMythScars(value: unknown): MythScar[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `scar-${index}`),
        title: asString(record.title, `Myth Scar ${index + 1}`),
        severity: normalizeScarSeverity(asString(record.severity, 'medium')),
        originTick: asNumber(record.origin_tick, 0),
        consequence: asString(record.consequence, 'No consequence summary available.'),
        severityScore: asNumber(record.severity_score, 0),
      } satisfies MythScar;
    })
    .filter((item): item is MythScar => item !== null);
}

function normalizeSnapshots(value: unknown): SnapshotSummary[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `snapshot-${index}`),
        label: asString(record.label, `Snapshot ${index + 1}`),
        tick: asNumber(record.tick, 0),
        capturedAt: asString(record.created_at, 'Unknown'),
        note: asString(record.note, 'No snapshot note available.'),
        entropy: asNumber(record.entropy, 0),
        stabilityIndex: asNumber(record.stability_index, 0),
        metrics: asObject(record.metrics),
      } satisfies SnapshotSummary;
    })
    .filter((item): item is SnapshotSummary => item !== null);
}

function normalizeBranches(value: unknown): BranchSummary[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `branch-${index}`),
        label: asString(record.label ?? record.name, `Branch ${index + 1}`),
        divergenceTick: asNumber(record.divergence_tick, 0),
        status: normalizeBranchStatus(asString(record.status, 'observed')),
        currentTick: asNumber(record.current_tick, 0),
      } satisfies BranchSummary;
    })
    .filter((item): item is BranchSummary => item !== null);
}

function normalizeTimelineEvents(value: unknown): TimelineEvent[] {
  return asArray(unwrapPayload(value))
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: asString(record.id, `timeline-${index}`),
        tick: asNumber(record.tick, 0),
        year: record.year === null ? null : asNumber(record.year, 0),
        category: asString(record.category, 'transition'),
        zone: asString(record.zone, 'Global'),
        summary: asString(record.summary, 'No timeline summary available.'),
        actors: asTextList(record.actors),
        institutions: asTextList(record.institutions),
        facts: asTextList(record.facts),
      } satisfies TimelineEvent;
    })
    .filter((item): item is TimelineEvent => item !== null);
}

function normalizeUniverseMetrics(value: unknown): UniverseMetrics | undefined {
  const record = asRecord(unwrapPayload(value));
  if (!record) {
    return undefined;
  }

  return {
    universeId: asString(record.universe_id),
    status: normalizeUniverseStatus(asString(record.status, 'paused')),
    currentTick: asNumber(record.current_tick, 0),
    stability: asNumber(record.stability, 0),
    entropy: asNumber(record.entropy, 0),
    snapshotCount: asNumber(record.snapshot_count, 0),
    branchCount: asNumber(record.branch_count, 0),
    actorCount: asNumber(record.actor_count, 0),
    chronicleCount: asNumber(record.chronicle_count, 0),
    anomalyCount: asNumber(record.anomaly_count, 0),
  };
}

function normalizeBranchComparison(value: unknown): BranchComparison | undefined {
  const record = asRecord(unwrapPayload(value));
  if (!record) {
    return undefined;
  }

  const source = asRecord(record.source);
  const branch = asRecord(record.branch);
  const deltas = asRecord(record.deltas);
  if (!source || !branch || !deltas) {
    return undefined;
  }

  return {
    universeId: asString(record.universe_id),
    branchId: asString(record.branch_id),
    source: {
      id: asString(source.id),
      name: asString(source.name, 'Source branch'),
      status: normalizeUniverseStatus(asString(source.status, 'paused')),
      tick: asNumber(source.tick, 0),
      currentTick: asNumber(source.current_tick, 0),
      entropy: asNumber(source.entropy, 0),
      stabilityIndex: asNumber(source.stability_index, 0),
      metrics: asObject(source.metrics),
    },
    branch: {
      id: asString(branch.id),
      name: asString(branch.name, 'Compared branch'),
      status: normalizeUniverseStatus(asString(branch.status, 'paused')),
      tick: asNumber(branch.tick, 0),
      currentTick: asNumber(branch.current_tick, 0),
      entropy: asNumber(branch.entropy, 0),
      stabilityIndex: asNumber(branch.stability_index, 0),
      metrics: asObject(branch.metrics),
      forkedAtTick: asNumber(branch.forked_at_tick, 0),
    },
    tickSpan: asNumber(record.tick_span, 0),
    deltas: {
      currentTick: asNumber(deltas.current_tick, 0),
      entropy: asNumber(deltas.entropy, 0),
      stabilityIndex: asNumber(deltas.stability_index, 0),
    },
    metricDeltas: Object.fromEntries(
      Object.entries(asObject(record.metric_deltas)).map(([key, item]) => [key, asNumber(item, 0)]),
    ),
  };
}

function normalizeRealityPulse(wavefunctionPayload: unknown, massPayload: unknown): RealityPulse | undefined {
  const wavefunctionRecord = asRecord(wavefunctionPayload);
  const massRecord = asRecord(massPayload);
  const wavefunction = asRecord(wavefunctionRecord?.wavefunction);
  const autopoiesis = asRecord(wavefunctionRecord?.autopoiesis);

  if (!wavefunctionRecord || !massRecord || !wavefunction || !autopoiesis) {
    return undefined;
  }

  return {
    universeId: asString(wavefunctionRecord.universe_id),
    tick: asNumber(wavefunctionRecord.tick, 0),
    entropy: asNumber(wavefunction.entropy, 0),
    entropyThreshold: asNumber(autopoiesis.entropy_threshold, 0.7),
    stabilityIndex: asNumber(wavefunction.stability_index, 0),
    informationDensity: asNumber(wavefunction.information_density, 0),
    collapseProbability: asNumber(wavefunction.collapse_probability, 0),
    informationalMass: asNumber(massRecord.informational_mass, 0),
    singularityRisk: asString(massRecord.singularity_risk, 'NORMAL'),
    activeAttractor: asString(wavefunction.active_attractor, 'unknown'),
    lastMutationVector: autopoiesis.last_mutation_vector === null ? null : asString(autopoiesis.last_mutation_vector),
    mutationHistorySize: asNumber(autopoiesis.mutation_history_size, 0),
  };
}

function normalizeAutonomyAudit(value: unknown): AutonomyAudit | undefined {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  return {
    totalMutations: asNumber(record.total_mutations, 0),
    chronicle: asArray(record.chronicle)
      .map((item) => {
        const entry = asRecord(item);
        if (!entry) {
          return null;
        }

        return {
          dslHash: asString(entry.dsl_hash),
          dslPath: entry.dsl_path === null ? null : asString(entry.dsl_path),
          versionCount: asNumber(entry.version_count, 0),
          hasCurrent: Boolean(entry.has_current),
          latestVersion: entry.latest_version === null ? null : asString(entry.latest_version),
          latestTimestamp: entry.latest_timestamp === null ? null : asString(entry.latest_timestamp),
          latestTick: entry.latest_tick === null ? null : asNumber(entry.latest_tick, 0),
          vector: entry.vector === null ? null : asString(entry.vector),
          source: asString(entry.source, 'autopoiesis'),
          universeId: entry.universe_id === null ? null : asString(entry.universe_id),
        };
      })
      .filter((item): item is AutonomyAudit['chronicle'][number] => item !== null),
  };
}

function normalizeMutationDetail(value: unknown): MutationDetail | undefined {
  const record = asRecord(value);
  const detail = asRecord(record?.detail ?? value);
  if (!detail) {
    return undefined;
  }

  return {
    dslHash: asString(detail.dsl_hash),
    dslPath: detail.dsl_path === null ? null : asString(detail.dsl_path),
    versionCount: asNumber(detail.version_count, 0),
    currentContent: detail.current_content === null ? null : asString(detail.current_content),
    previousContent: detail.previous_content === null ? null : asString(detail.previous_content),
    originalContent: detail.original_content === null ? null : asString(detail.original_content),
    latestVersion: detail.latest_version === null ? null : asString(detail.latest_version),
    latestTimestamp: detail.latest_timestamp === null ? null : asString(detail.latest_timestamp),
    metadata: asObject(detail.metadata),
    versions: asArray(detail.versions)
      .map((item) => {
        const entry = asRecord(item);
        if (!entry) {
          return null;
        }

        return {
          file: asString(entry.file),
          timestamp: entry.timestamp === null ? null : asString(entry.timestamp),
          tick: entry.tick === null ? null : asNumber(entry.tick, 0),
          vector: entry.vector === null ? null : asString(entry.vector),
          source: asString(entry.source, 'autopoiesis'),
        };
      })
      .filter((item): item is MutationDetail['versions'][number] => item !== null),
  };
}
async function fetchObserverResourceServer(path: string): Promise<unknown | undefined> {
  try {
    return await fetchServerJson<unknown>(path);
  } catch {
    return undefined;
  }
}

async function getObserverUniverseSummariesClient(): Promise<UniverseSummary[]> {
  const payload = await fetchClientJson<unknown>('/api/worldos/universes');
  return asArray(unwrapPayload(payload))
    .map(normalizeUniverseSummary)
    .filter((item): item is UniverseSummary => item !== null);
}

async function getObserverUniverseDetailClient(universeId: string): Promise<UniverseDetail> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}`);
  const detail = normalizeUniverseDetail(payload);
  if (!detail) {
    throw new Error(`Universe not found: ${universeId}`);
  }

  return detail;
}

async function getObserverUniverseMetricsClient(universeId: string): Promise<UniverseMetrics> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/metrics`);
  const metrics = normalizeUniverseMetrics(payload);
  if (!metrics) {
    throw new Error(`Metrics not found: ${universeId}`);
  }

  return metrics;
}

async function getObserverRealityPulseClient(universeId: string): Promise<RealityPulse> {
  const cleanId = universeId.includes(':') ? universeId.split(':')[0] : universeId;
  const [wavefunctionPayload, massPayload] = await Promise.all([
    fetchClientJson<unknown>(`/api/apex/wavefunction/${cleanId}`),
    fetchClientJson<unknown>(`/api/apex/informational-mass/${cleanId}`),
  ]);
  const pulse = normalizeRealityPulse(wavefunctionPayload, massPayload);
  if (!pulse) {
    throw new Error(`Reality pulse not available: ${universeId}`);
  }

  return pulse;
}

async function getObserverAutonomyAuditClient(universeId: string): Promise<AutonomyAudit> {
  const cleanId = universeId.includes(':') ? universeId.split(':')[0] : universeId;
  const payload = await fetchClientJson<unknown>(`/api/apex/mutation-chronicle/${cleanId}`);
  const audit = normalizeAutonomyAudit(payload);
  if (!audit) {
    throw new Error(`Autonomy audit not available: ${universeId}`);
  }

  return audit;
}

async function getObserverMutationDetailClient(universeId: string, dslHash: string): Promise<MutationDetail> {
  const cleanId = universeId.includes(':') ? universeId.split(':')[0] : universeId;
  const payload = await fetchClientJson<unknown>(`/api/apex/mutation-chronicle/${cleanId}/${dslHash}`);
  const detail = normalizeMutationDetail(payload);
  if (!detail) {
    throw new Error(`Mutation detail not available: ${dslHash}`);
  }

  return detail;
}
async function getObserverUniverseChroniclesClient(universeId: string): Promise<ChronicleEntry[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/chronicles`);
  return normalizeChronicles(payload);
}

async function getObserverUniverseMythScarsClient(universeId: string): Promise<MythScar[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/myth-scars`);
  return normalizeMythScars(payload);
}

async function getObserverUniverseActorsClient(universeId: string): Promise<ActorSummary[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/actors`);
  return normalizeActors(payload);
}

async function getObserverUniverseSnapshotsClient(universeId: string): Promise<SnapshotSummary[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/snapshots`);
  return normalizeSnapshots(payload);
}

async function getObserverUniverseForksClient(universeId: string): Promise<BranchSummary[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/forks`);
  return normalizeBranches(payload);
}

async function getObserverUniverseTimelineClient(universeId: string): Promise<TimelineEvent[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/history-timeline`);
  return normalizeTimelineEvents(payload);
}

async function getObserverActorDetailClient(actorId: string): Promise<ActorDetail> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/actors/${actorId}`);
  const detail = normalizeActorDetail(payload);
  if (!detail) {
    throw new Error(`Actor not found: ${actorId}`);
  }

  return detail;
}

async function getObserverActorEventsClient(actorId: string): Promise<ActorEventEntry[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/actors/${actorId}/events`);
  return normalizeActorEvents(payload);
}

async function getObserverActorDecisionsClient(actorId: string): Promise<ActorDecision[]> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/actors/${actorId}/decisions`);
  return normalizeActorDecisions(payload);
}

async function getObserverBranchComparisonClient(universeId: string, branchId: string): Promise<BranchComparison> {
  const payload = await fetchClientJson<unknown>(`/api/worldos/universes/${universeId}/forks/compare?branch_id=${branchId}`);
  const comparison = normalizeBranchComparison(payload);
  if (!comparison) {
    throw new Error(`Branch comparison not available: ${branchId}`);
  }

  return comparison;
}

export async function getObserverUniverseSummariesServer(): Promise<UniverseSummary[]> {
  const payload = await fetchObserverResourceServer('/api/worldos/universes');
  return payload
    ? asArray(unwrapPayload(payload))
        .map(normalizeUniverseSummary)
        .filter((item): item is UniverseSummary => item !== null)
    : [];
}

export async function getObserverUniverseDetailServer(universeId: string): Promise<UniverseDetail | undefined> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}`);
  return payload ? normalizeUniverseDetail(payload) : undefined;
}

export async function getObserverUniverseMetricsServer(universeId: string): Promise<UniverseMetrics | undefined> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/metrics`);
  return payload ? normalizeUniverseMetrics(payload) : undefined;
}

export async function getObserverRealityPulseServer(universeId: string): Promise<RealityPulse | undefined> {
  const [wavefunctionPayload, massPayload] = await Promise.all([
    fetchObserverResourceServer(`/api/apex/wavefunction/${universeId}`),
    fetchObserverResourceServer(`/api/apex/informational-mass/${universeId}`),
  ]);

  return wavefunctionPayload && massPayload ? normalizeRealityPulse(wavefunctionPayload, massPayload) : undefined;
}

export async function getObserverAutonomyAuditServer(universeId: string): Promise<AutonomyAudit | undefined> {
  const payload = await fetchObserverResourceServer(`/api/apex/mutation-chronicle/${universeId}`);
  return payload ? normalizeAutonomyAudit(payload) : undefined;
}
export async function getObserverUniverseChroniclesServer(universeId: string): Promise<ChronicleEntry[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/chronicles`);
  return payload ? normalizeChronicles(payload) : [];
}

export async function getObserverUniverseMythScarsServer(universeId: string): Promise<MythScar[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/myth-scars`);
  return payload ? normalizeMythScars(payload) : [];
}

export async function getObserverUniverseActorsServer(universeId: string): Promise<ActorSummary[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/actors`);
  return payload ? normalizeActors(payload) : [];
}

export async function getObserverUniverseSnapshotsServer(universeId: string): Promise<SnapshotSummary[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/snapshots`);
  return payload ? normalizeSnapshots(payload) : [];
}

export async function getObserverUniverseForksServer(universeId: string): Promise<BranchSummary[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/forks`);
  return payload ? normalizeBranches(payload) : [];
}

export async function getObserverUniverseTimelineServer(universeId: string): Promise<TimelineEvent[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/universes/${universeId}/history-timeline`);
  return payload ? normalizeTimelineEvents(payload) : [];
}

export async function getObserverActorDetailServer(actorId: string): Promise<ActorDetail | undefined> {
  const payload = await fetchObserverResourceServer(`/api/worldos/actors/${actorId}`);
  return payload ? normalizeActorDetail(payload) : undefined;
}

export async function getObserverActorEventsServer(actorId: string): Promise<ActorEventEntry[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/actors/${actorId}/events`);
  return payload ? normalizeActorEvents(payload) : [];
}

export async function getObserverActorDecisionsServer(actorId: string): Promise<ActorDecision[]> {
  const payload = await fetchObserverResourceServer(`/api/worldos/actors/${actorId}/decisions`);
  return payload ? normalizeActorDecisions(payload) : [];
}

export async function invalidateObserverUniverseQueries(
  queryClient: QueryClient,
  universeId: string,
  resources: UniverseResourceKey[] = ['detail', 'metrics', 'realityPulse', 'autonomyAudit', 'chronicles', 'mythScars', 'actors', 'snapshots', 'forks', 'timeline'],
) {
  const keyFactories: Record<UniverseResourceKey, (id: string) => readonly unknown[]> = {
    detail: observerKeys.universes.detail,
    metrics: observerKeys.universes.metrics,
    realityPulse: observerKeys.universes.realityPulse,
    autonomyAudit: observerKeys.universes.autonomyAudit,
    chronicles: observerKeys.universes.chronicles,
    mythScars: observerKeys.universes.mythScars,
    actors: observerKeys.universes.actors,
    snapshots: observerKeys.universes.snapshots,
    forks: observerKeys.universes.forks,
    timeline: observerKeys.universes.timeline,
  };

  const tasks: Promise<unknown>[] = [queryClient.invalidateQueries({ queryKey: observerKeys.universes.list })];

  for (const resource of resources) {
    tasks.push(queryClient.invalidateQueries({ queryKey: keyFactories[resource](universeId) }));
  }

  if (resources.includes('actors') || resources.includes('chronicles') || resources.includes('timeline')) {
    tasks.push(queryClient.invalidateQueries({ queryKey: observerKeys.actorRoot }));
  }

  await Promise.all(tasks);
}

export function useObserverUniverseSummaries(initialData?: UniverseSummary[]) {
  return useQuery({
    queryKey: observerKeys.universes.list,
    queryFn: getObserverUniverseSummariesClient,
    initialData,
  });
}

export function useObserverUniverseDetail(universeId: string, initialData: UniverseDetail) {
  return useQuery({
    queryKey: observerKeys.universes.detail(universeId),
    queryFn: () => getObserverUniverseDetailClient(universeId),
    initialData,
  });
}

export function useObserverUniverseMetrics(universeId: string, initialData: UniverseMetrics) {
  return useQuery({
    queryKey: observerKeys.universes.metrics(universeId),
    queryFn: () => getObserverUniverseMetricsClient(universeId),
    initialData,
  });
}

export function useObserverRealityPulse(universeId: string, initialData?: RealityPulse) {
  return useQuery({
    queryKey: observerKeys.universes.realityPulse(universeId),
    queryFn: () => getObserverRealityPulseClient(universeId),
    initialData,
  });
}

export function useObserverAutonomyAudit(universeId: string, initialData?: AutonomyAudit) {
  return useQuery({
    queryKey: observerKeys.universes.autonomyAudit(universeId),
    queryFn: () => getObserverAutonomyAuditClient(universeId),
    initialData,
  });
}

export function useObserverMutationDetail(universeId: string, dslHash: string | null) {
  return useQuery({
    queryKey: observerKeys.universes.mutationDetail(universeId, dslHash ?? 'none'),
    queryFn: () => getObserverMutationDetailClient(universeId, dslHash ?? ''),
    enabled: Boolean(dslHash),
  });
}
export function useObserverUniverseChronicles(universeId: string, initialData: ChronicleEntry[]) {
  return useQuery({
    queryKey: observerKeys.universes.chronicles(universeId),
    queryFn: () => getObserverUniverseChroniclesClient(universeId),
    initialData,
  });
}

export function useObserverUniverseMythScars(universeId: string, initialData: MythScar[]) {
  return useQuery({
    queryKey: observerKeys.universes.mythScars(universeId),
    queryFn: () => getObserverUniverseMythScarsClient(universeId),
    initialData,
  });
}

export function useObserverUniverseActors(universeId: string, initialData: ActorSummary[]) {
  return useQuery({
    queryKey: observerKeys.universes.actors(universeId),
    queryFn: () => getObserverUniverseActorsClient(universeId),
    initialData,
  });
}

export function useObserverUniverseSnapshots(universeId: string, initialData: SnapshotSummary[]) {
  return useQuery({
    queryKey: observerKeys.universes.snapshots(universeId),
    queryFn: () => getObserverUniverseSnapshotsClient(universeId),
    initialData,
  });
}

export function useObserverUniverseForks(universeId: string, initialData: BranchSummary[]) {
  return useQuery({
    queryKey: observerKeys.universes.forks(universeId),
    queryFn: () => getObserverUniverseForksClient(universeId),
    initialData,
  });
}

export function useObserverUniverseTimeline(universeId: string, initialData: TimelineEvent[]) {
  return useQuery({
    queryKey: observerKeys.universes.timeline(universeId),
    queryFn: () => getObserverUniverseTimelineClient(universeId),
    initialData,
  });
}

export function useObserverActorDetail(actorId: string, initialData: ActorDetail) {
  return useQuery({
    queryKey: observerKeys.actors.detail(actorId),
    queryFn: () => getObserverActorDetailClient(actorId),
    initialData,
  });
}

export function useObserverActorEvents(actorId: string, initialData: ActorEventEntry[]) {
  return useQuery({
    queryKey: observerKeys.actors.events(actorId),
    queryFn: () => getObserverActorEventsClient(actorId),
    initialData,
  });
}

export function useObserverActorDecisions(actorId: string, initialData: ActorDecision[]) {
  return useQuery({
    queryKey: observerKeys.actors.decisions(actorId),
    queryFn: () => getObserverActorDecisionsClient(actorId),
    initialData,
  });
}

export function useObserverBranchComparison(universeId: string, branchId: string | null) {
  return useQuery({
    queryKey: observerKeys.forks.compare(universeId, branchId ?? 'none'),
    queryFn: () => getObserverBranchComparisonClient(universeId, branchId ?? ''),
    enabled: Boolean(branchId),
  });
}

export function useAdvanceUniverseMutation(universeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticks: number) =>
      requestClientJson<unknown>('/api/worldos/simulation/advance', {
        method: 'POST',
        body: JSON.stringify({ universe_id: Number(universeId), ticks }),
      }),
    onSuccess: async () => {
      await invalidateObserverUniverseQueries(queryClient, universeId);
    },
  });
}

export function useForkUniverseMutation(universeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tick: number; name?: string }) =>
      requestClientJson<Record<string, unknown>>(`/api/worldos/universes/${universeId}/fork`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await invalidateObserverUniverseQueries(queryClient, universeId, ['detail', 'metrics', 'realityPulse', 'forks']);
    },
  });
}

export function useToggleUniverseStatusMutation(universeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      requestClientJson<Record<string, unknown>>(`/api/worldos/universes/${universeId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: async () => {
      await invalidateObserverUniverseQueries(queryClient, universeId, ['detail', 'metrics', 'realityPulse']);
    },
  });
}

export function useCreateUniverseSnapshotMutation(universeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      requestClientJson<Record<string, unknown>>(`/api/worldos/universes/${universeId}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: async () => {
      await invalidateObserverUniverseQueries(queryClient, universeId, ['detail', 'metrics', 'realityPulse', 'snapshots']);
    },
  });
}







/**
 * AI Diagnostics run mutation.
 */
export function useAiDiagnosticsMutation() {
  return useMutation({
    mutationFn: (input: { driver?: string; prompt?: string }) =>
      requestClientJson<Record<string, unknown>>('/api/system/ai/diagnostics/run', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

async function getObserverCreateUniverseClient(payload: CreateUniversePayload): Promise<UniverseDetail> {
  const result = await requestClientJson<unknown>('/api/worldos/universes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const detail = normalizeUniverseDetail(result);
  if (!detail) {
    throw new Error('Failed to create universe');
  }
  return detail;
}

export function useObserverCreateUniverse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getObserverCreateUniverseClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: observerKeys.universes.list });
    },
  });
}

async function getObserverOmenContext(universeId: string): Promise<OmenContext> {
  const result = await fetchClientJson<OmenContext>(`/api/narrative/universes/${universeId}/omen-context`);
  return result;
}

export function useObserverOmenContext(universeId: string) {
  return useQuery({
    queryKey: observerKeys.universes.omenContext(universeId),
    queryFn: () => getObserverOmenContext(universeId),
    enabled: !!universeId,
  });
}



