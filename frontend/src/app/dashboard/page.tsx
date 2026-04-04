'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Compass,
    History,
    Landmark,
    Layers3,
    Library,
    Orbit,
    RefreshCcw,
    ScrollText,
    Shapes,
    Sparkles,
} from 'lucide-react';

import {
    useUniverseDossier,
    useUniverseMetrics,
    useUniverseOptions,
} from '@/hooks/useUniverseDossier';

type Dictionary = Record<string, any>;

interface DossierEconomy extends Dictionary {
    prosperity_index?: number;
    prosperity_trend?: number;
    food_price?: number;
    market_surplus?: number;
    resource_biases?: Record<string, number>;
}

interface DossierGovernance extends Dictionary {
    stability?: number;
    legitimacy?: number;
    elite_power?: number;
    total_population?: number;
    authority_intensity?: number;
}

interface DossierCivilizationProfile extends Dictionary {
    identity?: Dictionary;
    governance?: DossierGovernance;
    economy?: DossierEconomy;
    belief_order?: {
        average_cohesion?: number;
    };
    core_regions?: Dictionary[];
}

function getRecord<T = Dictionary>(value: unknown): T {
    return (value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : {} as T);
}

function getEntries(value: unknown): Array<[string, number]> {
    return Object.entries(getRecord(value)).map(([key, count]) => [key, Number(count ?? 0)]);
}

function formatMetric(value: number | undefined, digits = 3): string {
    return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '0.000';
}

function sentenceCase(value: string | undefined | null): string {
    if (!value) return 'Unknown';
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardWorldDossierPage() {
    const { universes, isLoading: isUniverseListLoading } = useUniverseOptions();
    const [selectedUniverseId, setSelectedUniverseId] = useState<number | null>(null);
    const activeUniverseId = selectedUniverseId ?? universes[0]?.id ?? null;

    const { metrics, isLoading: isMetricsLoading, mutate: refreshMetrics } = useUniverseMetrics(activeUniverseId);
    const { dossier, isLoading: isDossierLoading, mutate: refreshDossier } = useUniverseDossier(activeUniverseId);

    const materialIdentity = getRecord(dossier?.material_identity);
    const cultureIdentity = getRecord(dossier?.culture_identity);
    const civilizationProfile = getRecord<DossierCivilizationProfile>(dossier?.civilization_profile);
    const civilizationIdentity = getRecord(civilizationProfile.identity);
    const governance = getRecord<DossierGovernance>(civilizationProfile.governance);
    const economy = getRecord<DossierEconomy>(civilizationProfile.economy);
    const beliefOrder = getRecord(civilizationProfile.belief_order);
    const history = getRecord(dossier?.history);
    const historySpine = getRecord(history.spine);
    const myths = getRecord(dossier?.myths);
    const religions = getRecord(dossier?.religions);
    const dominantReligion = getRecord(religions.dominant);

    const coreRegions = Array.isArray(civilizationProfile.core_regions) ? civilizationProfile.core_regions : [];
    const eraSummaries = Array.isArray(history.eras) ? history.eras : [];
    // const holySites = Array.isArray(beliefOrder.holy_sites) ? beliefOrder.holy_sites as unknown[] : [];

    const loading = isUniverseListLoading || isMetricsLoading || isDossierLoading;

    const [activeTab, setActiveTab] = useState<'overview' | 'civ' | 'lore' | 'history' | 'library'>('overview');

    const historyEvents: Array<{ label: string; event: Dictionary }> = [
        { label: 'Founding', event: getRecord(historySpine.founding_event) },
        { label: 'Golden Age', event: getRecord(historySpine.golden_age_hint) },
        { label: 'Crisis', event: getRecord(historySpine.crisis_hint) },
    ];

    const signalCards = useMemo(() => [
        {
            label: 'Entropy',
            value: formatMetric(metrics?.entropy, 3),
            meta: `Stability ${formatMetric(metrics?.stability, 1 + 2)}`,
            icon: Activity,
            tone: 'from-rose-500/20 to-orange-500/10 border-rose-500/20 text-rose-200',
        },
        {
            label: 'Prosperity',
            value: formatMetric(Number(economy.prosperity_index || 0), 2),
            meta: `Trend ${Number(economy.prosperity_trend || 0) >= 0 ? '↑' : '↓'} ${formatMetric(Math.abs(Number(economy.prosperity_trend || 0)), 2)}`,
            icon: Landmark,
            tone: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-200',
        },
        {
            label: 'Chronicles',
            value: String(metrics?.chronicle_count ?? 0),
            meta: `Snapshots ${metrics?.snapshot_count ?? 0}`,
            icon: ScrollText,
            tone: 'from-violet-500/20 to-indigo-500/10 border-violet-500/20 text-violet-100',
        },
        {
            label: 'Population',
            value: (Number(governance.total_population || metrics?.actor_count || 0)).toLocaleString(),
            meta: `Legitimacy ${formatMetric(Number(governance.legitimacy || 0), 2)}`,
            icon: Orbit,
            tone: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-100',
        },
    ], [metrics, civilizationProfile, governance]);

    return (
        <div className="mx-auto max-w-7xl pb-20">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-3 text-amber-300">
                        <Compass size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.35em]">WorldOS / Dossier Console</span>
                    </div>
                    <h1 className="max-w-4xl text-5xl font-black italic tracking-[-0.04em] text-white">
                        Material, culture, belief, and history are now visible as one living profile.
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                        This console reads the new synthesis layer behind the simulation so each universe can be inspected as a civilization,
                        not just a stream of ticks.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={activeUniverseId ?? ''}
                        onChange={(event) => setSelectedUniverseId(Number(event.target.value))}
                        className="min-w-[240px] rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400/40"
                    >
                        {universes.map((universe) => (
                            <option key={universe.id} value={universe.id}>
                                {(universe.name || `Universe ${universe.id}`)} - Tick {universe.current_tick ?? 0}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            void refreshMetrics();
                            void refreshDossier();
                        }}
                        className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-500/20"
                    >
                        <RefreshCcw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-slate-800/60 pb-4">
                {[
                    { id: 'overview', label: 'Overview', icon: Compass },
                    { id: 'civ', label: 'Civilization', icon: Landmark },
                    { id: 'lore', label: 'Lore & Myth', icon: Sparkles },
                    { id: 'history', label: 'History', icon: History },
                    { id: 'library', label: 'Library', icon: Library },
                ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'civ' | 'lore' | 'history' | 'library')}
                            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                isActive
                                    ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                                    : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                            }`}
                        >
                            <TabIcon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'overview' && (
                    <>
                        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {signalCards.map((card, index) => {
                                const Icon = card.icon;
                                return (
                                    <motion.div
                                        key={card.label}
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`rounded-[28px] border bg-gradient-to-br p-6 ${card.tone}`}
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300/80">{card.label}</span>
                                            <Icon size={18} className="text-white/80" />
                                        </div>
                                        <div className="text-4xl font-black tracking-[-0.04em] text-white">{card.value}</div>
                                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300/70">{card.meta}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="grid gap-6 xl:grid-cols-2">
                             <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                                <div className="mb-6 flex items-center gap-2 text-amber-200">
                                    <Landmark size={20} />
                                    <h3 className="text-xl font-black tracking-tight">Current Civil State</h3>
                                </div>
                                <div className="space-y-4">
                                     <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <span className="text-slate-500 text-sm">Designation</span>
                                        <span className="text-white font-bold">{sentenceCase(String(civilizationIdentity.civilization_name || 'Generic Civ'))}</span>
                                     </div>
                                     <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <span className="text-slate-500 text-sm">Governance / Phase</span>
                                        <span className="text-white font-bold">{sentenceCase(String(civilizationIdentity.governance_type))} / {String(civilizationIdentity.phase)}</span>
                                     </div>
                                     <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <span className="text-slate-500 text-sm">Material Base</span>
                                        <span className="text-amber-200 font-bold">{sentenceCase(String(civilizationIdentity.primary_material || materialIdentity.primary_material || 'Stone'))}</span>
                                     </div>
                                     <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-sm">Dominant Faith</span>
                                        <span className="text-violet-300 font-bold">{sentenceCase(String(civilizationIdentity.dominant_religion || dominantReligion.name || 'Primitive Animism'))}</span>
                                     </div>
                                </div>
                             </div>
                             <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                                <div className="mb-6 flex items-center gap-2 text-rose-200">
                                    <History size={20} />
                                    <h3 className="text-xl font-black tracking-tight">Era Context</h3>
                                </div>
                                {eraSummaries.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="text-3xl font-black text-rose-50 underline decoration-rose-500/30 underline-offset-8">
                                            {String(eraSummaries[eraSummaries.length - 1].title)}
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed italic">
                                            &quot;{String(eraSummaries[eraSummaries.length - 1].summary)}&quot;
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-slate-600 text-sm italic">The river of time flows without name yet...</div>
                                )}
                             </div>
                        </div>
                    </>
                )}

                {activeTab === 'civ' && (
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-6">
                            <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                                <div className="mb-6 flex items-center gap-2 text-amber-200">
                                    <Layers3 size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">Material & Ecosystem Identity</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Primary Material</div>
                                        <div className="mt-2 text-xl font-black text-amber-200">{sentenceCase(String(materialIdentity.primary_material || 'unknown'))}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Main Livelihood</div>
                                        <div className="mt-2 text-xl font-black text-emerald-200">{sentenceCase(String(materialIdentity.primary_livelihood || 'unknown'))}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Settlement Code</div>
                                        <div className="mt-2 text-xl font-black text-cyan-200">{sentenceCase(String(materialIdentity.primary_settlement_style || 'unknown'))}</div>
                                    </div>
                                </div>
                                <div className="mt-8 grid gap-6 border-t border-slate-800 pt-6 md:grid-cols-2">
                                     <div>
                                        <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                            <span>Core Settlement Zones</span>
                                            <span className="text-cyan-400/60 lowercase font-mono">Top {coreRegions.length} Active</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {coreRegions.map((region, i) => (
                                                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                                                    <div className="font-bold text-white mb-2 flex justify-between items-center text-sm">
                                                        <span className="truncate">{String(region.name)}</span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                                            <span className="text-[9px] text-cyan-400 opacity-60">ID {String(region.zone_id)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                                                            {sentenceCase(String(region.climate_signature))}
                                                        </span>
                                                        <span className="text-[9px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                            {sentenceCase(String(region.settlement_style))}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[9px] uppercase tracking-tighter text-slate-500">
                                                            <span>Cohesion</span>
                                                            <span className="text-emerald-400">{formatMetric(Number(region.cohesion), 2)}</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500" style={{ width: `${Number(region.cohesion) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="space-y-6">
                                        <div>
                                            <div className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Cultural Artifacts</div>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const artifacts = getRecord(coreRegions[0]?.cultural_artifacts);
                                                    return Object.entries(artifacts).map(([key, value]) => (
                                                        <div key={key} className="rounded-xl border border-violet-500/10 bg-violet-500/5 px-3 py-2">
                                                            <div className="text-[8px] font-black uppercase tracking-widest text-violet-400/60 mb-0.5">{key}</div>
                                                            <div className="text-xs font-bold text-slate-200">{String(value)}</div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                                            <div className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Resource Bias Profile</div>
                                            <div className="flex flex-wrap gap-2">
                                                {getEntries(economy.resource_biases).map(([resource, score]) => (
                                                    <div key={resource} className="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800/40">
                                                        <span className="text-[10px] font-bold text-slate-300">{sentenceCase(resource)}</span>
                                                        <span className="text-[10px] font-mono text-cyan-400">{(Number(score) * 100).toFixed(0)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>

                             <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                                <div className="mb-6 flex items-center gap-2 text-violet-200">
                                    <Shapes size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">Culture Grouping & Social Class</span>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                     <div>
                                        <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cultural Mix</div>
                                        <div className="space-y-3">
                                            {getEntries(cultureIdentity.dominant_memes).slice(0, 4).map(([label, count]) => (
                                                <div key={label} className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                                                    <span className="text-sm font-semibold text-slate-200">{sentenceCase(label)}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                                                            <div className="h-full bg-violet-400" style={{ width: `${(Number(count) * 100)}%` }} />
                                                        </div>
                                                        <span className="font-mono text-xs text-violet-300">{Number(count).toFixed(3)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
                                        <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Demographic Data</div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400">Total Population</span>
                                                <span className="text-xl font-black text-white">{String(governance.total_population || metrics?.actor_count || 0)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400">Culture Diversity</span>
                                                <span className="text-xl font-black text-white">{formatMetric(Number(cultureIdentity.group_diversity || 0), 2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400">Avg. Cohesion</span>
                                                <span className="text-xl font-black text-emerald-400">{formatMetric(Number(beliefOrder.average_cohesion || 0), 3)}</span>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                                <div className="mb-6 flex items-center gap-2 text-rose-300">
                                    <Activity size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">Governance & Logic</span>
                                </div>
                                <div className="space-y-4">
                                     <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Governance Vitality</div>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">Stability</span>
                                                    <span className="text-white font-bold">{formatMetric(Number(governance.stability), 3)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-rose-500" style={{ width: `${Number(governance.stability) * 100}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">Legitimacy</span>
                                                    <span className="text-white font-bold">{formatMetric(Number(governance.legitimacy), 3)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Number(governance.legitimacy) * 100}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">Elite Power</span>
                                                    <span className="text-white font-bold">{formatMetric(Number(governance.elite_power), 3)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-violet-500" style={{ width: `${Number(governance.elite_power) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                     <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Economic Market</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                                <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Food Price</div>
                                                <div className="text-lg font-black text-rose-300">{formatMetric(Number(economy.food_price), 2)}</div>
                                            </div>
                                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                                <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Surplus</div>
                                                <div className="text-lg font-black text-emerald-300">{formatMetric(Number(economy.market_surplus), 2)}</div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'lore' && (
                    <div className="grid gap-6 md:grid-cols-2">
                         <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                             <div className="mb-6 flex items-center gap-2 text-violet-300">
                                <Sparkles size={20} />
                                <h3 className="text-xl font-black tracking-tight uppercase">Mythogenetic Tree</h3>
                             </div>
                             <div className="space-y-4">
                                 {getEntries(myths.top_types).map(([label, count]) => (
                                     <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-slate-800">
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="font-bold text-white text-base">{sentenceCase(label)}</span>
                                             <span className="text-violet-400 font-black">{String(count)}</span>
                                         </div>
                                         <div className="text-xs text-slate-500 italic">Genesis from chronicle patterns</div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                             <div className="mb-6 flex items-center gap-2 text-emerald-300">
                                <ScrollText size={20} />
                                <h3 className="text-xl font-black tracking-tight uppercase">Active Religions</h3>
                             </div>
                             <div className="space-y-6">
                                 <div className="p-6 rounded-[28px] bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Dominant Faith</div>
                                    <h4 className="text-2xl font-black text-white">{sentenceCase(String(dominantReligion.name || 'none'))}</h4>
                                    
                                    <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-emerald-500/10">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sacred Doctrine</div>
                                        <p className="text-sm text-emerald-100/80 leading-relaxed italic">
                                            &quot;{String(dominantReligion.doctrine || 'No records in the Great Library.')}&quot;
                                        </p>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Followers</div>
                                            <div className="text-lg font-bold text-white">{String(dominantReligion.followers || 0)}</div>
                                        </div>
                                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Spread Rate</div>
                                            <div className="text-lg font-bold text-white">{formatMetric(Number(dominantReligion.spread_rate || 0), 2)}</div>
                                        </div>
                                    </div>
                                    
                                    {Array.isArray(dominantReligion.holy_sites) && dominantReligion.holy_sites.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Holy Sites</div>
                                            <div className="flex flex-wrap gap-2">
                                                {dominantReligion.holy_sites.map((site: unknown, i: number) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                                                        {String(site)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

                {activeTab === 'history' && (
                     <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
                        <div className="space-y-6">
                             {historyEvents.map(({ label, event }) => (
                                <div key={label} className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-6">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
                                        <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-400 ring-1 ring-inset ring-cyan-500/20">
                                            TICK {String(event.tick ?? '???')}
                                        </span>
                                    </div>
                                    <div className="text-lg font-black text-white mb-2">{sentenceCase(String(event.type || 'Undefined'))}</div>
                                    <p className="text-sm text-slate-400 leading-relaxed italic line-clamp-3">&quot;{String(event.summary || 'A forgotten shadow in the river of time.')}&quot;</p>
                                </div>
                             ))}
                        </div>
                        <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                             <div className="mb-6 flex items-center gap-2 text-rose-300">
                                <History size={20} />
                                <h3 className="text-xl font-black italic tracking-[-0.02em]">Historical Eras / Timeline</h3>
                             </div>
                             <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-rose-500/60 before:to-transparent">
                                {eraSummaries.map((era, i) => (
                                    <div key={i} className="mb-10 relative">
                                        <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] border-2 border-slate-950" />
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className="text-xs font-black text-rose-400 tracking-widest">{String(era.start_tick)} - {String(era.end_tick)}</span>
                                            <div className="h-px flex-1 bg-slate-800/40" />
                                        </div>
                                        <h4 className="text-xl font-black text-white mb-2 tracking-tight">{String(era.title)}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">{String(era.summary)}</p>
                                    </div>
                                ))}
                             </div>
                        </div>
                     </div>
                )}

                {activeTab === 'library' && (
                    <div className="rounded-[40px] border border-slate-800 bg-slate-950/60 p-20 text-center">
                        <Library size={64} className="mx-auto text-slate-800 mb-6" />
                        <h2 className="text-2xl font-black text-slate-500 tracking-tight">The Library of Alexandria V6</h2>
                        <p className="mt-2 text-slate-600 max-w-sm mx-auto">Publishing automation is currently weaving chronicles into serial chapters. Check back after the next synthesis window.</p>
                    </div>
                )}
            </motion.div>

            {loading && (
                <div className="mt-10 flex items-center justify-center gap-3">
                    <RefreshCcw size={14} className="animate-spin text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                        Synchronizing universe signals...
                    </span>
                </div>
            )}
        </div>
    );
}
