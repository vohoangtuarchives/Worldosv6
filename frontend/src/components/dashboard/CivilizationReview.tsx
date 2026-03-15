"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Shield, 
  BookOpen, 
  Cpu, 
  AlertTriangle, 
  Scroll, 
  Compass, 
  Zap, 
  Activity,
  Award,
  Atom
} from "lucide-react";

interface CivilizationReviewProps {
  universeId: number;
}

export function CivilizationReview({ universeId }: CivilizationReviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.labDashboard.grandNarrative(universeId)
      .then(res => {
        setData(res);
        setError(null);
      })
      .catch(err => {
        setError(err.message || "Failed to fetch civilization report");
      })
      .finally(() => setLoading(false));
  }, [universeId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-6 animate-pulse">
      <Scroll className="w-16 h-16 text-cyan-500/40" />
      <div className="text-center">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] mb-2">Synthesizing Grand Narrative</div>
        <div className="text-[10px] text-cyan-500/60 font-mono italic">Đang tổng thuật biên niên sử văn minh...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 border border-red-500/30 bg-red-500/5 rounded-2xl text-red-400 text-sm font-mono flex items-center gap-4">
      <AlertTriangle className="w-8 h-8 flex-none" />
      <div>
        <div className="font-bold uppercase mb-1">Causal Synthesis Error</div>
        <p className="opacity-70">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Age Header */}
      <div className="relative p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] -ml-24 -mb-24 rounded-full" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                <Compass className="w-5 h-5 text-cyan-300" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Civilization Epoch</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
              {data.age_name}
            </h2>
            <p className="text-lg text-slate-300/90 leading-relaxed max-w-2xl font-serif italic border-l-2 border-cyan-500/30 pl-4 py-1">
              "{data.summary}"
            </p>
          </div>
          
          <div className="flex-none flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2">Sync Confidence</div>
            <div className="text-3xl font-black text-cyan-400 font-mono">
              {Math.round((1 - data.metrics.noise) * 100)}%
            </div>
            <div className="mt-2 w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-500" style={{ width: `${(1 - data.metrics.noise) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Paradox Warning */}
      {data.paradoxes.length > 0 && (
        <div className="space-y-4">
          {data.paradoxes.map((p: any, i: number) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-none mt-1" />
              <div>
                <h4 className="text-sm font-bold text-red-300 uppercase tracking-wider mb-1">{p.type}</h4>
                <p className="text-xs text-red-200/70 leading-relaxed font-mono">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Sectors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Military Report */}
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Quân sự (Military)</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Intensity</span>
              <span className="text-xs font-mono font-bold text-red-400">{Math.round(data.military.intensity * 100)}%</span>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed">
              {data.military.description}
            </div>
            <div className="pt-4 border-t border-red-500/10 flex items-center justify-between font-mono">
               <span className="text-[10px] text-slate-500 uppercase">Status</span>
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase">{data.military.status}</span>
            </div>
          </div>
        </div>

        {/* Culture Report */}
        <div className="p-6 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-fuchsia-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Văn hóa (Culture)</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-fuchsia-900/20 rounded-xl border border-fuchsia-500/10 text-center">
                 <div className="text-[9px] text-slate-500 uppercase mb-1">Ideas</div>
                 <div className="text-lg font-bold text-fuchsia-300">{data.culture.idea_diversity}</div>
              </div>
              <div className="p-3 bg-fuchsia-900/20 rounded-xl border border-fuchsia-500/10 text-center">
                 <div className="text-[9px] text-slate-500 uppercase mb-1">Schools</div>
                 <div className="text-lg font-bold text-fuchsia-300">{data.culture.established_schools}</div>
              </div>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed">
              {data.culture.description}
            </div>
            <div className="pt-4 border-t border-fuchsia-500/10">
               <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono">
                  <span>Spirituality Index</span>
                  <span className="text-fuchsia-400 font-bold">{Math.round(data.culture.spirituality * 100)}%</span>
               </div>
            </div>
          </div>
        </div>

        {/* Tech Report */}
        <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Công nghệ (Technology)</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Knowledge Level</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{Math.round(data.technology.tech_level * 100)}%</span>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed">
              {data.technology.description}
            </div>
            <div className="pt-4 border-t border-cyan-500/10">
               <div className="flex items-center justify-between mb-2 font-mono">
                  <span className="text-[10px] text-slate-500 uppercase">Innovation Potential</span>
                  <span className="text-cyan-400 text-[10px]">{Math.round(data.technology.innovation_potential * 100)}%</span>
               </div>
               <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/60" style={{ width: `${data.technology.innovation_potential * 100}%` }} />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance/UX Tip */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 justify-between flex-wrap">
         <div className="flex items-center gap-4">
            <Activity className="w-6 h-6 text-slate-500" />
            <div className="text-xs text-slate-400 italic font-serif">
              "Lịch sử không phải là tập hợp các sự kiện cô lập, mà là sự giao thoa liên tục của các dòng chảy ý thức."
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Last Synthesis</span>
            <span className="text-[10px] text-cyan-500/70 font-mono">{new Date(data.timestamp).toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
}
