'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Save, Settings2, ShieldCheck, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';

type DriverName = 'pool' | 'zai' | 'openai' | 'openrouter' | 'local' | 'gemini' | 'qwen' | string;
type FeatureKey = 'analytical' | 'narrative' | 'lab' | 'decision';

interface AiSettingRecord {
    key: string;
    value: unknown;
    group: string;
    description?: string | null;
    is_secret: boolean;
}

interface FeatureProfile {
    driver: DriverName;
    model: string;
    max_tokens: string;
    tier: 'any' | 'free' | 'premium';
    model_group: string;
}

interface DiagnosticsResult {
    status: 'success' | 'error';
    driver: string;
    latency_ms: number;
    response?: string | null;
    error?: string;
    checked_at: string;
}

const featureKeys: FeatureKey[] = ['analytical', 'narrative', 'lab', 'decision'];
const knownDrivers: DriverName[] = ['pool', 'zai', 'openai', 'gemini', 'openrouter', 'local', 'qwen'];

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function createFeatureProfile(driver: DriverName = 'pool'): FeatureProfile {
    return {
        driver,
        model: '',
        max_tokens: '',
        tier: 'any',
        model_group: '',
    };
}

function asFeatureProfile(value: unknown, fallbackDriver: DriverName = 'pool'): FeatureProfile {
    if (typeof value === 'string') {
        return createFeatureProfile(value || fallbackDriver);
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return createFeatureProfile(fallbackDriver);
    }

    const data = value as Record<string, unknown>;
    const tier = asString(data.tier, 'any');

    return {
        driver: asString(data.driver, fallbackDriver),
        model: asString(data.model),
        max_tokens: data.max_tokens === null || data.max_tokens === undefined ? '' : String(data.max_tokens),
        tier: tier === 'free' || tier === 'premium' ? tier : 'any',
        model_group: asString(data.model_group),
    };
}

function toFeaturePayload(profile: FeatureProfile) {
    return {
        driver: profile.driver,
        ...(profile.model.trim() ? { model: profile.model.trim() } : {}),
        ...(profile.max_tokens.trim() ? { max_tokens: Number(profile.max_tokens) } : {}),
        ...(profile.tier !== 'any' ? { tier: profile.tier } : {}),
        ...(profile.model_group.trim() ? { model_group: profile.model_group.trim() } : {}),
    };
}

export default function AiSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [drivers, setDrivers] = useState<DriverName[]>(knownDrivers);
    const [defaultDriver, setDefaultDriver] = useState<DriverName>('pool');
    const [features, setFeatures] = useState<Record<FeatureKey, FeatureProfile>>({
        analytical: createFeatureProfile('pool'),
        narrative: createFeatureProfile('pool'),
        lab: createFeatureProfile('pool'),
        decision: createFeatureProfile('pool'),
    });
    const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
    const [diagnosticsDriver, setDiagnosticsDriver] = useState<DriverName>('pool');
    const [diagnosticsPrompt, setDiagnosticsPrompt] = useState('Ping AI diagnostics. Reply with one short readiness sentence.');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const driverOptions = useMemo(() => {
        const base = new Set<DriverName>(knownDrivers);
        drivers.forEach((driver) => base.add(driver));
        return Array.from(base);
    }, [drivers]);

    const loadSettings = async () => {
        setIsLoading(true);

        try {
            const [settingsResponse, driversResponse] = await Promise.all([
                api.get<AiSettingRecord[]>('/ai-settings'),
                api.get<DriverName[]>('/ai-settings/drivers'),
            ]);

            const recordMap = new Map(settingsResponse.data.map((record) => [record.key, record.value]));
            const resolvedDrivers = Array.from(new Set<DriverName>(['pool', ...knownDrivers, ...driversResponse.data]));

            setDrivers(resolvedDrivers);
            setDefaultDriver(asString(recordMap.get('default'), 'pool'));
            setFeatures({
                analytical: asFeatureProfile(recordMap.get('features.analytical'), 'pool'),
                narrative: asFeatureProfile(recordMap.get('features.narrative'), 'pool'),
                lab: asFeatureProfile(recordMap.get('features.lab'), 'pool'),
                decision: asFeatureProfile(recordMap.get('features.decision'), 'pool'),
            });
            setDiagnosticsDriver(asString(recordMap.get('default'), 'pool'));
        } catch (error) {
            console.error('Failed to load AI settings:', error);
            toast.error('Failed to load AI settings.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadSettings();
    }, []);

    const saveSetting = async (key: string, value: unknown, group?: string) => {
        await api.post('/ai-settings/update', {
            key,
            value,
            group,
        });
    };

    const updateFeature = (feature: FeatureKey, patch: Partial<FeatureProfile>) => {
        setFeatures((current) => ({
            ...current,
            [feature]: {
                ...current[feature],
                ...patch,
            },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            await saveSetting('use_pool', true, 'general');
            await saveSetting('default', defaultDriver, 'general');

            await Promise.all(
                featureKeys.map((feature) =>
                    saveSetting(`features.${feature}`, toFeaturePayload(features[feature]), 'feature')
                )
            );

            await api.post('/ai-settings/sync');
            toast.success('AI pool routing updated.');
            await loadSettings();
        } catch (error) {
            console.error('Failed to save AI settings:', error);
            toast.error('Failed to save AI settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImport = async () => {
        setIsSaving(true);

        try {
            await api.post('/ai-settings/import');
            toast.success('Imported pool-first defaults from config/ai.php.');
            await loadSettings();
        } catch (error) {
            console.error('Failed to import AI settings:', error);
            toast.error('Failed to import AI settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiagnostics = async () => {
        setIsTesting(true);

        try {
            const response = await api.post<DiagnosticsResult>('/ai-settings/diagnostics', {
                driver: diagnosticsDriver,
                prompt: diagnosticsPrompt,
            });

            setDiagnostics(response.data);
            toast.success(`${diagnosticsDriver.toUpperCase()} diagnostics completed.`);
        } catch (error: unknown) {
            const payload = (error as { response?: { data?: DiagnosticsResult } }).response?.data;
            if (payload) {
                setDiagnostics(payload);
            }
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 text-cyan-400 mb-2"
                    >
                        <Settings2 size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Control / AI Runtime</span>
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-tight">AI Settings</h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-2xl">
                        Tất cả request AI đi qua `AiGateway` và `AI Pool`. Trang này chỉ cấu hình rule định tuyến cho từng service, không còn lưu fixed credentials cũ.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleImport}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCcw size={18} />
                        Import Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-black hover:bg-cyan-400 transition-all disabled:opacity-50"
                    >
                        <Save size={18} />
                        Save Routing
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck size={18} className="text-cyan-400" />
                            <h2 className="text-lg font-black text-white">Pool Routing</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <label className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Default Pool Route</span>
                                <select
                                    value={defaultDriver}
                                    onChange={(event) => setDefaultDriver(event.target.value)}
                                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                >
                                    {driverOptions.map((driver) => (
                                        <option key={driver} value={driver}>
                                            {driver.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pool Status</span>
                                <div className="w-full px-4 py-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-sm font-bold text-cyan-400">
                                    Enabled permanently through AiGateway
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                            {featureKeys.map((feature) => (
                                <div key={feature} className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            Service: {feature}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Mọi request đều qua AI Pool. Trường `driver` ở đây hoạt động như provider filter, hoặc chọn `POOL` để cho phép xoay toàn bộ pool.
                                        </p>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Provider Filter</span>
                                        <select
                                            value={features[feature].driver}
                                            onChange={(event) => updateFeature(feature, { driver: event.target.value })}
                                            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                        >
                                            {driverOptions.map((driver) => (
                                                <option key={driver} value={driver}>
                                                    {driver.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="space-y-2 block">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Model Override</span>
                                            <input
                                                value={features[feature].model}
                                                onChange={(event) => updateFeature(feature, { model: event.target.value })}
                                                placeholder="GLM-4.5-Flash"
                                                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                            />
                                        </label>

                                        <label className="space-y-2 block">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Max Tokens</span>
                                            <input
                                                value={features[feature].max_tokens}
                                                onChange={(event) => updateFeature(feature, { max_tokens: event.target.value.replace(/[^\d]/g, '') })}
                                                placeholder="1200"
                                                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="space-y-2 block">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pool Tier</span>
                                            <select
                                                value={features[feature].tier}
                                                onChange={(event) => updateFeature(feature, { tier: event.target.value as FeatureProfile['tier'] })}
                                                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                            >
                                                <option value="any">Any Tier</option>
                                                <option value="free">Free Only</option>
                                                <option value="premium">Premium Only</option>
                                            </select>
                                        </label>

                                        <label className="space-y-2 block">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pool Model Group</span>
                                            <input
                                                value={features[feature].model_group}
                                                onChange={(event) => updateFeature(feature, { model_group: event.target.value })}
                                                placeholder="flash / cheap / reasoning"
                                                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <TestTube2 size={18} className="text-emerald-400" />
                            <h2 className="text-lg font-black text-white">Runtime Diagnostics</h2>
                        </div>

                        <div className="space-y-4 mb-5">
                            <label className="space-y-2 block">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pool Provider Filter</span>
                                <select
                                    value={diagnosticsDriver}
                                    onChange={(event) => setDiagnosticsDriver(event.target.value)}
                                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                >
                                    {driverOptions.map((driver) => (
                                        <option key={driver} value={driver}>
                                            {driver.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-2 block">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Prompt</span>
                                <input
                                    value={diagnosticsPrompt}
                                    onChange={(event) => setDiagnosticsPrompt(event.target.value)}
                                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                                />
                            </label>
                        </div>

                        <button
                            onClick={handleDiagnostics}
                            disabled={isTesting || isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                        >
                            <TestTube2 size={18} />
                            {isTesting ? `Testing ${diagnosticsDriver.toUpperCase()}...` : 'Run Probe'}
                        </button>

                        <div className="mt-5 rounded-2xl bg-slate-950/60 border border-slate-800 p-4 min-h-[180px]">
                            {diagnostics ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                                        <span className={diagnostics.status === 'success' ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                                            {diagnostics.status}
                                        </span>
                                        <span className="text-slate-500">{diagnostics.latency_ms} ms</span>
                                    </div>
                                    <div className="text-sm text-slate-300 font-semibold">{diagnostics.driver.toUpperCase()}</div>
                                    <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                                        {diagnostics.response || diagnostics.error || 'No output returned.'}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 leading-relaxed">
                                    Chạy probe qua `AiGateway` để xác nhận provider filter trong pool đang reachable từ Laravel runtime.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-fuchsia-500/10 bg-fuchsia-500/5 p-6">
                        <h3 className="text-white font-black mb-2">Pool-first note</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Fixed credentials cũ đã bị loại khỏi Settings. Nếu pool không có key phù hợp, request sẽ fail rõ ràng thay vì âm thầm fallback về provider key cố định.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
