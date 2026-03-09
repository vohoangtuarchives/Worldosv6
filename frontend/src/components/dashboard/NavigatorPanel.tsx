"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UniverseDecisionMetrics } from "@/types/simulation";
import { Compass, Zap, Layers, GitBranch } from "lucide-react";

interface NavigatorPanelProps {
  universeId: number | null;
  refreshTrigger?: number;
}

export function NavigatorPanel({ universeId, refreshTrigger = 0 }: NavigatorPanelProps) {
  const [data, setData] = useState<UniverseDecisionMetrics | null>(null);
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
      .universeDecisionMetrics(universeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [universeId, refreshTrigger]);

  if (!universeId) return null;
  if (loading) return <div className="text-xs text-muted-foreground p-2">Đang tải Autonomic…</div>;
  if (error) return <div className="text-xs text-destructive p-2">Lỗi: {error}</div>;
  if (!data) return null;

  const actionLabel: Record<string, string> = {
    continue: "Tiếp tục",
    fork: "Fork",
    archive: "Lưu trữ",
    merge: "Gộp",
    mutate: "Đột biến",
    promote: "Thăng hạng",
  };

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest flex items-center gap-2">
        <Compass className="w-3 h-3" /> Autonomic / Navigator
      </h3>
      <div className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border/50">
        <span className="text-muted-foreground">Hành động</span>
        <span className="font-mono font-medium text-foreground flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {actionLabel[data.action] ?? data.action}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-muted/30 border border-border/50">
          <div className="text-muted-foreground flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Navigator</div>
          <div className="font-mono text-foreground font-medium">{(data.navigator_score * 100).toFixed(1)}%</div>
        </div>
        <div className="p-2 rounded bg-muted/30 border border-border/50">
          <div className="text-muted-foreground flex items-center gap-1"><Layers className="w-2.5 h-2.5" /> Novelty</div>
          <div className="font-mono text-foreground font-medium">{data.novelty != null ? `${(data.novelty * 100).toFixed(1)}%` : "—"}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Complexity: {data.complexity != null ? (data.complexity * 100).toFixed(0) : "—"}%</span>
        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Divergence: {data.divergence != null ? (data.divergence * 100).toFixed(0) : "—"}%</span>
      </div>
      <div className="p-2 rounded bg-muted/30 border border-border/50">
        <div className="text-muted-foreground text-[10px] mb-0.5">Archetype gần nhất</div>
        <div className="font-mono text-foreground text-[11px]">{data.nearest_archetype ?? "—"}</div>
        {data.is_novel_archetype === true && (
          <div className="text-[10px] text-amber-400 mt-0.5">Novel archetype</div>
        )}
      </div>
    </div>
  );
}
