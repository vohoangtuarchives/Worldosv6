'use client';

import { motion } from 'framer-motion';
import { Activity, Landmark, History, ScrollText, Orbit } from 'lucide-react';

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

interface OverviewTabProps {
    metrics: UniverseMetrics | undefined;
    economy: DossierEconomy;
    governance: DossierGovernance;
    civilizationIdentity: Dictionary;
    materialIdentity: Dictionary;
    dominantReligion: Dictionary;
    eraSummaries: unknown[];
    formatMetric: (value: number | undefined, digits?: number) => string;
    sentenceCase: (value: string | undefined | null) => string;
}

export default function OverviewTab({
    metrics,
    economy,
    governance,
    civilizationIdentity,
    materialIdentity,
    dominantReligion,
    eraSummaries,
    formatMetric,
    sentenceCase,
}: OverviewTabProps) {
    const signalCards = [
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
    ];

    return (
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
                                {String((eraSummaries[eraSummaries.length - 1] as Dictionary).title)}
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed italic">
                                &quot;{String((eraSummaries[eraSummaries.length - 1] as Dictionary).summary)}&quot;
                            </p>
                        </div>
                    ) : (
                        <div className="text-slate-600 text-sm italic">The river of time flows without name yet...</div>
                    )}
                 </div>
            </div>
        </>
    );
}
