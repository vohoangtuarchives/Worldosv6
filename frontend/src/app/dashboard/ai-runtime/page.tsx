'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Cpu,
  Database,
  Download,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  ShieldCheck,
  TestTube2,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import KeyForm from '@/components/ui/key-pool/KeyForm';
import KeyTable from '@/components/ui/key-pool/KeyTable';
import StatsOverview from '@/components/ui/key-pool/StatsOverview';
import {
  asFeatureProfile,
  asString,
  buildDriverOptions,
  toFeaturePayload,
  useAiDrivers,
  useAiSettings,
  useCreateProviderModel,
  useDeleteProviderModel,
  useExportProviderModels,
  useImportAiSettings,
  useImportLoomAgents,
  useImportProviderModels,
  useKeyPool,
  useLoomAgents,
  useProviderModels,
  useRunAiDiagnostics,
  useSyncAiSettings,
  useUpdateAiSetting,
  useUpdateProviderModel,
} from '@/features/admin/hooks';
import type {
  AiDiagnosticsResult,
  AiFeatureProfile,
  AiKey,
  AiKeyPayload,
  AiProviderModel,
  DriverName,
  LoomAgentRecord,
} from '@/features/admin/types';

type FeatureKey = 'analytical' | 'narrative' | 'lab' | 'decision';
type RuntimeTab = 'routing' | 'loom' | 'providers' | 'keys';

const featureKeys: FeatureKey[] = ['analytical', 'narrative', 'lab', 'decision'];

function RuntimeCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">{icon}</div>
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function LoomAgentEditor({
  record,
  providerModels,
  onSave,
  isSaving,
}: {
  record: LoomAgentRecord;
  providerModels: AiProviderModel[];
  onSave: (value: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}) {
  const initialValue =
    record.value && typeof record.value === 'object' && !Array.isArray(record.value)
      ? (record.value as Record<string, unknown>)
      : {};
  const [provider, setProvider] = useState(asString(initialValue.provider));
  const [model, setModel] = useState(asString(initialValue.model));
  const [tier, setTier] = useState(asString(initialValue.tier));

  const modelsForProvider = providerModels.filter(
    (item) => item.provider === provider && item.is_active,
  );

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-white">
            {record.agent_name || record.key.replace('loom_agents.', '')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{record.description || 'Loom agent route'}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Loom
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Provider
          </span>
          <input
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Model
          </span>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
          >
            <option value="">Select model</option>
            {modelsForProvider.map((item) => (
              <option key={item.id} value={item.model_name}>
                {item.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Tier
          </span>
          <select
            value={tier}
            onChange={(event) => setTier(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
          >
            <option value="">Any tier</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <button
        onClick={() =>
          onSave({
            ...(provider ? { provider } : {}),
            ...(model ? { model } : {}),
            ...(tier ? { tier } : {}),
          })
        }
        disabled={isSaving}
        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-cyan-400 disabled:opacity-50"
      >
        <Save size={16} />
        Save Agent Route
      </button>
    </div>
  );
}

export default function AiRuntimePage() {
  const [activeTab, setActiveTab] = useState<RuntimeTab>('routing');
  const [defaultDriverOverride, setDefaultDriverOverride] = useState<DriverName | null>(null);
  const [featureOverrides, setFeatureOverrides] = useState<
    Record<FeatureKey, Partial<AiFeatureProfile>>
  >({
    analytical: {},
    narrative: {},
    lab: {},
    decision: {},
  });
  const [diagnostics, setDiagnostics] = useState<AiDiagnosticsResult | null>(null);
  const [diagnosticsDriverOverride, setDiagnosticsDriverOverride] =
    useState<DriverName | null>(null);
  const [diagnosticsPrompt, setDiagnosticsPrompt] = useState(
    'Ping AI diagnostics. Reply with one short readiness sentence.',
  );
  const [editingProviderModel, setEditingProviderModel] = useState<Partial<AiProviderModel> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AiKey | null>(null);

  const { settings, isLoading: isLoadingSettings } = useAiSettings();
  const { drivers } = useAiDrivers();
  const { loomAgents, isLoading: isLoadingLoom } = useLoomAgents();
  const { providerModels, isLoading: isLoadingProviderModels } = useProviderModels();
  const {
    keys,
    isLoading: isLoadingKeys,
    addKey,
    updateKey,
    deleteKey,
  } = useKeyPool();

  const updateAiSetting = useUpdateAiSetting();
  const syncAiSettings = useSyncAiSettings();
  const importAiSettings = useImportAiSettings();
  const importLoomAgents = useImportLoomAgents();
  const diagnosticsMutation = useRunAiDiagnostics();
  const createProviderModel = useCreateProviderModel();
  const updateProviderModel = useUpdateProviderModel();
  const deleteProviderModel = useDeleteProviderModel();
  const exportProviderModels = useExportProviderModels();
  const importProviderModels = useImportProviderModels();

  const driverOptions = buildDriverOptions(drivers);
  const isLoading =
    isLoadingSettings ||
    isLoadingLoom ||
    isLoadingProviderModels ||
    isLoadingKeys;
  const recordMap = new Map(settings.map((record) => [record.key, record.value]));
  const baseDefaultDriver = asString(recordMap.get('default'), 'pool');
  const baseFeatures: Record<FeatureKey, AiFeatureProfile> = {
    analytical: asFeatureProfile(recordMap.get('features.analytical'), 'pool'),
    narrative: asFeatureProfile(recordMap.get('features.narrative'), 'pool'),
    lab: asFeatureProfile(recordMap.get('features.lab'), 'pool'),
    decision: asFeatureProfile(recordMap.get('features.decision'), 'pool'),
  };
  const defaultDriver = defaultDriverOverride ?? baseDefaultDriver;
  const diagnosticsDriver = diagnosticsDriverOverride ?? baseDefaultDriver;
  const features: Record<FeatureKey, AiFeatureProfile> = {
    analytical: { ...baseFeatures.analytical, ...featureOverrides.analytical },
    narrative: { ...baseFeatures.narrative, ...featureOverrides.narrative },
    lab: { ...baseFeatures.lab, ...featureOverrides.lab },
    decision: { ...baseFeatures.decision, ...featureOverrides.decision },
  };

  const updateFeature = (feature: FeatureKey, patch: Partial<AiFeatureProfile>) => {
    setFeatureOverrides((current) => ({
      ...current,
      [feature]: { ...(current[feature] ?? {}), ...patch },
    }));
  };

  const handleSaveRouting = async () => {
    await updateAiSetting.mutateAsync({
      key: 'use_pool',
      value: true,
      group: 'general',
    });
    await updateAiSetting.mutateAsync({
      key: 'default',
      value: defaultDriver,
      group: 'general',
    });

    for (const feature of featureKeys) {
      await updateAiSetting.mutateAsync({
        key: `features.${feature}`,
        value: toFeaturePayload(features[feature]),
        group: 'feature',
      });
    }

    setDefaultDriverOverride(null);
    setDiagnosticsDriverOverride(null);
    setFeatureOverrides({
      analytical: {},
      narrative: {},
      lab: {},
      decision: {},
    });
    await syncAiSettings.mutateAsync();
  };

  const handleDiagnostics = async () => {
    try {
      const result = await diagnosticsMutation.mutateAsync({
        driver: diagnosticsDriver,
        prompt: diagnosticsPrompt,
      });
      setDiagnostics(result);
      toast.success(`${diagnosticsDriver.toUpperCase()} diagnostics completed.`);
    } catch (error: unknown) {
      const payload = (error as { response?: { data?: AiDiagnosticsResult } }).response?.data;
      if (payload) {
        setDiagnostics(payload);
      }
    }
  };

  const handleProviderModelSave = async () => {
    if (!editingProviderModel) return;

    if (editingProviderModel.id) {
      await updateProviderModel.mutateAsync({
        id: editingProviderModel.id,
        data: editingProviderModel,
      });
    } else {
      await createProviderModel.mutateAsync(editingProviderModel);
    }

    setEditingProviderModel(null);
  };

  const handleExportProviderModels = async () => {
    const data = await exportProviderModels.mutateAsync();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'provider-models.json';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Provider models exported.');
  };

  const handleImportProviderModels = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const payload = JSON.parse(String(loadEvent.target?.result ?? '{}'));
        await importProviderModels.mutateAsync(payload);
      } catch {
        toast.error('Failed to parse provider model JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddKeyClick = () => {
    setEditingKey(null);
    setIsFormOpen(true);
  };

  const handleEditKeyClick = (key: AiKey) => {
    setEditingKey(key);
    setIsFormOpen(true);
  };

  const handleDeleteKeyClick = async (id: number) => {
    if (!confirm('Delete this key pool entry?')) {
      return;
    }

    await deleteKey(id);
    toast.success('Key pool entry deleted.');
  };

  const handleKeyFormSubmit = async (data: AiKeyPayload) => {
    if (editingKey) {
      await updateKey({ id: editingKey.id, data });
      toast.success('Key pool entry updated.');
      return;
    }

    if (!data.key) {
      throw new Error('API key is required when creating a new pool entry.');
    }

    await addKey({ ...data, key: data.key });
    toast.success('Key pool entry created.');
  };

  return (
    <div className="mx-auto max-w-7xl pb-24">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2 flex items-center gap-3 text-cyan-400"
          >
            <Settings2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Control / AI Runtime
            </span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            AI Runtime
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
            Canonical home for AI routing, diagnostics, Loom agent config, provider
            models, and key pool operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => importAiSettings.mutate()}
            disabled={importAiSettings.isPending}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white disabled:opacity-50"
          >
            <RefreshCcw size={16} />
            Import Defaults
          </button>
          <button
            onClick={() => syncAiSettings.mutate()}
            disabled={syncAiSettings.isPending}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            Sync Cache
          </button>
          <button
            onClick={handleSaveRouting}
            disabled={updateAiSetting.isPending || syncAiSettings.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            <Save size={16} />
            Save Routing
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { key: 'routing', label: 'Routing', icon: Cpu },
          { key: 'loom', label: 'Loom Agents', icon: Brain },
          { key: 'providers', label: 'Provider Models', icon: Settings2 },
          { key: 'keys', label: 'Key Pool', icon: Database },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as RuntimeTab)}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
              activeTab === tab.key
                ? 'bg-white text-black'
                : 'border border-slate-700/50 bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <RefreshCcw size={22} className="animate-spin text-slate-600" />
        </div>
      ) : null}

      {!isLoading && activeTab === 'routing' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <RuntimeCard
            title="Pool Routing"
            description="Default route and feature-level provider preferences"
            icon={<Cpu size={18} />}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Default Route
                </span>
                <select
                  value={defaultDriver}
                  onChange={(event) => setDefaultDriverOverride(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                >
                  {driverOptions.map((driver) => (
                    <option key={driver} value={driver}>
                      {driver.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Pool Status
                </span>
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300">
                  Enabled permanently through AiGateway
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {featureKeys.map((feature) => (
                <div
                  key={feature}
                  className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Feature: {feature}
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Filter which providers and model tiers each runtime feature can use.
                    </p>
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Provider Filter
                    </span>
                    <select
                      value={features[feature].driver}
                      onChange={(event) =>
                        updateFeature(feature, { driver: event.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    >
                      {driverOptions.map((driver) => (
                        <option key={driver} value={driver}>
                          {driver.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Model Override
                      </span>
                      <input
                        value={features[feature].model}
                        onChange={(event) =>
                          updateFeature(feature, { model: event.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Max Tokens
                      </span>
                      <input
                        value={features[feature].max_tokens}
                        onChange={(event) =>
                          updateFeature(feature, {
                            max_tokens: event.target.value.replace(/[^\d]/g, ''),
                          })
                        }
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Tier
                      </span>
                      <select
                        value={features[feature].tier}
                        onChange={(event) =>
                          updateFeature(feature, {
                            tier: event.target.value as AiFeatureProfile['tier'],
                          })
                        }
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                      >
                        <option value="any">Any Tier</option>
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Model Group
                      </span>
                      <input
                        value={features[feature].model_group}
                        onChange={(event) =>
                          updateFeature(feature, { model_group: event.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </RuntimeCard>

          <RuntimeCard
            title="Runtime Diagnostics"
            description="Probe the current routing path via AiGateway"
            icon={<TestTube2 size={18} />}
          >
            <div className="space-y-4">
              <label className="space-y-2 block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Provider Filter
                </span>
                <select
                  value={diagnosticsDriver}
                  onChange={(event) => setDiagnosticsDriverOverride(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                >
                  {driverOptions.map((driver) => (
                    <option key={driver} value={driver}>
                      {driver.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Prompt
                </span>
                <input
                  value={diagnosticsPrompt}
                  onChange={(event) => setDiagnosticsPrompt(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <button
                onClick={handleDiagnostics}
                disabled={diagnosticsMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <TestTube2 size={16} />
                {diagnosticsMutation.isPending
                  ? `Testing ${diagnosticsDriver.toUpperCase()}...`
                  : 'Run Probe'}
              </button>

              <div className="min-h-[180px] rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                {diagnostics ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                      <span
                        className={
                          diagnostics.status === 'success'
                            ? 'font-black text-emerald-400'
                            : 'font-black text-rose-400'
                        }
                      >
                        {diagnostics.status}
                      </span>
                      <span className="text-slate-500">
                        {diagnostics.latency_ms} ms
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-300">
                      {diagnostics.driver.toUpperCase()}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                      {diagnostics.response || diagnostics.error || 'No output returned.'}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-slate-500">
                    Run a probe to verify the current AI runtime path from Laravel through
                    AiGateway.
                  </div>
                )}
              </div>
            </div>
          </RuntimeCard>
        </div>
      ) : null}

      {!isLoading && activeTab === 'loom' ? (
        <RuntimeCard
          title="Loom Agents"
          description="Agent-facing routing remains configurable, but is now managed in one place"
          icon={<Brain size={18} />}
        >
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => importLoomAgents.mutate()}
              disabled={importLoomAgents.isPending}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white disabled:opacity-50"
            >
              <RefreshCcw size={16} />
              Import From JSON
            </button>
          </div>

          <div className="space-y-4">
            {loomAgents.map((record) => (
              <LoomAgentEditor
                key={record.id}
                record={record}
                providerModels={providerModels}
                onSave={(value) =>
                  updateAiSetting.mutateAsync({
                    key: record.key,
                    value,
                    group: record.group,
                  })
                }
                isSaving={updateAiSetting.isPending}
              />
            ))}
          </div>
        </RuntimeCard>
      ) : null}

      {!isLoading && activeTab === 'providers' ? (
        <RuntimeCard
          title="Provider Models"
          description="CRUD and import/export for provider model registry"
          icon={<Settings2 size={18} />}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setEditingProviderModel({ provider: 'openai', is_active: true })}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-400"
            >
              <Plus size={16} />
              Add Model
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportProviderModels}
                disabled={exportProviderModels.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white disabled:opacity-50"
              >
                <Download size={16} />
                Export
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-sm font-black text-slate-300 transition hover:text-white">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportProviderModels}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {editingProviderModel ? (
            <div className="mb-6 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6">
              <h3 className="mb-4 text-lg font-black text-white">
                {editingProviderModel.id ? 'Edit Provider Model' : 'Add Provider Model'}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Provider
                  </span>
                  <input
                    value={editingProviderModel.provider || ''}
                    onChange={(event) =>
                      setEditingProviderModel({
                        ...editingProviderModel,
                        provider: event.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Model Name
                  </span>
                  <input
                    value={editingProviderModel.model_name || ''}
                    onChange={(event) =>
                      setEditingProviderModel({
                        ...editingProviderModel,
                        model_name: event.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Display Name
                  </span>
                  <input
                    value={editingProviderModel.display_name || ''}
                    onChange={(event) =>
                      setEditingProviderModel({
                        ...editingProviderModel,
                        display_name: event.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Tier
                  </span>
                  <select
                    value={String(editingProviderModel.metadata?.tier || '')}
                    onChange={(event) =>
                      setEditingProviderModel({
                        ...editingProviderModel,
                        metadata: {
                          ...(editingProviderModel.metadata || {}),
                          tier: event.target.value,
                        },
                      })
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                  >
                    <option value="">Select tier</option>
                    <option value="pro">Pro</option>
                    <option value="mini">Mini</option>
                    <option value="free">Free</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProviderModel.is_active ?? true}
                    onChange={(event) =>
                      setEditingProviderModel({
                        ...editingProviderModel,
                        is_active: event.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                  />
                  <span className="text-sm text-white">Active</span>
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleProviderModelSave}
                  disabled={createProviderModel.isPending || updateProviderModel.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() => setEditingProviderModel(null)}
                  className="rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-2 text-sm font-black text-slate-300 transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {providerModels.map((model) => (
              <div
                key={model.id}
                className="rounded-3xl border border-slate-700/50 bg-slate-800/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-white">
                        {model.display_name}
                      </h3>
                      <span className="rounded-full bg-slate-700/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                        {model.provider}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                          model.is_active
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {model.is_active ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">Model: {model.model_name}</p>
                    {model.metadata?.tier ? (
                      <p className="mt-1 text-sm text-slate-500">
                        Tier: {String(model.metadata.tier)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingProviderModel(model)}
                      className="rounded-xl bg-slate-700/50 p-2 text-slate-300 transition hover:text-white"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteProviderModel.mutate(model.id)}
                      className="rounded-xl bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RuntimeCard>
      ) : null}

      {!isLoading && activeTab === 'keys' ? (
        <div className="space-y-6">
          <RuntimeCard
            title="Key Pool"
            description="Manage AI key pool entries used by pool-first routing"
            icon={<Database size={18} />}
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleAddKeyClick}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-cyan-400"
              >
                <Plus size={16} />
                Add Key
              </button>
            </div>

            <StatsOverview keys={keys} />
            <KeyTable
              keys={keys}
              onEdit={handleEditKeyClick}
              onDelete={handleDeleteKeyClick}
            />
          </RuntimeCard>

          <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <h3 className="mb-2 text-lg font-black text-white">Pool-first note</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              The runtime prefers explicit pool behavior. If no suitable key exists, the
              request fails clearly instead of silently falling back to legacy fixed
              credentials.
            </p>
          </div>
        </div>
      ) : null}

      <KeyForm
        key={editingKey ? `edit-${editingKey.id}` : isFormOpen ? 'new-open' : 'new-closed'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleKeyFormSubmit}
        initialData={editingKey}
      />
    </div>
  );
}
