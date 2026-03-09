"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Activity, Users, Flame, BarChart3, AlertTriangle } from "lucide-react";

interface BiologyMetrics {
  avg_energy: number;
  median_energy: number;
  starving_count: number;
  total_alive: number;
  species_count: number;
  species_distribution: Record<string, number>;
  trait_avg: Record<number, number>;
  instability_score?: number;
  ecological_collapse_active?: boolean;
  ecological_collapse_until_tick?: number | null;
  ecological_collapse_since_tick?: number | null;
  ecological_collapse_type?: string | null;
  current_tick?: number;
}

export function BiologyMetricsPanel({ universeId, refreshTrigger = 0 }: { universeId: number | null; refreshTrigger?: number }) {
  const [data, setData] = useState<BiologyMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!universeId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .biologyMetrics(universeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId, refreshTrigger]);

  if (!universeId) return null;
  if (loading) return <div className="text-xs text-slate-500 p-2">Đang tải chỉ số sinh học…</div>;
  if (error) return <div className="text-xs text-red-400 p-2">Lỗi: {error}</div>;
  if (!data) return null;

  const starvingRate = data.total_alive > 0 ? (data.starving_count / data.total_alive) * 100 : 0;
  const collapseActive = data.ecological_collapse_active === true;
  const untilTick = data.ecological_collapse_until_tick ?? 0;
  const sinceTick = data.ecological_collapse_since_tick ?? 0;
  const currentTick = data.current_tick ?? 0;
  const collapseDuration = untilTick > sinceTick ? untilTick - sinceTick : 1;
  const collapseElapsed = Math.max(0, currentTick - sinceTick);
  const collapseProgressPct = Math.min(100, Math.max(0, (collapseElapsed / collapseDuration) * 100));

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
        <BarChart3 className="w-3 h-3" /> Chỉ số sinh học
      </h3>
      {collapseActive && (
        <div className="flex items-start gap-2 p-2 rounded bg-amber-900/30 border border-amber-600/50">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-amber-200 font-medium">
              Sụp đổ sinh thái ({data.ecological_collapse_type ?? "active"})
            </div>
            <div className="text-amber-200/80 mt-0.5">
              Kết thúc tick {untilTick}
              {currentTick > 0 && untilTick > currentTick && (
                <span className="ml-1">({untilTick - currentTick} ticks còn lại)</span>
              )}
            </div>
            {untilTick > currentTick && (
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-amber-500/80 rounded-full transition-all"
                  style={{ width: `${collapseProgressPct}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {(data.instability_score ?? 0) > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <span className="text-slate-400">Độ bất ổn</span>
          <span className="font-mono text-slate-200">{(data.instability_score ?? 0).toFixed(2)}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <div className="text-slate-400">Năng lượng TB</div>
            <div className="font-mono text-slate-200">{data.avg_energy.toFixed(1)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <div>
            <div className="text-slate-400">Đói (số / %)</div>
            <div className="font-mono text-slate-200">
              {data.starving_count} / {starvingRate.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <div className="text-slate-400">Sống / Loài</div>
            <div className="font-mono text-slate-200">
              {data.total_alive} / {data.species_count}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <span className="text-slate-400">Median E</span>
          <span className="font-mono text-slate-200">{data.median_energy.toFixed(1)}</span>
        </div>
      </div>
      {data.species_count > 0 && Object.keys(data.species_distribution).length <= 8 && (
        <div className="p-2 rounded bg-slate-800/30 border border-slate-700/50">
          <div className="text-[10px] text-slate-500 mb-1">Phân bố loài</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.species_distribution).map(([sid, count]) => (
              <span
                key={sid}
                className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 font-mono"
                title={`${sid}: ${count}`}
              >
                {sid}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
