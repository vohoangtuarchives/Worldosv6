"use client";

import React, { useEffect, useState } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { api } from "@/lib/api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from "recharts";
import { Activity, Zap, Brain, Workflow, TrendingUp, Info } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EvolutionPage() {
  const { universeId } = useSimulation();
  const [evolutionData, setEvolutionData] = useState<any>(null);
  const [intelData, setIntelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [evo, intel] = await Promise.all([
          api.labDashboard.evolution(),
          api.labDashboard.intelligence()
        ]);
        setEvolutionData(evo);
        setIntelData(intel);
      } catch (err) {
        console.error("Failed to fetch evolution metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [universeId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background gap-4">
        <LoadingSpinner size="lg" className="text-purple-500" />
        <p className="text-sm font-mono text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Đang đồng bộ hóa luồng Huyền Nguyên...</p>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground animate-in fade-in duration-700">
      <header className="p-6 border-b border-border/50 bg-card/20 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 text-gradient-purple">
              <Zap className="w-6 h-6 text-purple-400" />
              Giám Sát Huyền Nguyên
            </h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium opacity-70">
              Phân tích tiến trình tự tiến hóa & Trí tuệ phi tập trung
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Live Observation Active</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-auto pb-12">
        {/* Left column: Intelligence Curve & Stats */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-card/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Đường Cong Trí Tuệ
              </h2>
              <span className="text-[10px] text-muted-foreground italic">Phát triển qua các Epoch</span>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intelData?.history || []}>
                  <defs>
                    <linearGradient id="colorIntel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="tick" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorIntel)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <section className="bg-card/20 border border-border/40 rounded-2xl p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Workflow className="w-4 h-4" /> Mạng Lưới Cổ Mẫu
                </h2>
                <div className="h-[200px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evolutionData?.win_rates || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: '#ffffff05'}} />
                        <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                           {(evolutionData?.win_rates || []).map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </section>

             <section className="bg-card/20 border border-border/40 rounded-2xl p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Phân Bổ Intelligence
                </h2>
                <div className="h-[200px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={evolutionData?.win_rates || []}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="rate"
                        >
                          {(evolutionData?.win_rates || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
             </section>
          </div>
        </div>

        {/* Right column: Monitoring Logs & Parameters */}
        <div className="lg:col-span-4 space-y-6">
           <section className="bg-card/40 border border-border/60 rounded-2xl p-6 h-full flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/80 mb-4 pb-2 border-b border-border/30">
                Tham Số Huyền Nguyên
              </h2>
              
              <div className="space-y-4 flex-1">
                 {[
                   { label: "Mật độ Ý Thức", value: (intelData?.current_metrics?.consciousness_density ?? 0.42).toFixed(3), color: "text-purple-400" },
                   { label: "entropy_reduction", value: (intelData?.current_metrics?.entropy_reduction ?? 0.15).toFixed(4), color: "text-emerald-400" },
                   { label: "causal_connectivity", value: (intelData?.current_metrics?.causal_connectivity ?? 0.88).toFixed(2), color: "text-blue-400" },
                   { label: "morphogenetic_index", value: (intelData?.current_metrics?.morphogenetic_index ?? 0.56).toFixed(3), color: "text-amber-400" }
                 ].map(param => (
                   <div key={param.label} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{param.label}</span>
                      <span className={`text-sm font-mono font-bold ${param.color}`}>{param.value}</span>
                   </div>
                 ))}

                 <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 text-[11px] text-muted-foreground leading-relaxed italic relative">
                    <Info className="w-4 h-4 text-blue-400 absolute -top-2 -left-2 bg-background rounded-full" />
                    Hệ thống đang quan sát sự phân rã của các cổ mẫu cũ và sự trồi sụt của các cấu trúc ý thức mới. 
                    Mọi can thiệp vào giai đoạn này có thể làm thay đổi wavefunction của toàn bộ Universe.
                 </div>
              </div>

              <button className="mt-8 w-full py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 group">
                 <Activity className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                 Bắt đầu Interference Wave
              </button>
           </section>
        </div>
      </main>
    </div>
  );
}
