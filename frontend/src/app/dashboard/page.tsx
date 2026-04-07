'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Compass,
    History,
    Landmark,
    Library,
    RefreshCcw,
    Sparkles,
} from 'lucide-react';

import { useUniverse } from '@/contexts/UniverseContext';
import {
    useUniverseDossier,
    useUniverseMetrics,
} from '@/hooks/useUniverseDossier';

import OverviewTab from '@/components/dashboard/tabs/OverviewTab';
import CivilizationTab from '@/components/dashboard/tabs/CivilizationTab';
import LoreTab from '@/components/dashboard/tabs/LoreTab';
import HistoryTab from '@/components/dashboard/tabs/HistoryTab';
import LibraryTab from '@/components/dashboard/tabs/LibraryTab';

type Dictionary = Record<string, unknown>;

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

type TabId = 'overview' | 'civ' | 'lore' | 'history' | 'library';

const TABS: { id: TabId; label: string; icon: typeof Compass }[] = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'civ', label: 'Civilization', icon: Landmark },
    { id: 'lore', label: 'Lore & Myth', icon: Sparkles },
    { id: 'history', label: 'History', icon: History },
    { id: 'library', label: 'Library', icon: Library },
];

export default function DashboardWorldDossierPage() {
    const { activeUniverseId, isLoading: isUniverseListLoading } = useUniverse();

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

    const loading = isUniverseListLoading || isMetricsLoading || isDossierLoading;

    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const historyEvents: Array<{ label: string; event: Dictionary }> = [
        { label: 'Founding', event: getRecord(historySpine.founding_event) },
        { label: 'Golden Age', event: getRecord(historySpine.golden_age_hint) },
        { label: 'Crisis', event: getRecord(historySpine.crisis_hint) },
    ];

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
                {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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
                    <OverviewTab
                        metrics={metrics}
                        economy={economy}
                        governance={governance}
                        civilizationIdentity={civilizationIdentity}
                        materialIdentity={materialIdentity}
                        dominantReligion={dominantReligion}
                        eraSummaries={eraSummaries}
                        formatMetric={formatMetric}
                        sentenceCase={sentenceCase}
                    />
                )}

                {activeTab === 'civ' && (
                    <CivilizationTab
                        metrics={metrics}
                        materialIdentity={materialIdentity}
                        cultureIdentity={cultureIdentity}
                        governance={governance}
                        economy={economy}
                        beliefOrder={beliefOrder}
                        coreRegions={coreRegions}
                        getEntries={getEntries}
                        getRecord={getRecord}
                        formatMetric={formatMetric}
                        sentenceCase={sentenceCase}
                    />
                )}

                {activeTab === 'lore' && (
                    <LoreTab
                        myths={myths}
                        dominantReligion={dominantReligion}
                        getEntries={getEntries}
                        formatMetric={formatMetric}
                        sentenceCase={sentenceCase}
                    />
                )}

                {activeTab === 'history' && (
                    <HistoryTab
                        historyEvents={historyEvents}
                        eraSummaries={eraSummaries}
                        sentenceCase={sentenceCase}
                    />
                )}

                {activeTab === 'library' && <LibraryTab universeId={activeUniverseId} />}
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
