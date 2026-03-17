"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useSimulation } from "@/context/SimulationContext";
import { Loader2, AlertTriangle, GitBranch, History } from "lucide-react";

interface Chronicle {
  id: number;
  from_tick: number;
  to_tick?: number;
  type: string;
  content?: string;
}

interface BranchEvent {
  id: number;
  from_tick: number;
  event_type: string;
  payload?: Record<string, unknown>;
}

type CollapseItem =
  | { source: "anomaly"; tick: number; title: string; description: string; severity: string }
  | { source: "chronicle"; tick: number; content?: string }
  | { source: "branch"; tick: number; event_type: string };

interface CollapseMonitorProps {
  universeId: number;
  className?: string;
}

export function CollapseMonitor({
  universeId,
  className = "",
}: CollapseMonitorProps) {
  const { anomalies } = useSimulation();
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [branchEvents, setBranchEvents] = useState<BranchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.chronicle(universeId, 1, 100),
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
      .catch(() => {
        if (!cancelled) {
          setChronicles([]);
          setBranchEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId]);

  const items = useMemo((): CollapseItem[] => {
    const list: CollapseItem[] = [];
    anomalies
      .filter((a: { severity?: string }) => a.severity === "CRITICAL")
      .forEach((a: { tick?: number; title?: string; description?: string; severity?: string }) => {
        list.push({
          source: "anomaly",
          tick: a.tick ?? 0,
          title: a.title ?? "Anomaly",
          description: a.description ?? "",
          severity: a.severity ?? "CRITICAL",
        });
      });
    chronicles
      .filter((c) => c.type === "civilization_collapse")
      .forEach((c) => {
        list.push({
          source: "chronicle",
          tick: c.from_tick,
          content: c.content,
        });
      });
    branchEvents
      .filter((e) => e.event_type === "collapse")
      .forEach((e) => {
        list.push({
          source: "branch",
          tick: e.from_tick,
          event_type: e.event_type,
        });
      });
    list.sort((a, b) => b.tick - a.tick);
    return list;
  }, [anomalies, chronicles, branchEvents]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-[120px] text-slate-500 ${className}`}
      >
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="ml-2 text-sm">Đang tải...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={`rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 text-slate-500 italic text-sm ${className}`}
      >
        Không có sự kiện collapse hoặc anomaly CRITICAL.
      </div>
    );
  }

  return (
    <div className={`space-y-2 max-h-[280px] overflow-y-auto ${className}`}>
      {items.map((item, idx) => {
        if (item.source === "anomaly") {
          return (
            <div
              key={`anomaly-${item.tick}-${idx}`}
              className="flex items-start gap-3 p-3 rounded-lg border border-red-900/50 bg-red-950/20"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-red-300">
                  Tick {item.tick} — {item.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
              </div>
            </div>
          );
        }
        if (item.source === "chronicle") {
          return (
            <div
              key={`chron-${item.tick}-${idx}`}
              className="flex items-start gap-3 p-3 rounded-lg border border-amber-900/50 bg-amber-950/20"
            >
              <History className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-amber-300">
                  Tick {item.tick} — civilization_collapse
                </div>
                {item.content && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {item.content}
                  </p>
                )}
              </div>
            </div>
          );
        }
        return (
          <div
            key={`branch-${item.tick}-${idx}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/30"
          >
            <GitBranch className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-slate-300">
              Tick {item.tick} — branch: {item.event_type}
            </div>
          </div>
        );
      })}
    </div>
  );
}
