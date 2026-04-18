'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  Globe,
  Info,
  RefreshCcw,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  useServiceStatus,
  useSimulationSettings,
} from '@/features/admin/hooks';
import type {
  SimulationSetting,
  SimulationValue,
} from '@/features/admin/types';

interface ConfigCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ConfigCard({ title, description, icon, children }: ConfigCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-6 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-center gap-4">
        <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">{icon}</div>
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  detail,
  children,
}: {
  label: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        {detail ? (
          <span className="text-[10px] font-bold text-slate-600">{detail}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function SystemPage() {
  const { settings, isLoading, updateSettings, resetSettings, isUpdating, isResetting } =
    useSimulationSettings();
  const { serviceStatus, healthyCount, totalCount, isHealthy, isLoading: isLoadingStatus } =
    useServiceStatus();
  const [localChanges, setLocalChanges] = useState<Record<string, SimulationValue>>({});

  const handleInputChange = (key: string, value: SimulationValue) => {
    setLocalChanges((current) => ({ ...current, [key]: value }));
  };

  const findSetting = (key: string): SimulationSetting | undefined =>
    settings
      ? Object.values(settings)
          .flat()
          .find((item) => item.key === key)
      : undefined;

  const getValue = (key: string, fallback: SimulationValue): SimulationValue => {
    if (localChanges[key] !== undefined) {
      return localChanges[key];
    }

    return findSetting(key)?.value ?? fallback;
  };

  const handleSave = async () => {
    if (!settings) return;

    const changedSettings: SimulationSetting[] = [];

    Object.keys(localChanges).forEach((key) => {
      const original = findSetting(key);
      if (!original || original.value === localChanges[key]) {
        return;
      }

      changedSettings.push({
        key,
        value: localChanges[key],
        group: original.group,
        description: original.description,
      });
    });

    if (changedSettings.length === 0) {
      return;
    }

    await updateSettings(changedSettings);
    setLocalChanges({});
  };

  const handleReset = async () => {
    await resetSettings(undefined);
    setLocalChanges({});
  };

  const statusTone = isHealthy ? 'text-emerald-400' : 'text-amber-400';

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          Loading system controls
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400"
          >
            <Settings2 size={12} />
            Control Surface / System
          </motion.div>
          <div>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
              System <span className="text-slate-500">Runtime</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Canonical home for simulation settings and service health. This page is
              the single runtime control surface for WorldOS system behavior.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setLocalChanges({})}
            disabled={isUpdating}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-slate-800/60 hover:text-white disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting || isUpdating}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm font-black text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            <RefreshCcw size={16} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            <Save size={16} />
            Save Runtime
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-400">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Runtime Groups
              </p>
              <p className="text-2xl font-black text-white">
                {Object.keys(settings ?? {}).length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Service Health
              </p>
              <p className="text-2xl font-black text-white">
                {healthyCount}/{totalCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
              <Server size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Overall Status
              </p>
              <p className={`text-2xl font-black capitalize ${statusTone}`}>
                {serviceStatus?.overall ?? 'unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ConfigCard
            title="General"
            description="Universe identity and bootstrap controls"
            icon={<Globe size={20} />}
          >
            <SettingRow label="Universe Name">
              <input
                type="text"
                value={String(getValue('general.name', 'Standard Multiverse'))}
                onChange={(event) => handleInputChange('general.name', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </SettingRow>
            <SettingRow label="Observation Seed" detail="Primacy Value">
              <input
                type="text"
                value={String(getValue('general.seed', '0x99AFA'))}
                onChange={(event) => handleInputChange('general.seed', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-white outline-none transition focus:border-cyan-500"
              />
            </SettingRow>
          </ConfigCard>

          <ConfigCard
            title="Simulation Kernel"
            description="Tick cadence and actor density"
            icon={<Activity size={20} />}
          >
            <SettingRow label="Tick Rate" detail="ms per tick">
              <input
                type="number"
                value={Number(getValue('simulation.tick_rate', 1000))}
                onChange={(event) =>
                  handleInputChange('simulation.tick_rate', Number(event.target.value) || 1)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              />
            </SettingRow>
            <SettingRow label="Population Ceiling" detail="Actor limit">
              <input
                type="number"
                value={Number(getValue('simulation.actor_limit', 50))}
                onChange={(event) =>
                  handleInputChange('simulation.actor_limit', Number(event.target.value) || 1)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              />
            </SettingRow>
          </ConfigCard>

          <ConfigCard
            title="World Physics"
            description="Environmental stability and regeneration"
            icon={<Zap size={20} />}
          >
            <SettingRow
              label="Stability Factor"
              detail={`${Math.round(Number(getValue('chaos.dampening_stability_factor', 0.6)) * 100)}%`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={Number(getValue('chaos.dampening_stability_factor', 0.6))}
                onChange={(event) =>
                  handleInputChange(
                    'chaos.dampening_stability_factor',
                    Number(event.target.value),
                  )
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-500"
              />
            </SettingRow>
            <SettingRow label="Resource Regeneration">
              <select
                value={Number(getValue('intelligence.resource_regen_rate', 2))}
                onChange={(event) =>
                  handleInputChange(
                    'intelligence.resource_regen_rate',
                    Number(event.target.value),
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              >
                <option value={1}>Abundant</option>
                <option value={2}>Standard</option>
                <option value={3}>Scarce</option>
                <option value={5}>Catastrophic</option>
              </select>
            </SettingRow>
          </ConfigCard>

          <ConfigCard
            title="Psychology & Entropy"
            description="Behavioral thresholds and collapse pressure"
            icon={<Brain size={20} />}
          >
            <SettingRow label="Trauma Threshold">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Number(getValue('psychology.trauma_threshold', 75))}
                onChange={(event) =>
                  handleInputChange('psychology.trauma_threshold', Number(event.target.value))
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-rose-500"
              />
            </SettingRow>
            <SettingRow label="Entropy Floor">
              <input
                type="range"
                min="0"
                max="0.01"
                step="0.001"
                value={Number(getValue('worldos.entropy_floor', 0.001))}
                onChange={(event) =>
                  handleInputChange('worldos.entropy_floor', Number(event.target.value))
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-amber-500"
              />
            </SettingRow>
            <div className="flex gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
              <p className="text-xs leading-relaxed text-slate-400">
                High tick rate and actor ceiling changes affect runtime stability immediately.
                Keep these in sync with service health before aggressive advances.
              </p>
            </div>
          </ConfigCard>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
                <Server size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Service Health</h2>
                <p className="text-xs text-slate-500">
                  Live status from <code>/api/worldos/service-status</code>
                </p>
              </div>
            </div>

            {isLoadingStatus || !serviceStatus ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCcw size={18} className="animate-spin text-slate-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(serviceStatus.services).map(([name, service]) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{name}</p>
                        <p className="text-[11px] text-slate-500">
                          {service.latency_ms ? `${service.latency_ms} ms` : 'No latency sample'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                          service.status === 'ok'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>
                    {service.error ? (
                      <p className="mt-3 text-xs leading-relaxed text-rose-300">
                        {service.error}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800/50 bg-[#111116] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-400">
                <Info size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Next Surface</h2>
                <p className="text-xs text-slate-500">
                  AI routing, diagnostics, provider models, and key pool live separately.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/ai-runtime"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-500/20"
            >
              <Settings2 size={16} />
              Open AI Runtime
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
