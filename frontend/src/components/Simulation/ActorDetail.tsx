"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User, Skull, HeartPulse, BrainCircuit, Zap, Orbit, Sparkles, Star, History as HistoryIcon, ChevronRight
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import { api } from "@/lib/api";
import { AttractorMandala } from "./AttractorMandala";
import { SamsaraPath } from "./SamsaraPath";

interface Actor {
  id: number;
  name: string;
  archetype: string;
  traits: number[];
  biography: string;
  is_alive: boolean;
  metrics?: { influence?: number; energy?: number; contribution?: number; reasoning?: string };
  generation?: number;
  universe_id?: number;
  vitality?: { health?: number; age?: number; fatigue?: number; morale?: number } | null;
  trait_scan_status?: string | null;
  supreme_entity?: { id: number; name?: string; entity_type?: string; domain?: string } | null;
}

const TRAIT_DIMENSIONS = [
  "Thống trị", "Tham vọng", "Ép buộc", "Trung thành", "Thấu cảm", "Đoàn kết",
  "Tuân thủ", "Thực dụng", "Tò mò", "Giáo điều", "Mạo hiểm", "Sợ hãi",
  "Hận thù", "Hy vọng", "Đau thương", "Kiêu hãnh", "Hổ thẹn", "Tuổi thọ"
];

function deriveMotivations(traits: number[]): any {
    if (!traits || traits.length < 17) {
        return {
            survival: 0.1, reproduction: 0.1, wealth: 0.1, power: 0.1,
            knowledge: 0.1, meaning: 0.1, status: 0.1, belonging: 0.1
        };
    }
    return {
        survival: (traits[4] + traits[5] + traits[11]) / 3,
        reproduction: (traits[3] + traits[4] + traits[13]) / 3,
        wealth: (traits[1] + traits[7] + traits[10]) / 3,
        power: (traits[0] + traits[1] + traits[2]) / 3,
        knowledge: (traits[8] + traits[9] + traits[4]) / 3,
        meaning: (traits[13] + traits[9] + traits[16]) / 3,
        status: (traits[15] + traits[0] + traits[1]) / 3,
        belonging: (traits[3] + traits[5] + traits[4]) / 3,
    };
}

function cognitionLabel(traits: number[]): string {
  if (!traits?.length) return "—";
  const cognitive = [traits[7], traits[8], traits[9], traits[10]].filter((v) => v != null);
  if (cognitive.length === 0) return "—";
  const avg = cognitive.reduce((a, b) => a + b, 0) / cognitive.length;
  if (avg >= 0.6) return "Cao";
  if (avg >= 0.3) return "Trung bình";
  return "Thấp";
}

export function ActorDetail({ actorId }: { actorId: number }) {
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSamsara, setShowSamsara] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getActor(actorId)
      .then((data: any) => setActor(data))
      .catch((err: Error) => console.error(err))
      .finally(() => setLoading(false));
  }, [actorId]);

  const radarData = useMemo(() => {
    if (!actor?.traits) return [];
    return TRAIT_DIMENSIONS.map((label, i) => ({
      subject: label,
      A: Math.max(0.02, actor.traits[i] ?? 0),
      fullMark: 1.0,
    }));
  }, [actor?.traits]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  if (!actor) return <div className="text-center py-12 text-muted-foreground">Không tìm thấy nhân vật.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{actor.name}</h2>
              <p className="text-blue-400 text-sm font-mono uppercase tracking-widest">{actor.archetype}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Tiểu sử (Biography)</h4>
            <p className="text-sm leading-relaxed text-foreground/80 italic">"{actor.biography || "Sơ yếu lý lịch đang được cập nhật qua biên niên sử..."}"</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                {actor.is_alive ? <HeartPulse className="w-3 h-3 text-green-400" /> : <Skull className="w-3 h-3 text-red-400" />} 
                {actor.is_alive ? "Sinh lực" : "Trạng thái"}
              </div>
              <div className="text-2xl font-mono">
                {actor.vitality?.health ? `${Math.round(actor.vitality.health * 100)}%` : actor.is_alive ? "100%" : "Tử vong"}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                <BrainCircuit className="w-3 h-3 text-purple-400" /> Nhận thức
              </div>
              <div className="text-2xl font-mono">{cognitionLabel(actor.traits ?? [])}</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSamsara(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <HistoryIcon className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-sm font-bold text-blue-100">Samsara Trajectory</div>
                <div className="text-[10px] text-blue-400/60 uppercase tracking-widest">Xem quỹ đạo luân hồi</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Tâm lý
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
                <Radar dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
               <Orbit className="w-4 h-4 text-blue-400" /> Động lực
             </h3>
             <AttractorMandala fields={deriveMotivations(actor.traits ?? [])} size={250} />
          </div>
        </div>
      </div>

      {showSamsara && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest">Samsara Trajectory</h2>
              <button onClick={() => setShowSamsara(false)} className="p-1 hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6"><SamsaraPath agentId={actor.id} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return <ChevronRight className={`${className} rotate-45`} />;
}
