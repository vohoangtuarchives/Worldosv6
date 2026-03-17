"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface ZoneData {
  id: number;
  x: number;
  y: number;
  entropy: number;
  dominant_institution?: { name: string; type: string; influence: number } | null;
  culture?: string | null;
}

interface CivilizationMapProps {
  universeId: number;
  className?: string;
}

function entropyColor(entropy: number): string {
  if (entropy < 0.4) return "rgba(34,197,94,0.8)"; // green
  if (entropy < 0.7) return "rgba(234,179,8,0.8)"; // yellow
  return "rgba(239,68,68,0.8)"; // red
}

export function CivilizationMap({
  universeId,
  className = "",
}: CivilizationMapProps) {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .topology(universeId)
      .then((res: unknown) => {
        if (cancelled) return;
        const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
        setZones(
          raw.map((z: Record<string, unknown>) => ({
            id: Number(z.id ?? 0),
            x: Number(z.x ?? 50),
            y: Number(z.y ?? 50),
            entropy: Number((z.entropy as number) ?? 0),
            dominant_institution: z.dominant_institution as ZoneData["dominant_institution"],
            culture: z.culture as string | undefined,
          }))
        );
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Lỗi tải topology");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-[260px] text-muted-foreground ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-2 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center min-h-[260px] text-red-400/80 text-sm ${className}`}
      >
        {error}
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div
        className={`flex items-center justify-center min-h-[260px] text-muted-foreground italic text-sm ${className}`}
      >
        Chưa có zone trong topology.
      </div>
    );
  }

  const padding = 24;
  const w = 400;
  const h = 260;
  const scaleX = (v: number) => padding + (v / 100) * (w - 2 * padding);
  const scaleY = (v: number) => padding + (v / 100) * (h - 2 * padding);

  return (
    <div className={`relative max-w-full ${className}`} style={{ width: w, height: h, maxWidth: "100%" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
        {zones.map((zone) => {
          const cx = scaleX(zone.x);
          const cy = scaleY(zone.y);
          const r = 14;
          const fill = entropyColor(zone.entropy);
          return (
            <g key={zone.id}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                stroke="rgba(148,163,184,0.4)"
                strokeWidth={1}
                className="cursor-pointer hover:stroke-muted-foreground"
              />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fill="rgba(15,23,42,0.9)"
                fontSize="10"
                fontWeight="600"
              >
                {zone.id}
              </text>
              {zone.dominant_institution && (
                <title>
                  Zone {zone.id}: {zone.dominant_institution.name} ({zone.dominant_institution.type}), entropy: {(zone.entropy * 100).toFixed(0)}%
                </title>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 flex gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500/80" /> Ổn định
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500/80" /> Căng thẳng
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/80" /> Cao entropy
        </span>
      </div>
    </div>
  );
}
