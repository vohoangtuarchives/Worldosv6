'use client';

import { useEffect, useState } from 'react';
import { Bot, Gauge, Sparkles, Zap } from 'lucide-react';

interface DiagnosticResult {
  status: 'success' | 'error';
  driver: string;
  prompt: string;
  latency_ms: number;
  response?: string | null;
  error?: string;
  checked_at: string;
}

interface AiLogRecord {
  id: number;
  driver: string;
  latency_ms: number;
  status: string;
  input: unknown;
  output: unknown;
}

interface AiLogResponse {
  data?: AiLogRecord[];
}

function estimateTokens(value: unknown) {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return Math.ceil(text.length / 4);
  } catch {
    return 0;
  }
}

export default function AiDiagnosticsTelemetry({
  drivers,
  activeDriver,
  lastResult,
  onPing,
}: {
  drivers: string[];
  activeDriver: string;
  lastResult: DiagnosticResult | null;
  onPing: (driver: string) => void;
}) {
  const [logs, setLogs] = useState<AiLogRecord[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/ai-logs?page=1&limit=50');
        const payload = (await response.json()) as AiLogResponse;
        if (active) {
          setLogs(payload.data ?? []);
        }
      } catch {
        if (active) {
          setLogs([]);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [lastResult]);

  const successCount = logs.filter((log) => log.status === 'success').length;
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length) : 0;
  const estimatedTokens = logs.reduce((sum, log) => sum + estimateTokens(log.input) + estimateTokens(log.output), 0);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard icon={Gauge} label="Độ trễ trung bình" value={logs.length > 0 ? `${avgLatency}ms` : 'N/A'} hint="Dựa trên nhật ký kiểm tra AI gần đây" />
        <StatCard icon={Sparkles} label="Tỷ lệ thành công" value={logs.length > 0 ? `${successCount}/${logs.length}` : '0/0'} hint="Các đợt thăm dò và điều phối mới nhất" />
        <StatCard icon={Zap} label="Token ước tính" value={estimatedTokens > 0 ? `~${estimatedTokens.toLocaleString()}` : 'N/A'} hint="Ước tính từ kích thước payload gần đây" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-heading font-black uppercase tracking-[0.25em] text-slate-400 leading-none">Ping nhanh</p>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Kiểm tra sức khỏe Driver</h3>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Sử dụng bảng này để kiểm tra nhanh mức độ sẵn sàng của driver mà không làm gián đoạn cấu hình hiện tại.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {drivers.map((driver) => {
            const highlighted = activeDriver === driver;
            return (
              <button
                key={driver}
                type="button"
                onClick={() => onPing(driver)}
                className={`group rounded-2xl border p-5 text-left transition-all ${highlighted ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl border p-2.5 transition-colors ${highlighted ? 'border-primary/20 bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-400 group-hover:text-primary'}`}>
                    <Bot size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${highlighted ? 'text-primary' : 'text-slate-900'}`}>{driver}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate uppercase tracking-wider font-heading">Chạy kiểm tra ngay</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {lastResult ? (
          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Thăm dò cuối: <span className="font-bold text-slate-900">{lastResult.driver}</span></span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Lúc {new Date(lastResult.checked_at).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Trạng thái:</span>
              <span className={`font-black uppercase tracking-widest ${lastResult.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {lastResult.status === 'success' ? 'SẴN SÀNG' : 'LỖI'}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm group hover:border-primary/20 transition-all">
      <div className="flex items-center gap-2.5 text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">
        <Icon size={14} className="text-primary/60" />
        {label}
      </div>
      <p className="mt-4 text-2xl font-black text-slate-900 tracking-tighter font-heading">{value}</p>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500 font-medium">{hint}</p>
    </div>
  );
}
