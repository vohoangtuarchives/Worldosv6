"use client";

import React from "react";
import { useSimulation } from "@/context/SimulationContext";
import { AlertTriangle, Zap, Activity, Flame, Wind, TrendingUp, Infinity } from "lucide-react";

interface PressureBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  warningThreshold?: number;
  dangerThreshold?: number;
  color: string;
  hint?: string;
}

function PressureBar({ label, value, icon, warningThreshold = 0.6, dangerThreshold = 0.8, color, hint }: PressureBarProps) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  const isDanger = value >= dangerThreshold;
  const isWarning = value >= warningThreshold;
  const barColor = isDanger ? "bg-red-500" : isWarning ? "bg-amber-400" : color;

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <span className={`text-xs font-mono font-semibold ${isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-foreground"}`}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${isDanger ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && isDanger && (
        <p className="text-[10px] text-red-400 leading-tight">{hint}</p>
      )}
    </div>
  );
}

interface RawStatProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function RawStat({ label, value, sub, accent = "text-foreground" }: RawStatProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-lg font-mono font-bold leading-tight ${accent}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function UniverseRawMetricsPanel() {
  const { latestSnapshot, universe } = useSimulation();

  if (!latestSnapshot && !universe) {
    return (
      <div className="border border-border rounded-lg bg-card/40 px-4 py-3 text-sm text-muted-foreground">
        Chưa có dữ liệu vũ trụ — hãy chọn một Universe từ thanh trên.
      </div>
    );
  }

  const tick = latestSnapshot?.tick ?? universe?.current_tick ?? 0;
  const entropy = parseFloat(latestSnapshot?.entropy ?? universe?.entropy ?? 0);
  const metrics = latestSnapshot?.metrics ?? {};
  const stateVector = latestSnapshot?.state_vector ?? {};
  const pressures = stateVector?.pressures ?? metrics?.pressures ?? {};

  // Core metrics
  const order = parseFloat(metrics?.order ?? stateVector?.order ?? 0);
  const energy = parseFloat(metrics?.energy_level ?? stateVector?.energy ?? universe?.level ?? 0);
  const complexity = parseFloat(metrics?.civilization_complexity ?? 0);
  const stabilityIndex = parseFloat(latestSnapshot?.stability_index ?? 1);
  const epoch = universe?.epoch ?? 1;
  const globalState = universe?.global_state ?? universe?.status ?? "active";
  
  // Metaphysical metrics
  const causalIntegrity = parseFloat(stateVector?.meta?.causal_integrity ?? 1.0);
  const foodSecurity = parseFloat(stateVector?.food_security ?? 1.0);
  const timeSaliency = parseFloat(stateVector?.meta?.zenith?.cosmic?.time_saliency ?? stateVector?.meta?.time_saliency ?? 1.0);
  const consciousnessField = parseFloat(stateVector?.meta?.zenith?.meta?.consciousness_field ?? stateVector?.consciousness_field ?? 0.0);

  // Pressures
  const collapsePressure = parseFloat(pressures?.collapse_pressure ?? 0);
  const ascensionPressure = parseFloat(pressures?.ascension_pressure ?? 0);
  const chaosPressure = parseFloat(pressures?.chaos_pressure ?? 0);
  const civilizationalPressure = parseFloat(pressures?.civilizational_pressure ?? 0);
  const omegaPressure = parseFloat(pressures?.omega_pressure ?? metrics?.omega_points ?? 0);

  // Alerts
  const alerts: string[] = [];
  if (ascensionPressure >= 0.85) alerts.push("⚡ Φ-áp suất Phi thăng ≥ 85% — AscensionEngine có thể kích hoạt");
  if (collapsePressure >= 0.75) alerts.push("💀 Áp suất Sụp đổ ≥ 75% — GreatFilterEngine / EschatonEngine sẵn sàng");
  if (chaosPressure >= 0.6) alerts.push("🌀 Hỗn loạn ≥ 60% — EntropyEngine tăng tốc thoái hóa trật tự");
  if (omegaPressure >= 0.8) alerts.push("∞ Áp lực Omega ≥ 80% — OmegaPointEngine tiếp cận ngưỡng kỳ dị");

  const statusBadge: Record<string, { label: string; cls: string }> = {
    active: { label: "Đang chạy", cls: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
    archived: { label: "Đã lưu trữ", cls: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
    ascended: { label: "Phi thăng", cls: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
    collapsed: { label: "Sụp đổ", cls: "text-red-400 border-red-500/40 bg-red-500/10" },
  };
  const badge = statusBadge[globalState] ?? { label: globalState, cls: "text-muted-foreground border-border bg-muted/30" };

  const hasPressureData = collapsePressure > 0 || ascensionPressure > 0 || chaosPressure > 0;

  return (
    <div className="border border-border rounded-lg bg-card/60 backdrop-blur overflow-hidden">
      {/* Header Row */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chỉ số Vũ trụ</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>{badge.label}</span>

        {collapsePressure >= 0.75 && (
          <span className="text-[10px] px-2 py-0.5 rounded border border-red-500/50 bg-red-500/20 text-red-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse hidden sm:flex items-center gap-1 uppercase">
            <AlertTriangle className="w-3 h-3" /> Đại Lọc (Great Filter) V9 Đang Kích Hoạt
          </span>
        )}
        {ascensionPressure >= 0.1 && (
          <span className="text-[10px] px-2 py-0.5 rounded border border-violet-500/50 bg-violet-500/20 text-violet-300 font-bold hidden sm:flex items-center gap-1 uppercase">
            <Zap className="w-3 h-3" /> Phi Thăng V16: {(ascensionPressure * 100).toFixed(0)}%
          </span>
        )}

        <span className="text-xs font-mono text-muted-foreground ml-auto hidden sm:block">Epoch {epoch} · Tick {tick}</span>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 px-4 py-3 border-b border-border/40">
        <RawStat
          label="Entropy"
          value={entropy.toFixed(4)}
          sub={entropy < 0.1 ? "Đóng băng" : entropy > 0.8 ? "Hỗn loạn cực đại" : "Bình thường"}
          accent={entropy > 0.7 ? "text-red-400" : entropy < 0.05 ? "text-blue-400" : "text-foreground"}
        />
        <RawStat
          label="Order"
          value={order.toFixed(4)}
          sub={order > 0.9 ? "Trật tự cực cao" : order < 0.3 ? "Hỗn loạn" : ""}
          accent={order > 0.95 ? "text-violet-400" : order < 0.3 ? "text-amber-400" : "text-foreground"}
        />
        <RawStat
          label="Energy Level"
          value={energy.toFixed(3)}
          sub="Năng lượng vũ trụ"
        />
        <RawStat
          label="Complexity"
          value={complexity.toFixed(4)}
          sub="Văn minh"
          accent={complexity > 0.5 ? "text-cyan-400" : "text-foreground"}
        />
        <RawStat
          label="Stability"
          value={(stabilityIndex * 100).toFixed(1) + "%"}
          sub="Chỉ số ổn định"
          accent={stabilityIndex < 0.3 ? "text-red-400" : stabilityIndex > 0.8 ? "text-emerald-400" : "text-foreground"}
        />
        <RawStat
          label="Causal Integrity"
          value={(causalIntegrity * 100).toFixed(1) + "%"}
          sub="Tính toàn vẹn"
          accent={causalIntegrity < 0.5 ? "text-rose-400" : "text-foreground"}
        />
        <RawStat
          label="Food Security"
          value={foodSecurity.toFixed(2)}
          sub="An ninh lương thực"
          accent={foodSecurity < 0.6 ? "text-red-400" : foodSecurity > 1.2 ? "text-emerald-400" : "text-foreground"}
        />
        <RawStat
          label="Time Saliency"
          value={timeSaliency.toFixed(2)}
          sub="Độ cong thời gian (Tickless)"
          accent={timeSaliency > 2 ? "text-amber-400" : "text-violet-400"}
        />
        <RawStat
          label="Consciousness"
          value={(consciousnessField * 100).toFixed(1) + "%"}
          sub="Trường ý thức vĩ mô"
          accent={consciousnessField > 0.8 ? "text-fuchsia-400" : "text-foreground"}
        />
        <RawStat
          label="Cấp độ"
          value={`Lv. ${universe?.level ?? 1}`}
          sub={`${universe?.name ?? "Unknown"}`}
        />
      </div>

      {/* Pressure Bars */}
      {hasPressureData ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-3 border-b border-border/40">
          <PressureBar
            label="Sụp đổ"
            value={collapsePressure}
            icon={<AlertTriangle className="w-3 h-3" />}
            color="bg-orange-500"
            dangerThreshold={0.75}
            hint="EschatonEngine kích hoạt khi ≥ 75%"
          />
          <PressureBar
            label="Phi thăng"
            value={ascensionPressure}
            icon={<Zap className="w-3 h-3" />}
            color="bg-violet-500"
            dangerThreshold={0.85}
            hint="AscensionEngine kích hoạt khi ≥ 85%"
          />
          <PressureBar
            label="Hỗn loạn"
            value={chaosPressure}
            icon={<Wind className="w-3 h-3" />}
            color="bg-amber-500"
            dangerThreshold={0.6}
            hint="EntropyEngine tăng tốc khi ≥ 60%"
          />
          {civilizationalPressure > 0 && (
            <PressureBar
              label="Văn minh"
              value={civilizationalPressure}
              icon={<TrendingUp className="w-3 h-3" />}
              color="bg-cyan-500"
              dangerThreshold={0.75}
            />
          )}
          {omegaPressure > 0 && (
            <PressureBar
              label="Omega"
              value={omegaPressure}
              icon={<Infinity className="w-3 h-3" />}
              color="bg-rose-500"
              dangerThreshold={0.8}
              hint="OmegaPointEngine tiếp cận kỳ dị khi ≥ 80%"
            />
          )}
        </div>
      ) : (
        <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/40 italic">
          Pressure data chưa có — simulation cần chạy ít nhất 1 tick để tính toán áp suất
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-1 px-4 py-2 bg-red-500/5 border-b border-red-500/20">
          {alerts.map((a, i) => (
            <p key={i} className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {a}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
