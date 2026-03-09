"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Cloud, Mountain, Thermometer, Droplets } from "lucide-react";

type ZoneEnv = {
  id: number | string;
  temperature: number | null;
  rainfall: number | null;
  ecosystem_state: string | null;
  target_ecosystem_state: string | null;
  transition_progress: number | null;
  elevation: number | null;
  terrain_type: string | null;
  mineral_richness: number | null;
  ice_coverage: number | null;
};

interface EnvironmentMetrics {
  current_tick: number;
  zones: ZoneEnv[];
}

const biomeLabels: Record<string, string> = { forest: "Rừng", grassland: "Đồng cỏ", desert: "Sa mạc" };
const terrainLabels: Record<string, string> = { lowland: "Đồng bằng", highland: "Cao nguyên", mountain: "Núi", volcanic: "Núi lửa" };

export function EnvironmentPanel({ universeId, refreshTrigger = 0 }: { universeId: number | null; refreshTrigger?: number }) {
  const [data, setData] = useState<EnvironmentMetrics | null>(null);
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
      .environmentMetrics(universeId)
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
  if (loading) return <div className="text-xs text-muted-foreground p-2">Đang tải môi trường…</div>;
  if (error) return <div className="text-xs text-red-400 p-2">Lỗi: {error}</div>;
  if (!data) return null;

  const zones = data.zones ?? [];
  const hasAny = zones.some(
    (z) =>
      z.temperature != null ||
      z.rainfall != null ||
      z.ecosystem_state != null ||
      z.elevation != null ||
      z.terrain_type != null
  );

  if (!hasAny) {
    return (
      <div className="space-y-3 text-xs">
        <h3 className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Cloud className="w-3 h-3" /> Khí hậu & Địa chất
        </h3>
        <div className="text-muted-foreground text-[10px] p-2">Chưa có dữ liệu. Dùng nút <strong className="text-muted-foreground">Advance</strong> hoặc <strong className="text-muted-foreground">Pulse</strong> trên đầu trang để chạy mô phỏng, engine sẽ cập nhật khí hậu & địa chất theo zone.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
        <Cloud className="w-3 h-3" /> Khí hậu & Địa chất
      </h3>
      <div className="space-y-2 max-h-56 overflow-auto">
        {zones.slice(0, 12).map((z) => (
          <div
            key={z.id}
            className="p-2 rounded bg-muted/30 border border-border/50 space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span>Khu {z.id}</span>
              {z.ecosystem_state && (
                <span className="text-emerald-400/90">
                  {biomeLabels[z.ecosystem_state] ?? z.ecosystem_state}
                  {z.target_ecosystem_state && z.transition_progress != null && z.transition_progress > 0 && z.transition_progress < 1 && (
                    <span className="text-muted-foreground ml-1">→ {(z.transition_progress * 100).toFixed(0)}%</span>
                  )}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
              {z.temperature != null && (
                <span className="flex items-center gap-1 text-foreground">
                  <Thermometer className="w-2.5 h-2.5 text-orange-400" />
                  {(z.temperature * 100).toFixed(0)}%
                </span>
              )}
              {z.rainfall != null && (
                <span className="flex items-center gap-1 text-foreground">
                  <Droplets className="w-2.5 h-2.5 text-blue-400" />
                  {(z.rainfall * 100).toFixed(0)}%
                </span>
              )}
              {z.elevation != null && (
                <span className="flex items-center gap-1 text-foreground">
                  <Mountain className="w-2.5 h-2.5 text-amber-500" />
                  {(z.elevation * 100).toFixed(0)}%
                </span>
              )}
              {z.terrain_type && (
                <span className="text-muted-foreground">{terrainLabels[z.terrain_type] ?? z.terrain_type}</span>
              )}
              {z.ice_coverage != null && z.ice_coverage > 0 && (
                <span className="col-span-2 text-sky-300">Băng: {(z.ice_coverage * 100).toFixed(0)}%</span>
              )}
              {z.mineral_richness != null && (
                <span className="text-muted-foreground">Khoáng: {(z.mineral_richness * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
        ))}
        {zones.length > 12 && (
          <div className="text-muted-foreground text-[10px] px-2">+{zones.length - 12} khu</div>
        )}
      </div>
    </div>
  );
}
