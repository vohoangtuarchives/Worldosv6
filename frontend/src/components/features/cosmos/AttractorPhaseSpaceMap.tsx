"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

/**
 * Attractor không phải object — là pattern emergent.
 * Measure (snapshots) → Cluster (tìm vùng ổn định) → Visualize (phase space).
 * Attractor "lộ ra" từ dữ liệu, không spawn.
 */

interface Point2D {
  x: number;
  y: number;
  tick?: number;
}

function simpleKMeans(
  points: Point2D[],
  k: number,
  iterations: number
): { centroids: Point2D[]; assignments: number[] } {
  if (points.length === 0 || k <= 0) {
    return { centroids: [], assignments: [] };
  }
  if (points.length < k) k = points.length;

  let centroids = points
    .slice(0, k)
    .map((p) => ({ x: p.x, y: p.y }));
  const assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < points.length; i++) {
      let minD = Infinity;
      let best = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dx = points[i].x - centroids[c].x;
        const dy = points[i].y - centroids[c].y;
        const d = dx * dx + dy * dy;
        if (d < minD) {
          minD = d;
          best = c;
        }
      }
      assignments[i] = best;
    }

    const sums = centroids.map(() => ({ x: 0, y: 0, n: 0 }));
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      sums[c].x += points[i].x;
      sums[c].y += points[i].y;
      sums[c].n += 1;
    }
    centroids = sums.map((s) =>
      s.n > 0 ? { x: s.x / s.n, y: s.y / s.n } : { x: 0.5, y: 0.5 }
    );
  }

  return { centroids, assignments };
}

const CLUSTER_COLORS = [
  "rgba(34,197,94,0.7)",   // green  – stable
  "rgba(234,179,8,0.7)",   // yellow – tension
  "rgba(239,68,68,0.7)",   // red    – chaos
  "rgba(59,130,246,0.7)",  // blue   – order
  "rgba(168,85,247,0.7)",  // purple – meta
];

interface AttractorPhaseSpaceMapProps {
  universeId: number;
  limit?: number;
  className?: string;
}

export function AttractorPhaseSpaceMap({
  universeId,
  limit = 300,
  className = "",
}: AttractorPhaseSpaceMapProps) {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .snapshots(universeId, limit)
      .then((res: unknown) => {
        if (cancelled) return;
        const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
        const pts: Point2D[] = raw.map((row: Record<string, unknown>) => ({
          x: Number(row.entropy ?? 0.5),
          y: Number(row.stability_index ?? 0.5),
          tick: Number(row.tick ?? 0),
        }));
        setPoints(pts);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Lỗi tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId, limit]);

  const { centroids, assignments } = useMemo(() => {
    const k = Math.min(5, Math.max(2, Math.ceil(points.length / 30)));
    return simpleKMeans(points, k, 25);
  }, [points]);

  const padding = 40;
  const w = 400;
  const h = 280;
  const scaleX = (v: number) => padding + (v * (w - 2 * padding));
  const scaleY = (v: number) => padding + (1 - v) * (h - 2 * padding);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-[280px] text-slate-500 ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-2 text-sm">Đang đo & gom cụm...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center min-h-[280px] text-red-400/80 text-sm ${className}`}
      >
        {error}
      </div>
    );
  }

  if (points.length < 3) {
    return (
      <div
        className={`flex items-center justify-center min-h-[280px] text-slate-500 italic text-sm ${className}`}
      >
        Chưa đủ dữ liệu để lộ attractor (cần ≥3 snapshot).
      </div>
    );
  }

  return (
    <div className={`space-y-2 max-w-full ${className}`}>
      <p className="text-[10px] text-slate-500 italic">
        Measure → Cluster → Visualize. Attractor lộ ra từ dữ liệu, không spawn.
      </p>
      <div className="relative" style={{ width: w, height: h, maxWidth: "100%" }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
        >
          <defs>
            {centroids.map((_, i) => (
              <radialGradient key={i} id={`attractor-glow-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={CLUSTER_COLORS[i]} stopOpacity="0.4" />
                <stop offset="100%" stopColor={CLUSTER_COLORS[i]} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((v) => (
            <g key={v}>
              <line
                x1={scaleX(v)}
                y1={padding}
                x2={scaleX(v)}
                y2={h - padding}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth={1}
              />
              <line
                x1={padding}
                y1={scaleY(v)}
                x2={w - padding}
                y2={scaleY(v)}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth={1}
              />
            </g>
          ))}
          {/* Points (trajectory in state space) */}
          {points.map((p, i) => {
            const c = assignments[i] ?? 0;
            return (
              <circle
                key={`p-${i}`}
                cx={scaleX(p.x)}
                cy={scaleY(p.y)}
                r={3}
                fill={CLUSTER_COLORS[c]}
                stroke="rgba(15,23,42,0.6)"
                strokeWidth={1}
              />
            );
          })}
          {/* Emergent attractors (centroids) */}
          {centroids.map((c, i) => (
            <g key={`c-${i}`}>
              <circle
                cx={scaleX(c.x)}
                cy={scaleY(c.y)}
                r={24}
                fill={`url(#attractor-glow-${i})`}
              />
              <circle
                cx={scaleX(c.x)}
                cy={scaleY(c.y)}
                r={8}
                fill={CLUSTER_COLORS[i]}
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
              />
              <text
                x={scaleX(c.x)}
                y={scaleY(c.y) - 14}
                textAnchor="middle"
                fill="rgba(148,163,184,0.95)"
                fontSize="9"
                fontWeight="600"
              >
                Attractor {i + 1}
              </text>
            </g>
          ))}
          {/* Axis labels */}
          <text x={w / 2} y={h - 8} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="10">
            Entropy →
          </text>
          <text
            x={12}
            y={h / 2}
            textAnchor="middle"
            fill="rgba(148,163,184,0.6)"
            fontSize="10"
            transform={`rotate(-90, 12, ${h / 2})`}
          >
            Stability ↑
          </text>
        </svg>
      </div>
      <div className="text-[10px] text-slate-500">
        Trục X: entropy. Trục Y: stability. Chấm = mỗi tick. Vòng tròn lớn = attractor emergent (tâm cụm).
      </div>
    </div>
  );
}
