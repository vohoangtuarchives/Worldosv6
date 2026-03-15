"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Cloud, Mountain, Thermometer, Droplets, Skull, Biohazard, Sprout } from "lucide-react";
import { useSimulation } from "@/context/SimulationContext";

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

const biomeLabels: Record<string, string> = { forest: "Rừng", grassland: "Đồng cỏ", desert: "Sa mạc", tundra: "Đồng rêu", aquatic: "Môi trường nước" };
const terrainLabels: Record<string, string> = { lowland: "Đồng bằng", highland: "Cao nguyên", mountain: "Núi", volcanic: "Núi lửa" };

export function EcologyPanel({ universeId, refreshTrigger = 0 }: { universeId: number | null; refreshTrigger?: number }) {
  const [data, setData] = useState<EnvironmentMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { latestSnapshot } = useSimulation();

  useEffect(() => {
    if (!universeId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .environmentMetrics(universeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId, refreshTrigger]);

  if (!universeId) return null;

  const metrics = latestSnapshot?.metrics ?? {};
  const starvingCount = metrics.starving_count ?? 0;
  const plagues = metrics.plague_outbreaks ?? 0;
  const mutationRate = metrics.mutation_rate ?? 0;

  const zones = data?.zones ?? [];
  const hasAnyZoneInfo = zones.some(
    (z) =>
      z.temperature != null ||
      z.rainfall != null ||
      z.ecosystem_state != null ||
      z.elevation != null ||
      z.terrain_type != null
  );

  return (
    <div className="space-y-4 text-xs">
      <h3 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2 border-b border-border/50 pb-2">
        <Sprout className="w-4 h-4" /> Hệ Sinh Thái & Khí Hậu Vĩ Mô
      </h3>

      {/* Biological Disasters / Anomalies */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`flex flex-col gap-1 p-2 rounded border ${starvingCount > 10 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/30 border-border/50'}`}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Skull className={`w-3.5 h-3.5 ${starvingCount > 10 ? 'text-amber-400' : ''}`} />
            <span>Nạn Đói</span>
          </div>
          <span className={`font-mono text-sm ${starvingCount > 10 ? 'text-amber-400 font-bold' : 'text-foreground'}`}>
            {starvingCount}
          </span>
        </div>
        
        <div className={`flex flex-col gap-1 p-2 rounded border ${plagues > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-muted/30 border-border/50'}`}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Biohazard className={`w-3.5 h-3.5 ${plagues > 0 ? 'text-rose-400 animate-pulse' : ''}`} />
            <span>Dịch Bệnh</span>
          </div>
          <span className={`font-mono text-sm ${plagues > 0 ? 'text-rose-400 font-bold' : 'text-foreground'}`}>
            {plagues} <span className="text-[10px] font-normal text-muted-foreground">ổ dịch</span>
          </span>
        </div>

        <div className="flex flex-col gap-1 p-2 rounded border bg-muted/30 border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đột Biến</span>
          </div>
          <span className="font-mono text-sm text-foreground">
            {mutationRate > 0 ? (mutationRate * 100).toFixed(1) + "%" : "0%"}
          </span>
        </div>
      </div>

      {loading && !data && <div className="text-xs text-muted-foreground p-2">Đang tải cấu trúc địa tầng…</div>}
      
      {!hasAnyZoneInfo && data && (
        <div className="text-muted-foreground text-[10px] p-2 bg-muted/30 rounded border border-border/50">
          Chưa hình thành cấu trúc địa tầng. Biomes sẽ phát triển khi vũ trụ tiến hóa thêm.
        </div>
      )}

      {/* Zones Grid */}
      {hasAnyZoneInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
          {zones.slice(0, 16).map((z) => (
            <div
              key={z.id}
              className="p-2.5 rounded bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] font-medium border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Khu {z.id}</span>
                {z.ecosystem_state && (
                  <span className="text-emerald-400/90 flex items-center gap-1">
                    {biomeLabels[z.ecosystem_state] ?? z.ecosystem_state}
                    {z.target_ecosystem_state && z.transition_progress != null && z.transition_progress > 0 && z.transition_progress < 1 && (
                      <span className="text-muted-foreground ml-1 text-[10px]">
                        → {(z.transition_progress * 100).toFixed(0)}% ({biomeLabels[z.target_ecosystem_state] ?? z.target_ecosystem_state})
                      </span>
                    )}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1.5 text-[10px]">
                {z.temperature != null && (
                  <span className="flex items-center gap-1.5 text-foreground bg-orange-500/10 px-1.5 py-0.5 rounded">
                    <Thermometer className="w-3 h-3 text-orange-400" />
                    {(z.temperature * 100).toFixed(0)}%
                  </span>
                )}
                {z.rainfall != null && (
                  <span className="flex items-center gap-1.5 text-foreground bg-blue-500/10 px-1.5 py-0.5 rounded">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    {(z.rainfall * 100).toFixed(0)}%
                  </span>
                )}
                {z.elevation != null && (
                  <span className="flex items-center gap-1.5 text-foreground bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <Mountain className="w-3 h-3 text-amber-500" />
                    {(z.elevation * 100).toFixed(0)}%
                  </span>
                )}
                {z.terrain_type && (
                  <span className="col-span-full text-muted-foreground pt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Phân lớp: <span className="text-foreground">{terrainLabels[z.terrain_type] ?? z.terrain_type}</span>
                  </span>
                )}
                {z.ice_coverage != null && z.ice_coverage > 0 && (
                  <span className="col-span-full text-sky-400/80 pt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Độ phủ băng bề mặt: {(z.ice_coverage * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
          {zones.length > 16 && (
            <div className="col-span-full text-center text-muted-foreground text-[10px] py-1 bg-muted/20 border border-border/30 rounded">
              + {zones.length - 16} vùng vi khí hậu khác
            </div>
          )}
        </div>
      )}
    </div>
  );
}
