"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface SnapshotPoint {
  tick: number;
  entropy: number;
  stability_index: number;
  population?: number;
}

interface UniverseTimelineChartProps {
  universeId: number;
  limit?: number;
  className?: string;
}

export function UniverseTimelineChart({
  universeId,
  limit = 200,
  className = "",
}: UniverseTimelineChartProps) {
  const [data, setData] = useState<SnapshotPoint[]>([]);
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
        const points: SnapshotPoint[] = raw.map((row: Record<string, unknown>) => {
          const metrics = (row.metrics as Record<string, unknown>) ?? {};
          return {
            tick: Number(row.tick ?? 0),
            entropy: Number(row.entropy ?? 0),
            stability_index: Number(row.stability_index ?? 0),
            population:
              typeof metrics.population === "number"
                ? metrics.population
                : typeof metrics.actor_count === "number"
                  ? metrics.actor_count
                  : undefined,
          };
        });
        setData(points);
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

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-[280px] text-muted-foreground ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-2 text-sm">Đang tải timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center h-[280px] text-red-400/80 text-sm ${className}`}
      >
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-[280px] text-muted-foreground italic text-sm ${className}`}
      >
        Chưa có dữ liệu snapshot.
      </div>
    );
  }

  const entropyRange = Math.max(...data.map((d) => d.entropy)) - Math.min(...data.map((d) => d.entropy));
  const stabilityRange = Math.max(...data.map((d) => d.stability_index)) - Math.min(...data.map((d) => d.stability_index));
  const hasNoVariance = entropyRange < 1e-6 && stabilityRange < 1e-6;

  return (
    <div className={`space-y-1 ${className}`}>
      {hasNoVariance && (
        <p className="text-[10px] text-amber-500/90 italic">
          Entropy và Stability gần như không đổi trong khoảng tick này — có thể simulation chưa tạo biến động. Chạy thêm tick hoặc kiểm tra engine.
        </p>
      )}
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="tick"
            type="number"
            domain={["dataMin", "dataMax"]}
            stroke="rgba(148,163,184,0.5)"
            tick={{ fill: "rgba(148,163,184,0.8)", fontSize: 11 }}
            tickFormatter={(v) => `tick ${v}`}
          />
          <YAxis
            yAxisId="left"
            stroke="rgba(148,163,184,0.5)"
            tick={{ fill: "rgba(148,163,184,0.8)", fontSize: 11 }}
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          {data.some((d) => d.population != null) && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgba(148,163,184,0.5)"
              tick={{ fill: "rgba(148,163,184,0.8)", fontSize: 11 }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(71,85,105,0.5)",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "rgba(148,163,184,0.9)" }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const label =
                name === "entropy"
                  ? "Entropy"
                  : name === "stability_index"
                    ? "Stability"
                    : "Population";
              const formatted =
                value != null && (name === "entropy" || name === "stability_index")
                  ? `${(value * 100).toFixed(1)}%`
                  : value ?? "--";
              return [formatted, label];
            }}
            labelFormatter={(tick) => `Tick ${tick}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) =>
              value === "entropy"
                ? "Entropy"
                : value === "stability_index"
                  ? "Stability"
                  : value === "population"
                    ? "Population"
                    : value
            }
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="entropy"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            name="entropy"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="stability_index"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            name="stability_index"
          />
          {data.some((d) => d.population != null) && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="population"
              stroke="#facc15"
              strokeWidth={2}
              dot={false}
              name="population"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}
