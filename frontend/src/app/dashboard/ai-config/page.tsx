'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  History,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import AiDiagnosticsTelemetry from './AiDiagnosticsTelemetry';
import AiLogViewer from './AiLogViewer';

type SettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];

interface AiSetting {
  id: number;
  key: string;
  value: SettingValue;
  group: string;
  description: string;
  is_secret: boolean;
}

interface DiagnosticResult {
  status: 'success' | 'error';
  driver: string;
  prompt: string;
  latency_ms: number;
  response?: string | null;
  error?: string;
  checked_at: string;
}

const defaultDiagnosticPrompt = 'Ping WorldOS and report whether this driver is ready for orchestration.';

const AiConfigPage = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'diagnostics'>('config');
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [diagnosticDriver, setDiagnosticDriver] = useState('');
  const [diagnosticPrompt, setDiagnosticPrompt] = useState(defaultDiagnosticPrompt);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    if (activeTab !== 'logs') {
      void fetchDrivers();
    }

    if (activeTab === 'config') {
      void fetchSettings();
    }
  }, [activeTab]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/ai-settings/drivers');
      const data = (await response.json()) as string[];
      setDrivers(data);
      setDiagnosticDriver((current) => current || data[0] || '');
    } catch (error) {
      console.error('Failed to fetch drivers', error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-settings');
      const data = (await response.json()) as AiSetting[];
      setSettings(data);

      const initial: Record<string, string> = {};
      data.forEach((setting) => {
        initial[setting.key] =
          typeof setting.value === 'object' && setting.value !== null ? JSON.stringify(setting.value, null, 2) : String(setting.value ?? '');
      });
      setLocalValues(initial);
    } catch (error) {
      console.error('Failed to fetch AI settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: SettingValue, group: string, isSecret: boolean) => {
    try {
      const response = await fetch('/api/ai-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, group, is_secret: isSecret }),
      });
      return response.ok;
    } catch (error) {
      console.error('Update failed', error);
      return false;
    }
  };

  const parseLocalValue = (value: string): SettingValue => {
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value) as SettingValue;
      } catch {
        return value;
      }
    }

    return value;
  };

  const handleSaveAll = async () => {
    const changedKeys = Object.keys(localValues).filter((key) => {
      const original = settings.find((setting) => setting.key === key);
      if (!original) {
        return false;
      }

      const originalValue =
        typeof original.value === 'object' && original.value !== null ? JSON.stringify(original.value, null, 2) : String(original.value ?? '');

      return localValues[key] !== originalValue;
    });

    if (changedKeys.length === 0) {
      toast.info('No configuration changes to save.');
      return;
    }

    try {
      setSaving(true);
      const toastId = toast.loading(`Saving ${changedKeys.length} changes...`);

      const results = await Promise.all(
        changedKeys.map((key) => {
          const setting = settings.find((item) => item.key === key);
          if (!setting) {
            return Promise.resolve(false);
          }

          return handleUpdate(key, parseLocalValue(localValues[key]), setting.group, setting.is_secret);
        }),
      );

      const successCount = results.filter(Boolean).length;
      toast.dismiss(toastId);

      if (successCount === changedKeys.length) {
        toast.success(`Saved ${successCount} configuration values.`);
      } else {
        toast.error(`Only saved ${successCount}/${changedKeys.length} configuration values.`);
      }

      await fetchSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await fetch('/api/ai-settings/sync', { method: 'POST' });
      toast.success('AI config cache synced.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!confirm('Importing from ai.php will overwrite the current UI state. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      await fetch('/api/ai-settings/import', { method: 'POST' });
      toast.success('Imported AI config from file.');
      await fetchSettings();
    } finally {
      setLoading(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((state) => ({ ...state, [key]: !state[key] }));
  };

  const handleRunDiagnostic = async (driverOverride?: string) => {
    const driver = driverOverride || diagnosticDriver;
    if (!driver) {
      toast.error('Choose a driver before running diagnostics.');
      return;
    }

    const prompt = diagnosticPrompt.trim();
    if (!prompt) {
      toast.error('Diagnostic prompt cannot be empty.');
      return;
    }

    try {
      setDiagnosticDriver(driver);
      setDiagnosticLoading(true);
      const response = await fetch('/api/ai-settings/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver, prompt }),
      });

      const payload = (await response.json()) as DiagnosticResult;
      setDiagnosticResult(payload);

      if (!response.ok || payload.status === 'error') {
        toast.error(payload.error || 'Driver diagnostic failed.');
        return;
      }

      toast.success(`Driver ${payload.driver} responded in ${payload.latency_ms}ms.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Driver diagnostic failed.';
      setDiagnosticResult({
        status: 'error',
        driver,
        prompt,
        latency_ms: 0,
        error: message,
        checked_at: new Date().toISOString(),
      });
      toast.error(message);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const renderGroup = (group: string, title: string, icon: LucideIcon) => {
    const Icon = icon;
    const groupSettings = settings.filter((setting) => setting.group === group);

    return (
      <div className="space-y-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
            <Icon size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {groupSettings.map((setting) => {
            const isDriverSelection = group === 'feature' || setting.key === 'default';
            const originalValue =
              typeof setting.value === 'object' && setting.value !== null ? JSON.stringify(setting.value, null, 2) : String(setting.value ?? '');
            const isChanged = localValues[setting.key] !== originalValue;

            return (
              <motion.div
                layout
                key={setting.key}
                className="group rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md transition-colors hover:border-primary/30"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-primary">{setting.key}</span>
                      {setting.is_secret && (
                        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono uppercase text-amber-500">
                          Secret
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{setting.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex w-full max-w-md items-center gap-2 md:w-auto">
                    <div className="relative min-w-[300px] flex-1">
                      {isDriverSelection ? (
                        <select
                          value={localValues[setting.key] || ''}
                          onChange={(event) => setLocalValues((state) => ({ ...state, [setting.key]: event.target.value }))}
                          className={`w-full appearance-none rounded-lg border bg-void/60 px-4 py-2 text-sm font-mono transition-all focus:outline-none ${
                            isChanged
                              ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] focus:border-amber-500'
                              : 'border-border/40 focus:border-primary/50'
                          }`}
                        >
                          {drivers.map((driver) => (
                            <option key={driver} value={driver}>
                              {driver}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={setting.is_secret && !showSecrets[setting.key] ? 'password' : 'text'}
                          value={localValues[setting.key] || ''}
                          onChange={(event) => setLocalValues((state) => ({ ...state, [setting.key]: event.target.value }))}
                          className={`w-full rounded-lg border bg-void/60 px-4 py-2 text-sm font-mono transition-all focus:outline-none ${
                            isChanged
                              ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] focus:border-amber-500'
                              : 'border-border/40 focus:border-primary/50'
                          }`}
                        />
                      )}

                      {setting.is_secret && !isDriverSelection && (
                        <button
                          type="button"
                          onClick={() => toggleSecret(setting.key)}
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-muted-foreground transition-colors hover:text-primary"
                        >
                          {showSecrets[setting.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}

                      {isDriverSelection && (
                        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDiagnostics = () => {
    const hasResult = Boolean(diagnosticResult);
    const isError = diagnosticResult?.status === 'error';

    return (
      <div className="space-y-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-2xl border border-border/40 bg-card/30 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                <FlaskConical size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">AI Driver Diagnostic Playground</h2>
                <p className="text-xs text-muted-foreground">Probe Zai, OpenRouter, OpenAI, or local drivers without leaving the dashboard.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Driver
                <select
                  value={diagnosticDriver}
                  onChange={(event) => setDiagnosticDriver(event.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-void/60 px-4 py-3 text-sm font-mono text-foreground outline-none transition focus:border-primary/50"
                >
                  {drivers.map((driver) => (
                    <option key={driver} value={driver}>
                      {driver}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-border/40 bg-void/40 p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Expected flow</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Requests go through `AiGateway`, are logged by `AiDriverProxy`, and then show up in the audit log tab for follow-up.
                </p>
              </div>
            </div>

            <label className="mt-4 block space-y-2 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              Diagnostic prompt
              <textarea
                value={diagnosticPrompt}
                onChange={(event) => setDiagnosticPrompt(event.target.value)}
                rows={5}
                maxLength={2000}
                className="w-full rounded-2xl border border-border/40 bg-void/60 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-primary/50"
                placeholder={defaultDiagnosticPrompt}
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Guard rails: non-empty prompt, bounded payload, explicit driver selection.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosticPrompt(defaultDiagnosticPrompt);
                    setDiagnosticResult(null);
                  }}
                  className="rounded-xl border border-border/40 px-4 py-3 text-xs font-mono transition hover:bg-card"
                >
                  RESET
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleRunDiagnostic();
                  }}
                  disabled={diagnosticLoading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-mono text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {diagnosticLoading ? <RefreshCw size={14} className="animate-spin" /> : <TerminalSquare size={14} />}
                  {diagnosticLoading ? 'RUNNING...' : 'RUN_DIAGNOSTIC'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatusCard label="Driver count" value={String(drivers.length)} hint="Available adapters from config" />
            <StatusCard label="Last status" value={diagnosticResult?.status?.toUpperCase() || 'IDLE'} hint="Most recent diagnostic outcome" />
            <StatusCard label="Latency" value={diagnosticResult ? `${diagnosticResult.latency_ms}ms` : 'N/A'} hint="Round-trip time for last probe" />
          </div>
        </section>

        <AiDiagnosticsTelemetry
          drivers={drivers}
          activeDriver={diagnosticDriver}
          lastResult={diagnosticResult}
          onPing={(driver) => {
            void handleRunDiagnostic(driver);
          }}
        />

        <section className="rounded-2xl border border-border/40 bg-card/25 p-6 backdrop-blur-md">
          {!hasResult && !diagnosticLoading && (
            <div className="rounded-2xl border border-dashed border-border/50 bg-void/30 p-8 text-center text-sm text-muted-foreground">
              Run a probe to inspect live driver readiness, auth errors, and latency before wiring the driver into a production flow.
            </div>
          )}

          {diagnosticLoading && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Testing driver handshake...</p>
            </div>
          )}

          {diagnosticResult && !diagnosticLoading && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Diagnostic result</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{diagnosticResult.driver}</h3>
                </div>
                <div className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] ${isError ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
                  {diagnosticResult.status}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatusCard label="Latency" value={`${diagnosticResult.latency_ms}ms`} hint="End-to-end probe time" />
                <StatusCard label="Checked at" value={new Date(diagnosticResult.checked_at).toLocaleTimeString()} hint="Local browser time" />
                <StatusCard label="Prompt size" value={`${diagnosticResult.prompt.length}`} hint="Characters sent to the driver" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <OutputBlock title="Prompt" tone="text-sky-200" body={diagnosticResult.prompt} />
                <OutputBlock
                  title={isError ? 'Error' : 'Response'}
                  tone={isError ? 'text-rose-200' : 'text-emerald-200'}
                  body={isError ? diagnosticResult.error || 'Unknown driver error.' : diagnosticResult.response || 'Driver returned an empty response.'}
                />
              </div>

              {isError && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRunDiagnostic();
                    }}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs font-mono text-rose-200 transition hover:bg-rose-500/20"
                  >
                    RETRY_DIAGNOSTIC
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <>
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-6 rounded-[var(--radius)] border border-border/50 bg-card/40 p-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="glow-left-brain flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-primary/40">
            <Settings size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Orchestration Center</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Kernel config / audit / diagnostics</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="mr-4 flex rounded-xl border border-border/40 bg-void/40 p-1">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-mono transition-all ${
                activeTab === 'config' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cpu size={14} /> CONFIG
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-mono transition-all ${
                activeTab === 'diagnostics' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FlaskConical size={14} /> DIAGNOSTICS
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-mono transition-all ${
                activeTab === 'logs' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History size={14} /> AUDIT_LOGS
            </button>
          </div>

          <button
            onClick={handleImport}
            className="group flex items-center gap-2 rounded-lg border border-border/40 bg-card px-4 py-2 text-xs font-mono transition-all hover:border-primary/50 hover:text-primary"
          >
            <Download size={14} className="transition-transform group-hover:-translate-y-0.5" />
            IMPORT_CONFIG
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="group flex items-center gap-2 rounded-lg border border-border/40 bg-card px-4 py-2 text-xs font-mono transition-all hover:border-primary/50 hover:text-primary"
          >
            <RefreshCw size={14} className={`transition-transform group-hover:rotate-180 ${syncing ? 'animate-spin' : ''}`} />
            SYNC_CACHE
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || activeTab !== 'config'}
            className={`group flex items-center gap-2 rounded-lg px-6 py-2 text-xs font-mono transition-all ${
              saving || activeTab !== 'config'
                ? 'cursor-not-allowed border border-border/30 bg-card text-muted-foreground opacity-60'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
            }`}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} className="transition-transform group-hover:scale-110" />}
            {saving ? 'SAVING...' : 'SAVE_CHANGES'}
          </button>
        </div>
      </header>

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 space-y-12 py-8">
        {activeTab === 'logs' ? (
          <AiLogViewer />
        ) : activeTab === 'diagnostics' ? (
          renderDiagnostics()
        ) : loading ? (
          <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="animate-pulse text-xs font-mono text-muted-foreground">Initializing neural link...</p>
          </div>
        ) : (
          <div className="w-full">
            {renderGroup('feature', 'Simulation Intelligence Features', Cpu)}
            <div className="my-12 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            {renderGroup('provider', 'AI Providers & LLM Clusters', Database)}
            <div className="my-12 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            {renderGroup('general', 'Kernel Systems', ShieldCheck)}
          </div>
        )}
      </main>
    </>
  );
};

function StatusCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-md">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function OutputBlock({ title, tone, body }: { title: string; tone: string; body: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-void/50 p-5">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <pre className={`overflow-auto whitespace-pre-wrap text-sm leading-6 ${tone}`}>{body}</pre>
    </div>
  );
}

export default AiConfigPage;



