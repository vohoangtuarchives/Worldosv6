'use client';

import { Activity, Layers3, Shapes } from 'lucide-react';

import type { UniverseMetrics } from '@/hooks/useUniverseDossier';

type Dictionary = Record<string, unknown>;

interface DossierGovernance extends Dictionary {
    stability?: number;
    legitimacy?: number;
    elite_power?: number;
    total_population?: number;
    authority_intensity?: number;
}

interface DossierEconomy extends Dictionary {
    prosperity_index?: number;
    prosperity_trend?: number;
    food_price?: number;
    market_surplus?: number;
    resource_biases?: Record<string, number>;
}

interface CivilizationTabProps {
    metrics: UniverseMetrics | undefined;
    materialIdentity: Dictionary;
    cultureIdentity: Dictionary;
    governance: DossierGovernance;
    economy: DossierEconomy;
    beliefOrder: Dictionary;
    coreRegions: Dictionary[];
    getEntries: (value: unknown) => Array<[string, number]>;
    getRecord: <T = Dictionary>(value: unknown) => T;
    formatMetric: (value: number | undefined, digits?: number) => string;
    sentenceCase: (value: string | undefined | null) => string;
}

export default function CivilizationTab({
    metrics,
    materialIdentity,
    cultureIdentity,
    governance,
    economy,
    beliefOrder,
    coreRegions,
    getEntries,
    getRecord,
    formatMetric,
    sentenceCase,
}: CivilizationTabProps) {
    return (
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
    );
}
