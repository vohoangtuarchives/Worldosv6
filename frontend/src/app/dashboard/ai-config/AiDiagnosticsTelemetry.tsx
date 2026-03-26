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
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Gauge} label="Avg latency" value={logs.length > 0 ? `${avgLatency}ms` : 'N/A'} hint="Based on recent AI audit logs" />
        <StatCard icon={Sparkles} label="Success ratio" value={logs.length > 0 ? `${successCount}/${logs.length}` : '0/0'} hint="Recent probes and orchestration calls" />
        <StatCard icon={Zap} label="Estimated tokens" value={estimatedTokens > 0 ? `~${estimatedTokens}` : 'N/A'} hint="Approximation from recent payload sizes" />
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/20 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Quick ping</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">Driver health probes</h3>
          </div>
          <p className="text-xs text-muted-foreground">Config edits stay in the Config tab; this panel is for fast readiness checks.</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {drivers.map((driver) => {
            const highlighted = activeDriver === driver;
            return (
              <button
                key={driver}
                type="button"
                onClick={() => onPing(driver)}
                className={`rounded-2xl border p-4 text-left transition ${highlighted ? 'border-primary/40 bg-primary/10' : 'border-border/40 bg-void/30 hover:border-primary/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                    <Bot size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">{driver}</p>
                    <p className="text-xs text-muted-foreground">Run ping with current diagnostic prompt</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {lastResult ? (
          <div className="mt-4 rounded-2xl border border-border/40 bg-void/30 p-4 text-sm text-muted-foreground">
            Last probe: <span className="font-medium text-foreground">{lastResult.driver}</span> at{' '}
            {new Date(lastResult.checked_at).toLocaleTimeString()} with status{' '}
            <span className={lastResult.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>{lastResult.status}</span>.
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
    <div className="rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}
