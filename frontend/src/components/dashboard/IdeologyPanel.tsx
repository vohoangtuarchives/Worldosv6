"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Scale } from "lucide-react";

interface IdeologyPanelProps {
  universeId: number | null;
  refreshTrigger?: number;
}

const IDEOLOGY_KEYS = ["tradition", "innovation", "trust", "violence", "respect", "myth"] as const;

export function IdeologyPanel({ universeId, refreshTrigger = 0 }: IdeologyPanelProps) {
  const [data, setData] = useState<{
    dominant: Record<string, number>;
    institution_count: number;
  } | null>(null);
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
      .universeIdeology(universeId)
      .then((res) => {
        if (!cancelled) setData({ dominant: res.dominant ?? {}, institution_count: res.institution_count ?? 0 });
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
  if (loading) return <div className="text-xs text-muted-foreground p-2">Đang tải Ideology…</div>;
  if (error) return <div className="text-xs text-destructive p-2">Lỗi: {error}</div>;
  if (!data) return null;

  const dominant = data.dominant ?? {};
  const hasAny = IDEOLOGY_KEYS.some((k) => typeof dominant[k] === "number");

  if (!hasAny) {
    return (
      <div className="space-y-2 text-xs">
        <h3 className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Scale className="w-3 h-3" /> Ideology
        </h3>
        <div className="text-muted-foreground text-[10px] p-2">Chưa có dữ liệu (cần institutions).</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2">
        <Scale className="w-3 h-3" /> Ideology
      </h3>
      <div className="text-[10px] text-muted-foreground">Institutions: {data.institution_count}</div>
      <div className="space-y-1.5">
        {IDEOLOGY_KEYS.map((key) => {
          const v = typeof dominant[key] === "number" ? dominant[key] : 0.5;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-muted-foreground capitalize w-20 text-[10px] truncate">{key}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500/70 rounded-full transition-all" style={{ width: `${v * 100}%` }} />
              </div>
              <span className="font-mono text-[10px] text-foreground w-8">{(v * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
