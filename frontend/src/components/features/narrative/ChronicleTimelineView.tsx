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
  created_at: string;
  perceived_archive_snapshot?: { noise_level?: number; clarity?: string };
}

interface BranchEvent {
  id: number;
  universe_id: number;
  from_tick: number;
  event_type: string;
  payload?: Record<string, unknown>;
}

type TimelineItem =
  | { kind: "chronicle"; tick: number; toTick: number; data: Chronicle }
  | { kind: "branch"; tick: number; data: BranchEvent };

interface ChronicleTimelineViewProps {
  universeId: number;
  maxChronicles?: number;
  className?: string;
}

export function ChronicleTimelineView({
  universeId,
  maxChronicles = 50,
  className = "",
}: ChronicleTimelineViewProps) {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [branchEvents, setBranchEvents] = useState<BranchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.chronicle(universeId, 1, maxChronicles),
      api.branchEvents(universeId),
    ])
      .then(([chronRes, eventsRes]) => {
        if (cancelled) return;
        const chronData = Array.isArray(chronRes) ? chronRes : (chronRes as { data?: Chronicle[] })?.data ?? [];
        const events = Array.isArray(eventsRes) ? eventsRes : (eventsRes as { data?: BranchEvent[] })?.data ?? eventsRes ?? [];
        setChronicles(Array.isArray(chronData) ? chronData : []);
        setBranchEvents(Array.isArray(events) ? events : []);
      })
      .catch(() => {
        if (!cancelled) {
          setChronicles([]);
          setBranchEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [universeId, maxChronicles]);

  const items = useMemo((): TimelineItem[] => {
    const list: TimelineItem[] = [];
    chronicles.forEach((c) => {
      list.push({ kind: "chronicle", tick: c.from_tick, toTick: c.to_tick, data: c });
    });
    branchEvents.forEach((e) => {
      list.push({ kind: "branch", tick: e.from_tick, data: e });
    });
    list.sort((a, b) => a.tick - b.tick);
    return list;
  }, [chronicles, branchEvents]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm italic">Đang tải dòng thời gian...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`rounded-lg border border-border bg-card/50 p-6 text-center text-muted-foreground italic ${className}`}>
        Chưa có biên niên sử hay sự kiện phân nhánh.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-border bg-card/50 overflow-hidden flex flex-col ${className}`}>
      <div className="p-3 border-b border-border bg-muted/50 flex items-center gap-2">
        <History className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Dòng thời gian (Chronicles + Branch)
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-h-[500px] custom-scrollbar">
        {items.map((item, idx) =>
          item.kind === "chronicle" ? (
            <div key={`chron-${item.data.id}`} className="relative pl-8 border-l-2 border-amber-500/40 ml-1">
              <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <div className="text-[10px] text-amber-500/90 mb-1.5 font-mono flex items-center gap-2 flex-wrap">
                <History className="w-3 h-3 shrink-0" />
                <span>Tick {item.tick} → {item.toTick}</span>
                {item.data.type && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                    {item.data.type}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-foreground font-serif pl-0">
                {item.data.content}
              </p>
            </div>
          ) : (
            <div key={`branch-${item.data.id}-${idx}`} className="relative pl-8 border-l-2 border-emerald-500/50 border-dashed ml-1">
              <div className="absolute -left-[5px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center">
                <GitBranch className="w-2 h-2 text-background" />
              </div>
              <div className="text-xs text-emerald-400/90 font-mono flex items-center gap-2">
                <GitBranch className="w-3 h-3" />
                <span>
                  {item.data.event_type === "fork" ? "Phân nhánh vũ trụ" : item.data.event_type} tại tick {item.tick}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
