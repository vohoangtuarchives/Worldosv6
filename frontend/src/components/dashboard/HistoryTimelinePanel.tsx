"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ScrollText, ChevronDown, ChevronRight } from "lucide-react";

type TimelineEntry = { from_tick: number; to_tick: number; type: string; content: string | null; payload: Record<string, unknown> };

interface HistoryTimelineData {
  timeline: TimelineEntry[];
  by_type: Record<string, TimelineEntry[]>;
}

export function HistoryTimelinePanel({ universeId, limit = 50, refreshTrigger = 0 }: { universeId: number | null; limit?: number; refreshTrigger?: number }) {
  const [data, setData] = useState<HistoryTimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(["ecological_collapse", "civilization_collapse", "ecological_phase_transition"]));

  useEffect(() => {
    if (!universeId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .historyTimeline(universeId, limit)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [universeId, limit, refreshTrigger]);

  if (!universeId) return null;
  if (loading) return <div className="text-xs text-slate-500 p-2">Đang tải lịch sử…</div>;
  if (error) return <div className="text-xs text-red-400 p-2">Lỗi: {error}</div>;
  if (!data) return null;

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const typeLabels: Record<string, string> = {
    ecological_collapse: "Sụp đổ sinh thái",
    ecological_collapse_recovery: "Hồi phục sinh thái",
    ecological_phase_transition: "Chuyển pha sinh thái",
    civilization_collapse: "Sụp đổ thể chế",
  };

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest flex items-center gap-2">
        <ScrollText className="w-3 h-3" /> Lịch sử (Chronicle)
      </h3>
      {data.timeline.length === 0 ? (
        <div className="text-slate-500 text-[10px] p-2">Chưa có sự kiện nào trong timeline.</div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-auto">
          {Object.entries(data.by_type).map(([type, entries]) => {
            const expanded = expandedTypes.has(type);
            const label = typeLabels[type] ?? type;
            return (
              <div key={type} className="rounded bg-slate-800/30 border border-slate-700/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center gap-1 p-1.5 text-left text-slate-300 hover:bg-slate-700/30"
                >
                  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span className="font-medium">{label}</span>
                  <span className="text-slate-500 font-mono ml-1">({entries.length})</span>
                </button>
                {expanded && (
                  <div className="px-2 pb-2 space-y-1">
                    {entries.slice(0, 5).map((e, i) => (
                      <div key={i} className="text-[10px] text-slate-400 border-l-2 border-slate-600 pl-2">
                        <span className="font-mono text-slate-500">Tick {e.from_tick}</span>
                        {e.content && <span className="ml-1 text-slate-300 truncate block">{e.content.slice(0, 80)}{e.content.length > 80 ? "…" : ""}</span>}
                      </div>
                    ))}
                    {entries.length > 5 && <div className="text-slate-500 text-[10px]">+{entries.length - 5} sự kiện</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
