'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    RefreshCcw,
    Search,
    Filter,
    Trash2,
    ExternalLink,
    Clock,
    Zap,
    Cpu
} from 'lucide-react';
import { useAiLogs, useAiStats, AiLog } from '@/hooks/useAiLogs';
import { LogStatusBadge } from '@/components/ui/intelligence/LogStatusBadge';
import LogDetailModal from '@/components/ui/intelligence/LogDetailModal';
import { toast } from 'sonner';
import api from '@/lib/api';

function extractString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getLogInputRecord(input: AiLog['input']): Record<string, unknown> | null {
    return input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : null;
}

function resolveLogModel(log: AiLog): string {
    const input = getLogInputRecord(log.input);

    return (
        extractString(log.model) ??
        extractString(input?.model_name) ??
        extractString(input?.model) ??
        'unknown-model'
    );
}

export default function NarrativeLoomMonitor() {
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterDriver, setFilterDriver] = useState<string>('');
    const [search, setSearch] = useState('');
    const [selectedLog, setSelectedLog] = useState<AiLog | null>(null);
    const [usePool, setUsePool] = useState<boolean | null>(null);

    const {
        logs,
        pagination,
        isLoading,
        clearLogs,
        mutate: mutateLogs
    } = useAiLogs({
        page,
        status: filterStatus,
        driver: filterDriver,
        search,
        limit: 15
    });

    const {
        stats: aiStats,
        isLoading: isStatsLoading,
        mutate: mutateStats
    } = useAiStats();

    const handleRefresh = () => {
        mutateLogs();
        mutateStats();
    };

    // Server-side filtering is now handled by the hook
    const displayLogs = logs;

    useEffect(() => {
        let active = true;

        void api.get<{ key: string; value: unknown }[]>('/ai-settings')
            .then((response) => {
                if (!active) {
                    return;
                }

                const usePoolRecord = response.data.find((record) => record.key === 'use_pool');
                const value = usePoolRecord?.value;
                setUsePool(typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true');
            })
            .catch(() => {
                if (active) {
                    setUsePool(null);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const handleClear = async () => {
        if (confirm('Delete all diagnostic intelligence logs? This action cannot be undone.')) {
            try {
                await clearLogs();
                toast.success('Intelligence logs purged.');
            } catch { }
        }
    };

    // Stats are now fetched from the backend
    const avgLatency = aiStats?.avg_latency ?? 0;
    const successRate = aiStats?.success_rate ?? 0;
    const totalRequests = aiStats?.total_requests ?? 0;

    const routedProviders = useMemo(
        () => aiStats?.providers?.map(p => p.name.toUpperCase()) ?? [],
        [aiStats]
    );
    const providersCount = routedProviders.length;
    const primaryModel = aiStats?.models?.[0]?.name ?? 'idle';

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(10); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 text-cyan-400 mb-2"
                    >
                        <Activity size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Surveillance / Intelligence</span>
                    </motion.div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic">Narrative Loom Monitor</h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-xl leading-relaxed">
                        Real-time diagnostic stream of all civilizational logic requests processed by the Loom&apos;s heterogeneous AI nodes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
                        title="Force Synchronize"
                    >
                        <RefreshCcw size={20} className={isLoading || isStatsLoading ? 'animate-spin' : 'group-active:rotate-180 transition-transform duration-500'} />
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-6 py-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                        <Trash2 size={18} />
                        Purge Memory
                    </button>
                </div>
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-800/50 hover:border-cyan-500/30 transition-all group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <Cpu size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Routing Mode</span>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight">
                        {usePool === null ? 'Syncing' : usePool ? 'AI Pool' : 'Direct'}
                    </div>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed">
                        Providers: {routedProviders.length > 0 ? routedProviders.join(' / ') : 'None'}<br />
                        Primary model: {primaryModel}
                    </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-800/50">
                    <div className="flex items-center gap-4 mb-3 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                        <Zap size={18} className="text-amber-400" />
                        Avg Latency
                    </div>
                    <div className="text-4xl font-black text-white tracking-tight">{avgLatency}<span className="text-lg text-slate-500 ml-1">ms</span></div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-800/50">
                    <div className="flex items-center gap-4 mb-3 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                        <Activity size={18} className="text-emerald-400" />
                        Success Rate
                    </div>
                    <div className="text-4xl font-black text-white tracking-tight">{successRate}<span className="text-lg text-slate-500 ml-1">%</span></div>
                </div>

                <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity size={12} /> Volume Metrics
                        </p>
                        <div className="space-y-4 mt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Requests</span>
                                <span className="text-xl font-black text-white">{totalRequests.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Providers</span>
                                <span className="text-xl font-black text-white">{providersCount}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-cyan-500/10">
                        <p className="text-[9px] font-medium text-slate-400 italic">
                            Live flow of civilizational decisions
                        </p>
                    </div>
                </div>
            </div>

            {/* Synthesis Discovery Ticker (Experimental) */}
            <div className="mb-8 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center gap-6 overflow-hidden whitespace-nowrap">
                <div className="flex items-center gap-2 text-violet-400 font-black text-[10px] uppercase tracking-widest flex-shrink-0">
                    <Zap size={14} />
                </div>
                <div className="flex gap-12 animate-marquee">
                    <span className="text-[11px] text-slate-400 font-medium">Vùng [Oceanic-3] mở khóa: <b className="text-violet-200 uppercase tracking-tighter">Thủy lễ (Tide Rituals)</b></span>
                    <span className="text-[11px] text-slate-400 font-medium">Dân cư [Highlands] thích nghi: <b className="text-violet-200 uppercase tracking-tighter">Thợ mỏ (+Sức mạnh)</b></span>
                    <span className="text-[11px] text-slate-400 font-medium">Tôn giáo mới trỗi dậy: <b className="text-violet-200 uppercase tracking-tighter">Đạo của Đá Ngầm</b></span>
                    <span className="text-[11px] text-slate-400 font-medium">Phát hiện vật liệu: <b className="text-violet-200 uppercase tracking-tighter">Đồng thiếc (Bronze)</b></span>
                </div>
            </div>

            {/* Controls & Table */}
            <div className="bg-[#0a0a0c]/80 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-md">
                {/* Internal Filters */}
                <div className="p-6 flex flex-wrap items-center gap-4 border-b border-slate-800/50 bg-slate-900/30">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Scan by request, service, driver, or model..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-500" />
                        <select
                            value={filterDriver}
                            onChange={(e) => setFilterDriver(e.target.value)}
                            className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 focus:outline-none transition-all uppercase tracking-widest"
                        >
                            <option value="">ALL DRIVERS</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="zai">ZAI</option>
                            <option value="local">Local</option>
                        </select>
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 focus:outline-none transition-all uppercase tracking-widest"
                    >
                        <option value="">ALL STATUS</option>
                        <option value="success">Operational</option>
                        <option value="error">Malfunction</option>
                    </select>
                </div>

                {/* Table Section */}
                <div className="relative overflow-x-auto">
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Scanning Grid...</span>
                            </div>
                        </div>
                    )}

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 bg-white/5">
                                <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Transaction</th>
                                <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Service</th>
                                <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Driver / Model</th>
                                <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Latency</th>
                                <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {displayLogs.map((log: AiLog) => (
                                <tr
                                    key={log.id}
                                    className="group hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                                                {log.id}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-white group-hover:translate-x-1 transition-transform">TRANS_{log.id}</span>
                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                                                    <Clock size={10} />
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-2">
                                            <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                                                {log.feature}
                                            </span>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                Service Route
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.driver === 'local' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                                                {log.driver.toUpperCase()}
                                            </div>
                                            <div className="text-[11px] font-mono text-cyan-300 break-all">
                                                {resolveLogModel(log)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-mono font-bold text-slate-300">{log.latency_ms}</div>
                                            <div className="h-1 w-12 rounded-full bg-slate-800 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${log.latency_ms > 2000 ? 'bg-rose-500' : log.latency_ms > 1000 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(100, (log.latency_ms / 3000) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <LogStatusBadge status={log.status} />
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2.5 rounded-xl hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 transition-all"
                                            title="Inspect Transaction"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {displayLogs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
                                                <Activity size={32} />
                                            </div>
                                            <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Signal Detected in Frequency</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="p-6 border-t border-slate-800/50 bg-slate-900/10 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Showing Page {pagination.current_page} of {pagination.last_page} • Total Logs: {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                            >
                                Previous Flux
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                                disabled={page === pagination.last_page}
                                className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                            >
                                Next Flux
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Inspect Modal */}
            <LogDetailModal
                log={selectedLog}
                open={!!selectedLog}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
}
