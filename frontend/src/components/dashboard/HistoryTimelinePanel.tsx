"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ScrollText, ChevronDown, ChevronRight, Zap } from "lucide-react";

type TimelineEntry = { from_tick: number; to_tick: number; type: string; content: string | null; payload: Record<string, unknown> };

interface HistoryTimelineData {
  timeline: TimelineEntry[];
  by_type: Record<string, TimelineEntry[]>;
}

export function HistoryTimelinePanel({ universeId, limit = 50, refreshTrigger = 0 }: { universeId: number | null; limit?: number; refreshTrigger?: number }) {
  const [data, setData] = useState<HistoryTimelineData | null>(null);
  const [causalLinks, setCausalLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(["ecological_collapse", "civilization_collapse", "ecological_phase_transition"]));

  useEffect(() => {
    if (!universeId) {
      setData(null);
      setCausalLinks([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    Promise.all([
      api.historyTimeline(universeId, limit),
      api.causalLinks(universeId)
    ])
      .then(([historyRes, causalRes]) => {
        if (!cancelled) {
          setData(historyRes);
          setCausalLinks(causalRes.links);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [universeId, limit, refreshTrigger]);

  if (!universeId) return null;
  if (loading) return <div className="text-xs text-muted-foreground p-2">Đang tải lịch sử…</div>;
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
    causal_trace: "Dấu vết nhân quả",
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest flex items-center gap-2">
          <ScrollText className="w-3 h-3" /> Lịch sử (Chronicle)
        </h3>
        {data.timeline.length === 0 ? (
          <div className="text-muted-foreground text-[10px] p-2">Chưa có sự kiện nào trong timeline.</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-auto pr-1 thin-scrollbar">
            {Object.entries(data.by_type).map(([type, entries]) => {
              const expanded = expandedTypes.has(type);
              const label = typeLabels[type] ?? type;
              return (
                <div key={type} className="rounded bg-muted/20 border border-border/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleType(type)}
                    className="w-full flex items-center gap-1 p-1.5 text-left text-foreground hover:bg-muted/30 transition-colors"
                  >
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground font-mono ml-auto">({entries.length})</span>
                  </button>
                  {expanded && (
                    <div className="px-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {entries.slice(0, 5).map((e, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground border-l border-violet-500/30 pl-2 py-0.5">
                          <span className="font-mono text-[9px] text-violet-400/70">T{e.from_tick}</span>
                          {e.content && <span className="ml-2 text-slate-300 block leading-tight">{e.content}</span>}
                        </div>
                      ))}
                      {entries.length > 5 && <div className="text-[9px] text-muted-foreground/60 pl-2 italic">+{entries.length - 5} entries hidden</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {causalLinks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <h3 className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" /> Reality OS Traces
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-auto pr-1 thin-scrollbar">
            {causalLinks.map((link, i) => (
              <div key={i} className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20 text-[10px] text-cyan-200/80 font-mono leading-snug">
                {link}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
