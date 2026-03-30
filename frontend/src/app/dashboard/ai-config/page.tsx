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
  Zap,
  Key,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import AiDiagnosticsTelemetry from './AiDiagnosticsTelemetry';
import AiLogViewer from './AiLogViewer';
import { BrainMatrix } from './BrainMatrix';
import { KeyPool } from './KeyPool';

type SettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];
type AiTabId = 'config' | 'logs' | 'diagnostics' | 'matrix' | 'keys';

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

const defaultDiagnosticPrompt = 'Hãy gửi báo cáo tình trạng sẵn sàng của driver này cho WorldOS.';

const aiTabs: Array<{ id: AiTabId; label: string; icon: LucideIcon; activeClassName: string }> = [
  { id: 'config', label: 'C\u1ea5u h\u00ecnh ph\u1eb3ng', icon: Cpu, activeClassName: 'bg-white text-primary border-slate-200 shadow-sm' },
  { id: 'matrix', label: 'Ma tr\u1eadn h\u1ea1t nh\u00e2n', icon: Zap, activeClassName: 'bg-white text-indigo-600 border-indigo-100 shadow-sm' },
  { id: 'keys', label: 'B\u1ec3 key AI', icon: Key, activeClassName: 'bg-white text-emerald-600 border-emerald-100 shadow-sm' },
  { id: 'diagnostics', label: 'Ch\u1ea9n \u0111o\u00e1n', icon: FlaskConical, activeClassName: 'bg-white text-rose-600 border-rose-100 shadow-sm' },
  { id: 'logs', label: 'Nh\u1eadt k\u00fd', icon: History, activeClassName: 'bg-white text-slate-700 border-slate-200 shadow-sm' },
];

const AiConfigPage = () => {
  const [activeTab, setActiveTab] = useState<AiTabId>('matrix');
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
    if (activeTab !== 'logs' && activeTab !== 'matrix' && activeTab !== 'keys') {
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
      toast.info('Không có thay đổi nào để lưu.');
      return;
    }

    try {
      setSaving(true);
      const toastId = toast.loading(`Đang lưu ${changedKeys.length} thay đổi...`);

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
        toast.success(`Đã lưu ${successCount} giá trị cấu hình.`);
      } else {
        toast.error(`Chỉ lưu được ${successCount}/${changedKeys.length} giá trị.`);
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
      toast.success('Đã đồng bộ bộ nhớ đệm cấu hình AI.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!confirm('Nhập từ file ai.php sẽ ghi đè lên trạng thái hiện tại. Tiếp tục?')) {
      return;
    }

    try {
      setLoading(true);
      await fetch('/api/ai-settings/import', { method: 'POST' });
      toast.success('Đã nhập cấu hình AI từ tệp tin.');
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
      toast.error('Hãy chọn một driver trước khi chạy chẩn đoán.');
      return;
    }

    const prompt = diagnosticPrompt.trim();
    if (!prompt) {
      toast.error('Câu lệnh chẩn đoán không được để trống.');
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
        toast.error(payload.error || 'Chẩn đoán driver thất bại.');
        return;
      }

      toast.success(`Driver ${payload.driver} đã phản hồi trong ${payload.latency_ms}ms.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chẩn đoán driver thất bại.';
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary shadow-sm shadow-primary/5">
              <Icon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="text-[9px] font-heading font-black uppercase tracking-[0.1em] text-slate-400 mt-0.5">Phân khu / {group}</p>
            </div>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groupSettings.map((setting) => {
            const isDriverSelection = group === 'feature' || setting.key === 'default';
            const originalValue =
              typeof setting.value === 'object' && setting.value !== null ? JSON.stringify(setting.value, null, 2) : String(setting.value ?? '');
            const isChanged = localValues[setting.key] !== originalValue;

            return (
              <motion.div
                layout
                key={setting.key}
                className={`group relative rounded-2xl border p-4 transition-all hover:shadow-md ${isChanged
                  ? 'border-amber-200 bg-amber-50/20 shadow-sm shadow-amber-100/50'
                  : 'border-slate-100 bg-white hover:border-primary/30'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-heading font-black text-slate-800 uppercase tracking-widest truncate">
                        {setting.key.split('.').pop()}
                      </span>
                      {setting.is_secret && (
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Bảo mật" />
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-500 line-clamp-1">{setting.description || 'Tham số hệ thống.'}</p>
                  </div>

                  <div className="relative w-40 shrink-0 sm:w-56">
                    {isDriverSelection ? (
                      <select
                        value={localValues[setting.key] || ''}
                        onChange={(event) => setLocalValues((state) => ({ ...state, [setting.key]: event.target.value }))}
                        className={`w-full appearance-none rounded-lg border bg-slate-50/50 px-3 py-2 text-[11px] font-heading font-bold transition-all focus:outline-none ${isChanged
                          ? 'border-amber-400 ring-4 ring-amber-500/10'
                          : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5'
                          }`}
                      >
                        {drivers.map((driver) => (
                          <option key={driver} value={driver}>
                            {driver.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={setting.is_secret && !showSecrets[setting.key] ? 'password' : 'text'}
                        value={localValues[setting.key] || ''}
                        onChange={(event) => setLocalValues((state) => ({ ...state, [setting.key]: event.target.value }))}
                        className={`w-full rounded-lg border bg-slate-50/50 px-3 py-2 text-[11px] font-heading font-bold transition-all focus:outline-none ${isChanged
                          ? 'border-amber-400 ring-4 ring-amber-500/10'
                          : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5'
                          }`}
                      />
                    )}

                    {setting.is_secret && !isDriverSelection && (
                      <button
                        type="button"
                        onClick={() => toggleSecret(setting.key)}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-primary"
                      >
                        {showSecrets[setting.key] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    )}

                    {isDriverSelection && (
                      <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                        <ChevronRight size={12} className="rotate-90" />
                      </div>
                    )}
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
      <div className="space-y-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary">
                <FlaskConical size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Sân chơi Chẩn đoán AI Driver</h2>
                <p className="text-xs text-slate-500 mt-1">Kiểm tra khả năng kết nối của Zai, OpenRouter, OpenAI hoặc các driver nội bộ ngay tại đây.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Driver</span>
                <select
                  value={diagnosticDriver}
                  onChange={(event) => setDiagnosticDriver(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-heading font-bold text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  {drivers.map((driver) => (
                    <option key={driver} value={driver}>
                      {driver}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">Luồng dự kiến</p>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                  Yêu cầu đi qua `AiGateway`, được ghi nhật ký bởi `AiDriverProxy`, và hiển thị trong tab Nhật ký của hệ thống.
                </p>
              </div>
            </div>

            <label className="mt-6 block space-y-2.5">
              <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Câu lệnh chẩn đoán</span>
              <textarea
                value={diagnosticPrompt}
                onChange={(event) => setDiagnosticPrompt(event.target.value)}
                rows={5}
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder={defaultDiagnosticPrompt}
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 italic">Lưu ý: Driver phải được cấu hình khóa API hợp lệ trước khi thử nghiệm.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosticPrompt(defaultDiagnosticPrompt);
                    setDiagnosticResult(null);
                  }}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-[10px] font-heading font-black uppercase tracking-widest transition hover:bg-slate-50 text-slate-600"
                >
                  ĐẶT LẠI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleRunDiagnostic();
                  }}
                  disabled={diagnosticLoading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-[10px] font-heading font-black uppercase tracking-widest text-white transition hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {diagnosticLoading ? <RefreshCw size={14} className="animate-spin" /> : <TerminalSquare size={14} />}
                  {diagnosticLoading ? 'ĐANG CHẠY...' : 'CHẠY CHẨN ĐOÁN'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            <StatusCard label="Số lượng Driver" value={String(drivers.length)} hint="Các adapter sẵn có từ nhân hệ thống" />
            <StatusCard label="Trạng thái cuối" value={diagnosticResult?.status === 'success' ? 'THÀNH CÔNG' : diagnosticResult?.status === 'error' ? 'THẤT BẠI' : 'CHỜ'} hint="Kết quả của lần thử nghiệm gần nhất" />
            <StatusCard label="Độ trễ" value={diagnosticResult ? `${diagnosticResult.latency_ms}ms` : 'N/A'} hint="Thời gian phản hồi vòng lặp cuối cùng" />
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

        <section className="rounded-3xl border border-slate-100 bg-white/50 p-8">
          {!hasResult && !diagnosticLoading && (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-sm text-slate-400">
              Hãy thực hiện một lần quét để kiểm tra độ sẵn sàng của driver, lỗi xác thực và độ trễ phản hồi thực tế.
            </div>
          )}

          {diagnosticLoading && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-6">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-[10px] font-heading font-black uppercase tracking-[0.3em] text-primary animate-pulse">Đang bắt nhip driver...</p>
            </div>
          )}

          {diagnosticResult && !diagnosticLoading && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">Kết quả Chẩn đoán</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{diagnosticResult.driver}</h3>
                </div>
                <div className={`rounded-full border px-6 py-2.5 text-[10px] font-heading font-black uppercase tracking-widest ${isError ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                  {isError ? 'LỖI HỆ THỐNG' : 'HOẠT ĐỘNG TỐT'}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <StatusCard label="Phản hồi" value={`${diagnosticResult.latency_ms}ms`} hint="Thời gian xử lý phía server" />
                <StatusCard label="Kiểm tra lúc" value={new Date(diagnosticResult.checked_at).toLocaleTimeString()} hint="Theo giờ trình duyệt nội bộ" />
                <StatusCard label="Kích thước" value={`${diagnosticResult.prompt.length}`} hint="Số ký tự đã được gửi đi" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <OutputBlock title="Câu lệnh gốc" body={diagnosticResult.prompt} />
                <OutputBlock
                  title={isError ? 'Thông báo lỗi' : 'Kết quả phản hồi'}
                  isError={isError}
                  body={isError ? diagnosticResult.error || 'Lỗi driver không xác định.' : diagnosticResult.response || 'Driver trả về kết quả trống.'}
                />
              </div>

              {isError && (
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRunDiagnostic();
                    }}
                    className="rounded-xl bg-rose-600 px-8 py-3 text-[10px] font-heading font-black uppercase tracking-widest text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700"
                  >
                    THỬ LẠI CHẨN ĐOÁN
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  };

  const activeTabMeta = aiTabs.find((tab) => tab.id === activeTab) ?? aiTabs[0];
  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <div className="space-y-10">
      <header className="sticky top-6 z-30">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Settings size={20} className="text-white" />
              </div>
              <div className="min-w-0 space-y-3">
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">Qu\u1ea3n tr\u1ecb AI</h1>
                  <p className="mt-1 text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">
                    Core / Matrix / Kernel
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-heading font-black uppercase tracking-[0.18em] text-slate-500">
                    <ActiveTabIcon size={12} />
                    {activeTabMeta.label}
                  </span>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-heading font-black uppercase tracking-[0.18em] text-emerald-600">
                    H\u1ec7 th\u1ed1ng s\u1eb5n s\u00e0ng
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                onClick={handleImport}
                title="Nh\u1eadp c\u1ea5u h\u00ecnh t\u1eeb t\u1ec7p tin"
                className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-heading font-black uppercase tracking-[0.18em] text-slate-600 transition-all hover:border-primary hover:text-primary hover:bg-slate-50"
              >
                <Download size={14} />
                Nh\u1eadp
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                title="\u0110\u1ed3ng b\u1ed9"
                className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-heading font-black uppercase tracking-[0.18em] text-slate-600 transition-all hover:border-primary hover:text-primary hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                \u0110\u1ed3ng b\u1ed9
              </button>
              {activeTab === 'config' && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[10px] font-heading font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  L\u01b0u c\u1ea5u h\u00ecnh
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-1.5">
              {aiTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[9px] font-heading font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? `${tab.activeClassName} scale-[1.01]`
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <tab.icon size={13} className={activeTab === tab.id ? '' : 'text-slate-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="min-w-0 min-h-[600px] bg-slate-50/30 rounded-3xl p-8 border border-white/50 shadow-inner">
        {activeTab === 'config' && (
          loading ? (
            <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="animate-pulse text-xs font-heading font-bold uppercase tracking-[0.2em] text-slate-400">
                Đang tải cấu hình kernel...
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {renderGroup('feature', 'Tính năng điều phối', Cpu)}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              {renderGroup('provider', 'Nhà cung cấp & cụm LLM', Database)}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              {renderGroup('general', 'Hệ thống kernel', ShieldCheck)}
            </div>
          )
        )}

        {activeTab === 'matrix' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
            <BrainMatrix />
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <KeyPool />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 text-slate-900">
            <AiLogViewer />
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {renderDiagnostics()}
          </div>
        )}
      </main>
    </div>
  );
};

function StatusCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm group hover:border-primary/20 transition-all">
      <p className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-900 tracking-tighter font-heading">{value}</p>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500 font-medium">{hint}</p>
    </div>
  );
}

function OutputBlock({ title, body, isError = false }: { title: string; body: string; isError?: boolean }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-6">
      <p className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <pre className={`overflow-auto whitespace-pre-wrap text-xs leading-relaxed font-heading font-bold ${isError ? 'text-rose-600' : 'text-slate-700'}`}>{body}</pre>
    </div>
  );
}

export default AiConfigPage;
