"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, TrendingUp, Shield, Swords } from "lucide-react";

type Settlement = { level: string; governance: string; population: number; resource_surplus: number };

interface SocietyMetrics {
  current_tick: number;
  settlements: Record<string, Settlement>;
  total_population: number;
  economy: { total_surplus: number; total_consumption: number; updated_tick: number } | null;
  politics: { military_power: number; economic_power: number; legitimacy: number; stability: number; updated_tick: number } | null;
  war: { military_power: number; conflict_pressure: number; updated_tick: number } | null;
}

export function SocietyMetricsPanel({ universeId, refreshTrigger = 0 }: { universeId: number | null; refreshTrigger?: number }) {
  const [data, setData] = useState<SocietyMetrics | null>(null);
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
      .societyMetrics(universeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [universeId, refreshTrigger]);

  if (!universeId) return null;
  if (loading) return <div className="text-xs text-slate-500 p-2">Đang tải chỉ số xã hội…</div>;
  if (error) return <div className="text-xs text-red-400 p-2">Lỗi: {error}</div>;
  if (!data) return null;

  const settlements = data.settlements && typeof data.settlements === "object" ? Object.entries(data.settlements) : [];
  const levelLabels: Record<string, string> = { camp: "Trại", village: "Làng", town: "Thị trấn", city: "Thành phố" };
  const govLabels: Record<string, string> = { tribal: "Bộ lạc", chiefdom: "Thủ lĩnh", kingdom: "Vương quốc" };

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2">
        <Building2 className="w-3 h-3" /> Xã hội & Văn minh
      </h3>
      <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
        <span className="text-slate-400">Dân số</span>
        <span className="font-mono text-slate-200">{data.total_population}</span>
      </div>
      {settlements.length > 0 && (
        <div className="p-2 rounded bg-slate-800/30 border border-slate-700/50">
          <div className="text-[10px] text-slate-500 mb-1">Khu vực (settlement)</div>
          <div className="space-y-1 max-h-24 overflow-auto">
            {settlements.slice(0, 8).map(([zoneIdx, s]) => (
              <div key={zoneIdx} className="flex justify-between gap-2 text-slate-300">
                <span>Z{zoneIdx}: {levelLabels[s.level] ?? s.level} · {govLabels[s.governance] ?? s.governance}</span>
                <span className="font-mono text-slate-400">{s.population} dân</span>
              </div>
            ))}
            {settlements.length > 8 && <div className="text-slate-500 text-[10px]">+{settlements.length - 8} khu</div>}
          </div>
        </div>
      )}
      {data.economy != null && (
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <div className="text-slate-400">Kinh tế</div>
            <div className="font-mono text-slate-200 text-[10px]">Thặng dư: {data.economy.total_surplus.toFixed(1)} · Tiêu thụ: {data.economy.total_consumption.toFixed(1)}</div>
          </div>
        </div>
      )}
      {data.politics != null && (
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <div className="text-slate-400">Chính trị</div>
            <div className="font-mono text-slate-200 text-[10px]">Ổn định: {(data.politics.stability * 100).toFixed(0)}% · Hợp pháp: {(data.politics.legitimacy * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
      {data.war != null && (
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <Swords className="w-3.5 h-3.5 text-rose-400" />
          <div>
            <div className="text-slate-400">Xung đột</div>
            <div className="font-mono text-slate-200 text-[10px]">Sức mạnh: {data.war.military_power.toFixed(2)} · Áp lực: {(data.war.conflict_pressure * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
      {settlements.length === 0 && !data.economy && !data.politics && !data.war && (
        <div className="text-slate-500 text-[10px] p-2">
          Chưa có dữ liệu. Dùng nút <strong className="text-slate-400">Advance</strong> (1 tick) hoặc <strong className="text-slate-400">Pulse</strong> (nhiều tick) trên đầu trang để chạy mô phỏng — engine sẽ cập nhật settlement, kinh tế, chính trị.
        </div>
      )}
    </div>
  );
}
