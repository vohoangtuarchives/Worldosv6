'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings2, Save, RotateCcw, ShieldAlert, Zap, Activity, 
    Brain, Flame, Globe, Monitor, Info, AlertTriangle
} from 'lucide-react';
import { useSimulationConfig, SimulationSetting, SimulationValue } from '@/hooks/useSimulationConfig';
import { toast } from 'sonner';

interface ConfigCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    onReset?: () => void;
    accentColor?: string;
}

const accentColorMap: Record<string, { bg: string; text: string; ring: string; border: string }> = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', border: 'bg-amber-500/50' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', border: 'bg-emerald-500/50' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/20', border: 'bg-cyan-500/50' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', ring: 'ring-violet-500/20', border: 'bg-violet-500/50' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', ring: 'ring-rose-500/20', border: 'bg-rose-500/50' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', ring: 'ring-indigo-500/20', border: 'bg-indigo-500/50' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'ring-orange-500/20', border: 'bg-orange-500/50' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', ring: 'ring-slate-500/20', border: 'bg-slate-500/50' },
};

const ConfigCard = ({ title, description, icon, children, onReset, accentColor = "cyan" }: ConfigCardProps) => {
    const colors = accentColorMap[accentColor] ?? accentColorMap.cyan;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-3xl border border-slate-800/50 bg-[#111116] p-6 hover:border-slate-700/50 transition-all duration-500 shadow-2xl shadow-black/40"
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
                    </div>
                </div>
                {onReset && (
                    <button
                        onClick={onReset}
                        className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-white transition-colors"
                        title="Reset to default"
                    >
                        <RotateCcw size={16} />
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {children}
            </div>
        </motion.div>
    );
};

const SettingRow = ({ label, children, detail }: { label: string; children: React.ReactNode; detail?: string }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
            {detail && <span className="text-[10px] font-bold text-slate-600">{detail}</span>}
        </div>
        {children}
    </div>
);

export default function SimulationConfigPage() {
    const { settings, isLoading, updateSettings } = useSimulationConfig();
    const [localChanges, setLocalChanges] = useState<Record<string, SimulationValue>>({});
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingSave, setPendingSave] = useState<SimulationSetting[]>([]);

    const handleInputChange = (key: string, value: SimulationValue) => {
        setLocalChanges(prev => ({ ...prev, [key]: value }));
    };

    const findSetting = (key: string): SimulationSetting | undefined => {
        if (!settings) return undefined;
        return Object.values(settings).flat().find(s => s.key === key);
    };

    const getVal = (key: string, fallback: SimulationValue): SimulationValue => {
        if (localChanges[key] !== undefined) return localChanges[key];
        const s = findSetting(key);
        return s ? s.value : fallback;
    };

    const onSave = async () => {
        if (!settings) return;

        const changedSettings: SimulationSetting[] = [];
        const highRiskKeys = ['simulation.tick_rate', 'simulation.actor_limit'];
        let hasHighRisk = false;

        Object.keys(localChanges).forEach(key => {
            const original = findSetting(key);
            if (original && original.value !== localChanges[key]) {
                changedSettings.push({
                    key,
                    value: localChanges[key],
                    group: original.group
                });
                if (highRiskKeys.includes(key)) hasHighRisk = true;
            }
        });

        if (changedSettings.length === 0) {
            toast.info("No modifications detected.");
            return;
        }

        if (hasHighRisk) {
            setPendingSave(changedSettings);
            setShowConfirm(true);
        } else {
            await updateSettings(changedSettings);
            setLocalChanges({});
        }
    };

    const confirmSave = async () => {
        await updateSettings(pendingSave);
        setLocalChanges({});
        setShowConfirm(false);
        setPendingSave([]);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Protocols...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-32 px-4 sm:px-6">
            {/* Header section as a mini-dashboard */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Settings2 size={12} />
                        Quantum Engine / Core Protocols
                    </motion.div>
                    <h1 className="text-5xl font-black text-white tracking-tighter sm:text-6xl">
                        Configuration <span className="text-slate-500">Center</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed">
                        Điều phối các nếp gấp vật lý và dòng chảy nhân sinh. Mọi thay đổi sẽ tác động trực tiếp đến cấu trúc 17 chiều của Multiverse.
                    </p>
                </div>

                <div className="flex items-center gap-4 self-start lg:self-end">
                    <button 
                        onClick={() => setLocalChanges({})}
                        className="flex items-center gap-2 px-6 py-4 rounded-3xl bg-slate-800/40 border border-slate-700/50 text-slate-300 font-black hover:text-white transition-all hover:bg-slate-800/60"
                    >
                        <RotateCcw size={18} />
                        Discard
                    </button>
                    <button 
                        onClick={onSave}
                        className="flex items-center gap-2 px-8 py-4 rounded-3xl bg-white text-black font-black hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/10"
                    >
                        <Save size={18} />
                        Save Protocols
                    </button>
                </div>
            </div>

            {/* Main Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* 1. GENERAL PROTOCOLS */}
                <ConfigCard 
                    title="General" 
                    description="Cấu hình định danh vũ trụ"
                    icon={<Globe size={20} />}
                    accentColor="indigo"
                >
                    <SettingRow label="Universe Name">
                        <input 
                            type="text"
                            value={(getVal('general.name', 'Standard Multiverse') as string)}
                            onChange={(e) => handleInputChange('general.name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                        />
                    </SettingRow>
                    <SettingRow label="Observation Seed" detail="Primacy Value">
                        <input 
                            type="text"
                            value={(getVal('general.seed', '0x99AFA') as string)}
                            onChange={(e) => handleInputChange('general.seed', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono text-xs transition-all"
                        />
                    </SettingRow>
                </ConfigCard>

                {/* 2. PHYSICS & ENVIRONMENT */}
                <ConfigCard 
                    title="World Physics" 
                    description="Quy luật tự nhiên & Khí hậu"
                    icon={<Zap size={20} />}
                    accentColor="cyan"
                >
                    <SettingRow label="Stability Factor" detail={`${Math.round((getVal('chaos.dampening_stability_factor', 0.6) as number) * 100)}%`}>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={(getVal('chaos.dampening_stability_factor', 0.6) as number)}
                            onChange={(e) => handleInputChange('chaos.dampening_stability_factor', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                    </SettingRow>
                    <SettingRow label="Resource Regeneration" detail="Normal Flow">
                        <select 
                            value={(getVal('intelligence.resource_regen_rate', 2) as number)}
                            onChange={(e) => handleInputChange('intelligence.resource_regen_rate', parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                        >
                            <option value={1}>Abundant</option>
                            <option value={2}>Standard</option>
                            <option value={3}>Scarce</option>
                            <option value={5}>Catastrophic</option>
                        </select>
                    </SettingRow>
                </ConfigCard>

                {/* 3. SIMULATION KERNEL */}
                <ConfigCard 
                    title="Simulation" 
                    description="Tần số & Tốc độ thời gian"
                    icon={<Activity size={20} />}
                    accentColor="emerald"
                >
                    <SettingRow label="Tick Rate (ms)" detail="Frequency">
                        <div className="flex items-center gap-3">
                            <input 
                                type="number"
                                value={(getVal('simulation.tick_rate', 1000) as number)}
                                onChange={(e) => handleInputChange('simulation.tick_rate', parseInt(e.target.value))}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                            />
                            <span className="text-slate-600 text-[10px] font-black uppercase">ms/tick</span>
                        </div>
                    </SettingRow>
                    <SettingRow label="Population Ceiling" detail="Actor Limit">
                        <div className="relative">
                            <input 
                                type="number"
                                value={(getVal('simulation.actor_limit', 50) as number)}
                                onChange={(e) => handleInputChange('simulation.actor_limit', parseInt(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                            />
                            <Monitor size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" />
                        </div>
                    </SettingRow>
                </ConfigCard>

                {/* 4. COGNITIVE & PSYCHOLOGY */}
                <ConfigCard 
                    title="Psychology" 
                    description="Trí tuệ & Phân tích hành vi"
                    icon={<Brain size={20} />}
                    accentColor="rose"
                >
                    <SettingRow label="Trauma Threshold" detail="Mental Resilience">
                        <input 
                            type="range" min="0" max="100" step="1"
                            value={(getVal('psychology.trauma_threshold', 75) as number)}
                            onChange={(e) => handleInputChange('psychology.trauma_threshold', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500"
                        />
                    </SettingRow>
                    <SettingRow label="Metabolism Base" detail="Energy Consumption">
                        <div className="flex gap-2">
                            {[0.2, 0.5, 0.8].map(v => (
                                <button 
                                    key={v}
                                    onClick={() => handleInputChange('intelligence.metabolism_base', v)}
                                    className={`flex-1 py-3 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${
                                        getVal('intelligence.metabolism_base', 0.5) === v 
                                        ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                                    }`}
                                >
                                    {v === 0.2 ? 'Hyper' : v === 0.5 ? 'Bio' : 'Slow'}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                </ConfigCard>

                {/* 5. EVENTS & ENTROPY */}
                <ConfigCard 
                    title="Entropy" 
                    description="Dị biệt & Sự sụp đổ"
                    icon={<Flame size={20} />}
                    accentColor="orange"
                >
                    <SettingRow label="Drift Ratio (Entropy Floor)" detail="Drift">
                        <input 
                            type="range" min="0" max="0.01" step="0.001"
                            value={(getVal('worldos.entropy_floor', 0.001) as number)}
                            onChange={(e) => handleInputChange('worldos.entropy_floor', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                        />
                    </SettingRow>
                    <div className="mt-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex gap-4">
                        <AlertTriangle size={24} className="text-orange-500 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            <strong className="text-orange-400">CAUTION:</strong> Tăng giá trị Drift Ratio sẽ đẩy nhanh quá trình sụp đổ tầng không (Eschaton) của Universe.
                        </p>
                    </div>
                </ConfigCard>

                {/* 6. SYSTEM DISPLAY */}
                <ConfigCard 
                    title="Observability" 
                    description="Giao diện theo dõi"
                    icon={<Monitor size={20} />}
                    accentColor="slate"
                >
                    <SettingRow label="Chart Refresh (Ticks)">
                        <input 
                            type="number"
                            value={(getVal('display.chart_interval', 10) as number)}
                            onChange={(e) => handleInputChange('display.chart_interval', parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none"
                        />
                    </SettingRow>
                    <div className="flex items-center justify-between p-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Show Anomaly Markers</span>
                        <div 
                            onClick={() => handleInputChange('display.show_anomalies', !getVal('display.show_anomalies', true))}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${getVal('display.show_anomalies', true) ? 'bg-cyan-500' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${getVal('display.show_anomalies', true) ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </ConfigCard>

            </div>

            {/* Confirmation Overlay */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirm(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg rounded-[2.5rem] border border-rose-500/20 bg-[#0c0c10] p-10 overflow-hidden shadow-2xl shadow-rose-500/10"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                            
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className="p-5 rounded-[2rem] bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
                                    <ShieldAlert size={42} />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-white tracking-tight">Critical Confirmation</h2>
                                    <p className="text-slate-400 text-sm leading-relaxed px-4">
                                        Bạn đang lưu trữ các tham số nhạy cảm (Tick Rate / Actor Limit). 
                                        Việc này có thể ảnh hưởng trực tiếp đến sự ổn định của hệ thống mô phỏng.
                                    </p>
                                </div>

                                <div className="w-full bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-3">
                                    {pendingSave.map(s => (
                                        <div key={s.key} className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-slate-500">{s.key}</span>
                                            <span className="text-sm font-black text-white">{String(s.value)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 w-full mt-4">
                                    <button 
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmSave}
                                        className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
                                    >
                                        Authorize Change
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick API Link */}
            <div className="mt-12 flex justify-center">
                <a 
                    href="/dashboard/settings" 
                    className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 transition-all group"
                >
                    <Info size={16} />
                    <span className="text-xs font-bold">Cần cấu hình AI Key? Đi đến AI Runtime Settings</span>
                </a>
            </div>
        </div>
    );
}
