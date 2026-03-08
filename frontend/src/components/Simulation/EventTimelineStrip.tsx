"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Loader2, GitBranch, History } from "lucide-react";

interface Chronicle {
  id: number;
  content: string;
  from_tick: number;
  to_tick: number;
  type: string;
}

interface BranchEvent {
  id: number;
  from_tick: number;
  event_type: string;
}

type TimelineItem =
  | { kind: "chronicle"; tick: number; toTick?: number; type: string; label: string; content?: string }
  | { kind: "branch"; tick: number; type: string; label: string };

interface EventTimelineStripProps {
  universeId: number;
  maxChronicles?: number;
  className?: string;
}

function typeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("collapse")) return "bg-red-500";
  if (t.includes("war") || t.includes("conflict")) return "bg-orange-500";
  if (t.includes("rise") || t.includes("formation")) return "bg-emerald-500";
  if (t === "fork") return "bg-cyan-500";
  return "bg-slate-500";
}

export function EventTimelineStrip({
  universeId,
  maxChronicles = 100,
  className = "",
}: EventTimelineStripProps) {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [branchEvents, setBranchEvents] = useState<BranchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.chronicle(universeId, 1, maxChronicles),
      api.branchEvents(universeId),
    ])
      .then(([chronRes, eventsRes]) => {
        if (cancelled) return;
        const chronData = Array.isArray(chronRes)
          ? chronRes
          : (chronRes as { data?: Chronicle[] })?.data ?? [];
        const events = Array.isArray(eventsRes)
          ? eventsRes
          : (eventsRes as { data?: BranchEvent[] })?.data ?? eventsRes ?? [];
        setChronicles(Array.isArray(chronData) ? chronData : []);
        setBranchEvents(Array.isArray(events) ? events : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Lỗi tải sự kiện");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId, maxChronicles]);

  const items = useMemo((): TimelineItem[] => {
    const list: TimelineItem[] = [];
    chronicles.forEach((c) => {
      list.push({
        kind: "chronicle",
        tick: c.from_tick,
        toTick: c.to_tick,
        type: c.type || "chronicle",
        label: c.type || "event",
        content: c.content?.slice(0, 80),
      });
    });
    branchEvents.forEach((e) => {
      list.push({
        kind: "branch",
        tick: e.from_tick,
        type: e.event_type || "fork",
        label: e.event_type === "fork" ? "Fork" : e.event_type,
      });
    });
    list.sort((a, b) => a.tick - b.tick);
    return list;
  }, [chronicles, branchEvents]);

  const { minTick, maxTick } = useMemo(() => {
    if (items.length === 0) return { minTick: 0, maxTick: 100 };
    const ticks = items.map((i) => i.tick);
    const max = items.reduce((m, i) => {
      const endTick = i.kind === "chronicle" ? (i.toTick ?? i.tick) : i.tick;
      return Math.max(m, endTick);
    }, 0);
    return { minTick: Math.min(...ticks), maxTick: Math.max(max, ...ticks) || 100 };
  }, [items]);

  const range = maxTick - minTick || 1;

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-[260px] text-slate-500 ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-2 text-sm">Đang tải timeline sự kiện...</span>
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

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center min-h-[260px] text-slate-500 italic text-sm ${className}`}
      >
        Chưa có chronicle hay branch event.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
        <span>tick {minTick}</span>
        <span className="flex-1 border-t border-slate-700" />
        <span>tick {maxTick}</span>
      </div>
      <div className="relative h-10 border border-slate-700 rounded-md bg-slate-900/60 overflow-hidden">
        {items.map((item, idx) => {
          const pos = ((item.tick - minTick) / range) * 100;
          return (
            <div
              key={`${item.kind}-${item.tick}-${idx}`}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group"
              style={{ left: `${pos}%`, transform: "translate(-50%, -50%)" }}
            >
              <div
                className={`w-3 h-3 rounded-full ${typeColor(item.type)} cursor-pointer hover:scale-125 transition-transform border border-slate-700`}
                title={
                  item.kind === "chronicle" && item.content
                    ? `Tick ${item.tick}: ${item.label}\n${item.content}`
                    : `Tick ${item.tick}: ${item.label}`
                }
              />
              <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {item.tick}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <History className="w-3 h-3" /> Chronicle
        </span>
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" /> Nhánh
        </span>
      </div>
    </div>
  );
}
