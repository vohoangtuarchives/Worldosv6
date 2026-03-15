"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  History as HistoryIcon, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Sparkles, 
  Zap, 
  Ghost,
  ChevronRight,
  Split
} from "lucide-react";

interface SamsaraPathProps {
  agentId: number;
}

export function SamsaraPath({ agentId }: SamsaraPathProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.labDashboard.samsara(agentId)
      .then(res => {
        setData(res);
        setError(null);
      })
      .catch(err => {
        setError(err.message || "Failed to fetch samsara path");
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
      <Ghost className="w-12 h-12 text-blue-500/40" />
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Searching ancestral soul path...</span>
    </div>
  );

  if (error) return (
    <div className="p-8 border border-red-500/30 bg-red-500/5 rounded-lg text-red-400 text-sm font-mono">
      Error: {error}
    </div>
  );

  if (!data || data.path.length === 0) return (
    <div className="p-12 text-center space-y-4">
      <HistoryIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" />
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Không tìm thấy tiền kiếp (No Ancestral Path)</div>
      <p className="text-[10px] text-muted-foreground/60 italic">Thực thể này có thể là nguyên bản (Original consciousness).</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Ghost className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{data.agent.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-bold uppercase tracking-widest">{data.agent.archetype}</span>
              {data.agent.is_transcendental && <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-bold uppercase tracking-widest">Transcendental</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Lifetimes</div>
          <div className="text-2xl font-mono font-bold text-blue-300">{Math.ceil(data.path.length / 2)}</div>
        </div>
      </div>

      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-500/50 before:via-purple-500/50 before:to-emerald-500/50 before:opacity-30">
        {data.path.map((step: any, idx: number) => (
          <div key={idx} className="relative group">
            {/* Marker */}
            <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 bg-background z-10 transition-all group-hover:scale-125 ${
              step.type === 'isekai_departure' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            }`} />
            
            <div className={`p-4 rounded-xl border transition-all hover:bg-white/5 ${
              step.type === 'isekai_departure' ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {step.type === 'isekai_departure' ? (
                    <ArrowRight className="w-3 h-3 text-red-400 rotate-45" />
                  ) : (
                    <Zap className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                    step.type === 'isekai_departure' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {step.type === 'isekai_departure' ? 'Rời khỏi (Departure)' : 'Tái sinh (Reincarnation)'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/60">
                   <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Tick {step.tick}</span>
                   </div>
                   <span>{new Date(step.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-100">{step.universe_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground/80 leading-relaxed font-serif italic">
                    {step.payload.content || (step.type === 'isekai_departure' ? "Linh hồn lìa khỏi thực tại..." : "Thức tỉnh tại vùng đất mới.")}
                  </div>
                </div>

                {step.payload.cheat_granted && (
                  <div className="flex-none p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
              </div>

              {step.payload.reason && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                  <Split className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/60 italic">Nguyên nhân: {step.payload.reason}</span>
                </div>
              )}
            </div>
            
            {idx < data.path.length - 1 && step.type === 'isekai_departure' && (
              <div className="absolute -bottom-6 left-[11px] h-4 flex flex-col items-center justify-center opacity-40">
                <ChevronRight className="w-3 h-3 rotate-90 text-blue-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-background/40 border border-border/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <HistoryIcon className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Ghi chú quan sát</span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed">
          Quỹ đạo linh hồn (Samsara trajectory) được truy vết thông qua dư chấn thông tin (informational echoes) để lại trong Biên niên sử. 
          Các thực thể Isekai thường mang theo "Cheat" — một dạng méo mó quy luật vật lý cục bộ.
        </p>
      </div>
    </div>
  );
}
