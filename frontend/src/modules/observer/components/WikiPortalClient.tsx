'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Atom, 
  BookOpen, 
  Users, 
  Zap, 
  ChevronRight,
  History,
  Map,
  Lightbulb,
  Activity,
  GitBranch,
  Clock,
  Database,
  SearchCode
} from 'lucide-react';
import Link from 'next/link';
import { useObserverRealityPulse, useObserverUniverseTimeline } from '@/modules/observer/api';
import { fetchClientJson } from '@/shared/api/observer-http';
import { HUDCard, HUDBadge, HUDProgress } from '@/modules/observer/components/ui/hud-primitives';

interface WikiActor {
  id: string | number;
  name: string;
  role: string;
}

interface WikiChronicle {
  id: string | number;
  title: string;
  tick: number;
  impact_score: number;
}

interface WikiAxiom {
  id: string | number;
  name: string;
  dimension: string;
  tier: number;
  description: string;
  default_value: React.ReactNode;
  drift_summary?: {
    status: string;
    drift: number;
  };
}

interface WikiSearchResult {
  actors: WikiActor[];
  chronicles: WikiChronicle[];
  axioms: WikiAxiom[];
}

/**
 * WikiPortalClient: Comprehensive Multiverse Documentation Hub.
 * Refactored for Scientific Light HUD and full Vietnamese localization.
 */
export default function WikiPortalClient({ universeId }: { universeId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiSearchResult | null>(null);
  const [activeAxioms, setActiveAxioms] = useState<WikiAxiom[]>([]);
  const [loading, setLoading] = useState(false);
  const pulseQuery = useObserverRealityPulse(universeId);
  const timelineQuery = useObserverUniverseTimeline(universeId, []);

  useEffect(() => {
    const fetchAxioms = async () => {
      try {
        const data = await fetchClientJson<{ data: WikiAxiom[] }>('/api/wiki/axioms');
        setActiveAxioms(data.data || []);
      } catch (e) {
        console.error("Failed to fetch axioms", e);
      }
    };
    fetchAxioms();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchClientJson<{ data: WikiSearchResult }>(`/api/wiki/${universeId}/search?q=${val}`);
      setResults(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'axioms', name: 'Kho Định đề', icon: <Atom size={24} />, description: 'Quy luật & Hằng số vật lý' },
    { id: 'entities', name: 'Thực thể Vũ trụ', icon: <Users size={24} />, description: 'Nhân vật, Chủng tộc & Tổ chức' },
    { id: 'chronicles', name: 'Đại Biên niên sử', icon: <History size={24} />, description: 'Biên niên sử & Chuỗi nhân quả' },
    { id: 'geography', name: 'Địa lý Vũ trụ', icon: <Map size={24} />, description: 'Vùng không gian Đa vũ trụ' },
    { id: 'metaphysics', name: 'Siêu hình học', icon: <Lightbulb size={24} />, description: 'Khoa học & Đổi mới Siêu hình' },
  ];

  return (
    <div className="space-y-16 max-w-[1600px] mx-auto pb-24">
      {/* ── Portal Header HUD ────────────────────────────────── */}
      <header className="relative pt-12 pb-8 text-center space-y-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,89,133,0.04),transparent)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-6 rounded-[32px] bg-primary/5 border border-primary/10 mb-2 shadow-sm"
        >
          <BookOpen className="w-14 h-14 text-primary animate-pulse" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-heading font-black tracking-tighter text-slate-950 uppercase italic">
            Kho Lưu trữ <span className="text-primary italic">Bản thể</span> Đa vũ trụ
          </h1>
          <div className="flex items-center justify-center gap-8">
             <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-primary/20" />
             <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.4em]">
               Bản ghi vĩnh cửu của Nhịp đập Thực tại #{universeId.slice(0, 8)}
             </p>
             <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-primary/20" />
          </div>
        </div>
      </header>

      {/* ── Advanced Search HUD ──────────────────────────────── */}
      <div className="relative max-w-4xl mx-auto group">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-[32px] blur-xl opacity-40 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center bg-white border border-slate-200 rounded-[32px] overflow-hidden focus-within:border-primary focus-within:ring-8 focus-within:ring-primary/5 transition-all shadow-2xl">
          <div className="pl-8 pointer-events-none">
            <SearchCode className="w-8 h-8 text-slate-300 group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            className="w-full h-24 pl-6 pr-10 bg-transparent text-2xl font-heading font-black text-slate-950 uppercase italic placeholder:text-slate-200 outline-none"
            placeholder="ĐANG TRUY VẤN MẪU NHÂN QUẢ..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="pr-10"
              >
                <Activity className="w-8 h-8 text-primary animate-spin-slow" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-10 text-[9px] font-heading font-black text-slate-300 uppercase tracking-[0.3em]">
           <div className="flex items-center gap-2">
             <Database size={12} className="text-slate-200" />
             <span>Chỉ mục: 4.201.982 bản ghi</span>
           </div>
           <div className="h-3 w-px bg-slate-100" />
           <div className="flex items-center gap-2">
             <Clock size={12} className="text-slate-200" />
             <span>Độ trễ: 0.12ms</span>
           </div>
        </div>
      </div>

      {/* ── Category HUD Grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pt-20">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ y: -8 }}
            className="group relative rounded-[32px] border border-slate-200 bg-white p-10 flex flex-col items-center text-center gap-8 hover:border-primary hover:shadow-2xl transition-all cursor-pointer overflow-hidden shadow-sm"
          >
             <div className="absolute inset-x-0 top-0 h-1.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
             <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/5 flex items-center justify-center transition-all duration-300 shadow-inner group-hover:scale-110">
               {cat.icon}
             </div>
             <div className="space-y-3">
               <h3 className="font-heading font-black text-sm text-slate-900 group-hover:text-primary transition-colors uppercase tracking-widest">{cat.name}</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-widest">{cat.description}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* ── Search Results ───────────────────────────────────── */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-16"
          >
            {/* Actors Results */}
            <HUDCard title="THỰC THỂ ĐÃ NHẬN DIỆN" icon={Users}>
              <div className="space-y-3 pt-4">
                {results.actors.map((actor: WikiActor) => (
                  <Link 
                    key={actor.id} 
                    href={`/universes/${universeId}/wiki/actor/${actor.id}`}
                    className="p-5 rounded-[20px] border border-transparent bg-slate-50/50 hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-heading font-black text-sm text-slate-900 group-hover:text-primary transition-colors italic">{actor.name}</div>
                      <div className="text-[9px] font-heading font-black text-slate-400 uppercase tracking-widest mt-1">{actor.role}</div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </HUDCard>

            {/* Chronicles Results */}
            <HUDCard title="SỬ KÝ ĐỒNG BỘ" icon={History}>
              <div className="space-y-3 pt-4">
                {results.chronicles.map((ch: WikiChronicle) => (
                  <div key={ch.id} className="p-5 rounded-[20px] border border-transparent bg-slate-50/50 hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all flex items-center justify-between group cursor-help">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-heading font-black text-sm text-slate-900 truncate group-hover:text-primary transition-colors uppercase italic">{ch.title}</div>
                      <div className="flex items-center gap-3 mt-4">
                        <HUDBadge color="primary">T-{ch.tick.toLocaleString()}</HUDBadge>
                        {ch.impact_score > 70 && <HUDBadge color="destructive">NGUY CẤP</HUDBadge>}
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[8px] text-slate-400 font-heading font-black tracking-[0.2em] mb-1">TÁC ĐỘNG</div>
                       <div className="text-base font-heading font-black italic text-primary">{ch.impact_score}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </HUDCard>

            {/* Axioms Results */}
            <HUDCard title="DANH LỤC TIÊN ĐỀ" icon={Atom}>
              <div className="space-y-3 pt-4">
                {results.axioms.map((ax: WikiAxiom) => (
                  <Link 
                    key={ax.id} 
                    href={`/universes/${universeId}/wiki/axiom/${ax.id}`}
                    className="p-5 rounded-[20px] border border-transparent bg-slate-50/50 hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-heading font-black text-sm text-slate-900 group-hover:text-primary transition-colors uppercase truncate italic">{ax.name}</div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] text-slate-400 font-medium italic truncate">{ax.id}</span>
                        {ax.drift_summary?.status === 'shifting' && (
                          <span className="flex items-center gap-2 text-[9px] text-amber-600 animate-pulse font-heading font-black uppercase tracking-widest whitespace-nowrap">
                            <Zap size={10} fill="currentColor" /> ĐÃ LỆCH
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-3 min-w-[80px]">
                       <HUDBadge className="text-[9px] border-primary/10 text-primary bg-primary/5 tracking-widest">{ax.dimension}</HUDBadge>
                       {ax.drift_summary && (
                         <div className={`text-xs font-heading font-black italic ${ax.drift_summary.drift > 0 ? 'text-primary' : ax.drift_summary.drift < 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                           {ax.drift_summary.drift > 0 ? '+' : ''}{(ax.drift_summary.drift ?? 0).toFixed(2)}
                         </div>
                       )}
                    </div>
                  </Link>
                ))}
              </div>
            </HUDCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reality Status HUD ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-16">
        <HUDCard title="GIÁM SÁT THỰC TẠI" icon={Globe}>
          <div className="space-y-8 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">
                <span>Độ hỗn loạn (Entropy)</span>
                <span className="text-sm font-heading font-black italic text-primary">{(pulseQuery.data?.entropy ?? 0).toFixed(4)}</span>
              </div>
              <HUDProgress value={(pulseQuery.data?.entropy ?? 0) * 100} color="primary" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">
                <span>Độ ổn định</span>
                <span className="text-sm font-heading font-black italic text-amber-600">{((pulseQuery.data?.stabilityIndex ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <HUDProgress value={(pulseQuery.data?.stabilityIndex ?? 0) * 100} color="secondary" />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Rủi ro Điểm kỳ dị</span>
              <HUDBadge color={pulseQuery.data?.singularityRisk === 'HIGH' ? 'destructive' : 'neutral'}>
                {pulseQuery.data?.singularityRisk === 'HIGH' ? 'RẤT CAO' : (pulseQuery.data?.singularityRisk ?? 'NOMINAL')}
              </HUDBadge>
            </div>
          </div>
        </HUDCard>

        <HUDCard title="SỰ KIỆN GẦN ĐÂY" icon={Clock} className="md:col-span-2">
          <div className="space-y-4 pt-4 h-[280px] overflow-y-auto custom-scrollbar pr-4">
            {(timelineQuery.data ?? []).slice(0, 8).map((event, idx) => (
              <motion.div 
                key={event.id ?? idx} 
                className="flex items-start gap-6 p-5 rounded-[24px] border border-slate-50 bg-slate-50/30 hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all group"
              >
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/40 group-hover:scale-150 transition-transform" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-4">
                    <HUDBadge color="primary">T-{event.tick.toLocaleString()}</HUDBadge>
                    {event.category && <HUDBadge color="neutral" className="border-slate-200">{event.category}</HUDBadge>}
                  </div>
                  <p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed italic">&quot;{event.summary}&quot;</p>
                </div>
              </motion.div>
            ))}
            {(timelineQuery.data ?? []).length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                <SearchCode size={40} />
                <p className="text-[10px] font-heading font-black text-slate-400 text-center uppercase tracking-[0.4em]">Chưa có dữ liệu biên niên sử</p>
              </div>
            )}
          </div>
        </HUDCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-16">
        <section className="space-y-10">
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <GitBranch className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Hệ Tiên đề Trọng yếu</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {activeAxioms.filter(a => a.tier === 0).slice(0, 4).map((ax, i) => (
              <motion.div
                key={ax.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <HUDCard className="h-full bg-slate-50/20 hover:bg-white hover:shadow-2xl transition-all group relative border-slate-100 hover:border-primary/20 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Atom className="w-24 h-24 text-primary" />
                  </div>
                  <div className="space-y-8 relative z-10">
                    <HUDBadge className="border-primary/10 text-primary bg-primary/5 shadow-sm font-heading font-black tracking-widest text-[9px]">
                      BẬC {ax.tier} {'//'} {ax.dimension}
                    </HUDBadge>
                    <div>
                      <h3 className="font-heading font-black text-lg text-slate-900 group-hover:text-primary transition-colors uppercase tracking-tight italic leading-snug">{ax.name}</h3>
                      <p className="text-xs text-slate-500 mt-4 italic font-medium leading-relaxed line-clamp-3">&quot;{ax.description}&quot;</p>
                    </div>
                    <div className="pt-6 flex justify-between items-center text-[9px] font-heading font-black border-t border-slate-100 mt-4">
                      <span className="text-slate-300 uppercase tracking-widest">Hằng số gốc:</span>
                      <span className="text-primary font-black italic">{ax.default_value}</span>
                    </div>
                  </div>
                </HUDCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <SearchCode className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Truy xuất Nhân quả</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
             <Link href={`/universes/${universeId}/metrics`} className="group h-32 relative p-1 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all">
               <div className="absolute inset-0 bg-slate-100 group-hover:bg-gradient-to-r from-primary/20 to-transparent transition-all" />
               <div className="relative h-full flex items-center justify-between px-10 bg-white group-hover:bg-primary/[0.02] transition-all border border-slate-100 group-hover:border-primary/20 rounded-[30px]">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 group-hover:text-primary group-hover:bg-primary/5 border border-slate-50 group-hover:border-primary/10 transition-all shadow-inner flex items-center justify-center">
                      <Zap size={28} />
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-slate-800 uppercase tracking-tight">LUỒNG CHỈ SỐ Z-METRIC</span>
                      <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest group-hover:text-primary/60 transition-colors mt-1 block">Quan sát hằng số & biến động lượng tử</span>
                    </div>
                  </div>
                  <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-primary group-hover:translate-x-3 transition-all" />
               </div>
             </Link>

             <Link href={`/universes/${universeId}/timeline`} className="group h-32 relative p-1 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all">
               <div className="absolute inset-0 bg-slate-100 group-hover:bg-gradient-to-r from-indigo-500/20 to-transparent transition-all" />
               <div className="relative h-full flex items-center justify-between px-10 bg-white group-hover:bg-indigo-50/20 transition-all border border-slate-100 group-hover:border-indigo-200 rounded-[30px]">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 border border-slate-50 group-hover:border-indigo-100 transition-all shadow-inner flex items-center justify-center">
                      <History size={28} />
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-slate-800 uppercase tracking-tight">NHẬT KÝ BIÊN NIÊN SỬ</span>
                      <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500/60 transition-colors mt-1 block">Lịch sử tích tụ sự kiện & nhân quả</span>
                    </div>
                  </div>
                  <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-3 transition-all" />
               </div>
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
