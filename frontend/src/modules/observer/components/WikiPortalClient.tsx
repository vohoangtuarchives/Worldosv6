'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Search, 
  Atom, 
  BookOpen, 
  Users, 
  Zap, 
  Info,
  ChevronRight,
  Sparkles,
  History,
  Map,
  Lightbulb,
  Activity,
  GitBranch,
  ExternalLink,
  Clock,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useObserverUniverseSummaries, useObserverRealityPulse, useObserverUniverseTimeline } from '@/modules/observer/api';
import AutoLinkContent from './wiki/AutoLinkContent';
import { fetchClientJson } from '@/shared/api/observer-http';
import { HUDCard, HUDBadge, HUDProgress } from '@/modules/observer/components/ui/hud-primitives';


interface WikiSearchResult {
  actors: any[];
  chronicles: any[];
  axioms: any[];
}

export default function WikiPortalClient({ universeId }: { universeId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiSearchResult | null>(null);
  const [activeAxioms, setActiveAxioms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const pulseQuery = useObserverRealityPulse(universeId);
  const timelineQuery = useObserverUniverseTimeline(universeId, []);

  useEffect(() => {
    const fetchAxioms = async () => {
      try {
        const data = await fetchClientJson<any>('/api/wiki/axioms');
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
      const data = await fetchClientJson<any>(`/api/wiki/${universeId}/search?q=${val}`);
      setResults(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'axioms', name: 'Kho Định đề', icon: <Atom className="w-5 h-5" />, description: 'Quy luật & Hằng số vật lý' },
    { id: 'entities', name: 'Thực thể Vũ trụ', icon: <Users className="w-5 h-5" />, description: 'Nhân vật, Chủng tộc & Tổ chức' },
    { id: 'chronicles', name: 'Đại Biên niên sử', icon: <History className="w-5 h-5" />, description: 'Biên niên sử & Chuỗi nhân quả' },
    { id: 'geography', name: 'Địa lý Vũ trụ', icon: <Map className="w-5 h-5" />, description: 'Địa lý đa vũ trụ & Vùng không gian' },
    { id: 'metaphysics', name: 'Siêu hình học', icon: <Lightbulb className="w-5 h-5" />, description: 'Khoa học, Đổi mới & Siêu hình' },
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto p-4 md:p-8">
      {/* HUD Header Section */}
      <header className="relative py-12 text-center space-y-4 border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-5 rounded-3xl bg-sky-50 border border-sky-100 mb-4 shadow-sm"
        >
          <BookOpen className="w-12 h-12 text-sky-600 animate-pulse" />
        </motion.div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
            Lưu trữ <span className="text-sky-500 italic">Bản thể</span> Đa vũ trụ
          </h1>
          <div className="flex items-center justify-center gap-6 mt-6">
             <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-sky-500/30" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
               Bản ghi vĩnh cửu của Nhịp đập Thực tại #{universeId}
             </p>
             <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-sky-500/30" />
          </div>
        </div>
      </header>

      {/* Futuristic Search HUD */}
      <div className="relative max-w-3xl mx-auto group">
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
        <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:border-sky-500/50 focus-within:ring-4 focus-within:ring-sky-500/5 transition-all shadow-xl">
          <div className="pl-6 pointer-events-none">
            <Search className="w-7 h-7 text-slate-300 group-focus-within:text-sky-500 transition-colors" />
          </div>
          <input 
            className="w-full h-20 pl-5 pr-8 bg-transparent text-xl font-black text-slate-900 placeholder:text-slate-200 outline-none"
            placeholder="ĐANG QUÉT CÁC MẪU NHÂN QUẢ..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {loading && (
            <div className="pr-8">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Activity className="w-6 h-6 text-sky-500" />
              </motion.div>
            </div>
          )}
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
           <span>Chỉ mục: 4,201,982 bản ghi</span>
           <span className="text-slate-100">|</span>
           <span>Độ trễ: 0.12ms</span>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-16">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="group relative rounded-2xl border border-slate-100 bg-white p-8 flex flex-col items-center text-center gap-6 hover:border-sky-300 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
               <div className="absolute inset-x-0 top-0 h-1 bg-sky-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
               <div className="p-5 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all duration-300 shadow-inner">
                 {cat.icon}
               </div>
               <div className="space-y-2">
                 <h3 className="font-black text-xs text-slate-800 group-hover:text-sky-700 transition-colors uppercase tracking-widest">{cat.name}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight tracking-tight group-hover:text-slate-500">{cat.description}</p>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-16"
          >
            {/* Actors Results */}
            <HUDCard title="Cư dân được nhận diện" icon={Users}>
              <div className="space-y-2">
                {results.actors.map((actor: any) => (
                  <Link 
                    key={actor.id} 
                    href={`/universes/${universeId}/wiki/actor/${actor.id}`}
                    className="p-4 rounded-xl border border-transparent hover:border-sky-100 hover:bg-sky-50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-black text-sm text-slate-800 group-hover:text-sky-700 transition-colors">{actor.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{actor.role}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-sky-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </HUDCard>

            {/* Chronicles Results */}
            <HUDCard title="Đồng bộ Biên niên sử" icon={History}>
              <div className="space-y-2">
                {results.chronicles.map((ch: any) => (
                  <div key={ch.id} className="p-4 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-help">
                    <div className="flex-1">
                      <div className="font-black text-sm text-slate-800 truncate group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{ch.title}</div>
                      <div className="flex items-center gap-3 mt-3">
                        <HUDBadge color="secondary">T-{ch.tick}</HUDBadge>
                        {ch.impact_score > 70 && <HUDBadge color="destructive">NGUY CẤP</HUDBadge>}
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[9px] text-slate-400 font-black tracking-widest mb-1">TÁC ĐỘNG</div>
                       <div className="text-sm font-black text-indigo-600">{ch.impact_score}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </HUDCard>

            {/* Axioms Results */}
            <HUDCard title="Sổ đăng ký Định đề" icon={Atom}>
              <div className="space-y-2">
                {results.axioms.map((ax: any) => (
                  <Link 
                    key={ax.id} 
                    href={`/universes/${universeId}/wiki/axiom/${ax.id}`}
                    className="p-4 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="font-black text-sm text-slate-800 group-hover:text-emerald-700 transition-colors uppercase">{ax.name}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold italic truncate max-w-[120px]">{ax.id}</span>
                        {ax.drift_summary?.status === 'shifting' && (
                          <span className="flex items-center gap-1.5 text-[9px] text-orange-500 animate-pulse font-black uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> Đã lệch
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <HUDBadge className="text-[9px] border-emerald-100 text-emerald-600 bg-emerald-50 tracking-widest">{ax.dimension}</HUDBadge>
                       {ax.drift_summary && (
                         <div className={`text-xs font-black ${ax.drift_summary.drift > 0 ? 'text-emerald-600' : ax.drift_summary.drift < 0 ? 'text-rose-600' : 'text-slate-300'}`}>
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

      {/* ── Tóm tắt trạng thái thế giới ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
        <HUDCard title="Giám sát Thực tại" icon={Globe}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ hỗn loạn (Entropy)</span>
              <span className="text-sm font-black text-sky-600">{(pulseQuery.data?.entropy ?? 0).toFixed(3)}</span>
            </div>
            <HUDProgress value={(pulseQuery.data?.entropy ?? 0) * 100} color="primary" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ ổn định</span>
              <span className="text-sm font-black text-indigo-600">{((pulseQuery.data?.stabilityIndex ?? 0) * 100).toFixed(1)}%</span>
            </div>
            <HUDProgress value={(pulseQuery.data?.stabilityIndex ?? 0) * 100} color="secondary" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rủi ro Điểm kỳ dị</span>
              <HUDBadge color={pulseQuery.data?.singularityRisk === 'HIGH' ? 'destructive' : 'neutral'}>
                {pulseQuery.data?.singularityRisk === 'HIGH' ? 'CAO' : (pulseQuery.data?.singularityRisk ?? 'N/A')}
              </HUDBadge>
            </div>
          </div>
        </HUDCard>

        <HUDCard title="Sự kiện gần đây" icon={Clock} className="md:col-span-2">
          <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-3">
            {(timelineQuery.data ?? []).slice(0, 5).map((event, idx) => (
              <div key={event.id ?? idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-50 hover:border-sky-100 hover:bg-sky-50/50 transition-all">
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <HUDBadge color="primary">T-{event.tick}</HUDBadge>
                    {event.category && <HUDBadge color="neutral">{event.category}</HUDBadge>}
                  </div>
                  <p className="text-xs font-bold text-slate-600 mt-2 line-clamp-1">{event.summary}</p>
                </div>
              </div>
            ))}
            {(timelineQuery.data ?? []).length === 0 && (
              <p className="text-[10px] font-black text-slate-300 text-center py-10 uppercase tracking-[0.3em]">Chưa có sự kiện nào được ghi nhận</p>
            )}
          </div>
        </HUDCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16">
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b-2 border-sky-100 pb-5">
            <GitBranch className="w-7 h-7 text-sky-600" />
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Định đề nổi bật</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {activeAxioms.filter(a => a.tier === 0).slice(0, 4).map((ax, i) => (
              <motion.div
                key={ax.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <HUDCard className="h-full bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group relative border-slate-100 hover:border-sky-200">
                  <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Atom className="w-20 h-20 text-sky-600" />
                  </div>
                  <div className="space-y-6">
                    <HUDBadge className="border-sky-100 text-sky-600 bg-sky-50 shadow-sm">
                      BẬC {ax.tier} | {ax.dimension}
                    </HUDBadge>
                    <div>
                      <h3 className="font-black text-md text-slate-800 group-hover:text-sky-700 transition-colors uppercase tracking-tight">{ax.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-3 italic font-bold leading-relaxed line-clamp-2">"{ax.description}"</p>
                    </div>
                    <div className="pt-4 flex justify-between items-center text-[10px] font-black border-t border-slate-100 mt-auto">
                      <span className="text-slate-300 uppercase tracking-widest">Hằng số mặc định:</span>
                      <span className="text-sky-600 font-black">{ax.default_value}</span>
                    </div>
                  </div>
                </HUDCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b-2 border-indigo-100 pb-5">
            <ExternalLink className="w-7 h-7 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Truy cập Nhân quả</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
             <Link href={`/universes/${universeId}/metrics`} className="group h-24 relative p-[1px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
               <div className="absolute inset-0 bg-slate-100 group-hover:bg-gradient-to-r from-indigo-500/20 to-transparent transition-all" />
               <div className="relative h-full flex items-center justify-between px-8 bg-white group-hover:bg-indigo-50/30 transition-all border border-slate-100 group-hover:border-indigo-200 rounded-2xl">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-slate-50 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 border border-slate-50 group-hover:border-indigo-100 transition-all shadow-inner">
                      <Zap size={24} />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-slate-800 uppercase tracking-[0.2em]">LUỒNG CHỈ SỐ Z-METRIC</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500/60 transition-colors">Quan sát Hằng số & Biến động</span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
               </div>
             </Link>

             <Link href={`/universes/${universeId}/timeline`} className="group h-24 relative p-[1px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
               <div className="absolute inset-0 bg-slate-100 group-hover:bg-gradient-to-r from-indigo-500/20 to-transparent transition-all" />
               <div className="relative h-full flex items-center justify-between px-8 bg-white group-hover:bg-indigo-50/30 transition-all border border-slate-100 group-hover:border-indigo-200 rounded-2xl">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-slate-50 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 border border-slate-50 group-hover:border-indigo-100 transition-all shadow-inner">
                      <History size={24} />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-slate-800 uppercase tracking-[0.2em]">NHẬT KÝ BIÊN NIÊN SỬ</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500/60 transition-colors">Lịch sử Hội tụ Tự sự</span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
               </div>
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
