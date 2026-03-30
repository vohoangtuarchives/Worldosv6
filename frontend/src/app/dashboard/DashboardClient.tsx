'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Activity, 
  Database, 
  Cpu, 
  ChevronRight, 
  Zap,
  LucideIcon,
  BarChart3,
  Waves
} from 'lucide-react';
import Link from 'next/link';
import { useObserverUniverseSummaries, useMultiverseResonance } from '@/modules/observer/api';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import type { UniverseSummary, ResonancePollen } from '@/modules/observer/types';

const DashboardClient = () => {
  const { data: universes, isLoading, isError, refetch } = useObserverUniverseSummaries();
  const { data: resonance } = useMultiverseResonance();

  if (isLoading) return <ObserverLoadingState lines={8} />;
  if (isError) {
    return (
      <ObserverErrorState 
        title="Trạm Đa vũ trụ Ngoại tuyến" 
        description="Không thể đồng bộ với Nhân WorldOS. Dữ liệu viễn thám thực tại đang bị che khuất."
        onRetry={() => void refetch()} 
      />
    );
  }

  const universeList = universes ?? [];
  
  // Aggregate Stats
  const totalMass = universeList.reduce((acc, u) => acc + (u.informationalMass ?? 0), 0);
  const avgEntropy = universeList.length > 0 
    ? universeList.reduce((acc, u) => acc + (u.entropy ?? 0), 0) / universeList.length 
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-10 lg:p-14 shadow-sm">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-heading font-black text-primary uppercase tracking-[0.2em]">
              <Zap size={14} fill="currentColor" />
              Nhân đang hoạt động // Đa liên kết
            </div>
            <h1 className="text-5xl lg:text-6xl font-heading font-black tracking-tighter text-slate-950 leading-[1.05]">
              Trung tâm <span className="text-primary italic">Quan sát</span> Đa vũ trụ
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed text-lg max-w-2xl">
              Giám sát và điều phối tất cả các thực tại từ bảng điều khiển tập trung. WorldOS V6 cung cấp cái nhìn toàn cảnh về Entropy, Khối lượng Thông tin và độ ổn định liên kết giữa các thế giới.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:min-w-[440px]">
            <QuickStat icon={Database} label="Tổng khối lượng" value={`${(totalMass / 1000).toFixed(1)}K`} unit="IM" />
            <QuickStat icon={Activity} label="Entropy TB" value={avgEntropy.toFixed(2)} color="text-amber-600" />
            <QuickStat icon={Globe} label="Số Vũ trụ" value={String(universes?.length ?? 0)} unit="N" />
          </div>
        </div>
      </section>

      {/* Universe Grid Overlay */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary shadow-sm">
                 <Waves size={20} />
            </div>
            <div>
                 <h2 className="text-xl font-bold tracking-tight text-slate-900">
                   Nhánh Thực tại Đang hoạt động
                 </h2>
                 <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest mt-0.5">Cơ sở dữ liệu thực thể sống</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-heading font-black text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 uppercase tracking-widest">
                {universes?.length} THỰC THỂ ĐÃ PHÁT HIỆN
             </span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {universes?.map((universe) => {
            const resonanceForUniverse = resonance?.resonance_pollen.filter(p => p.universe_id === Number(universe.id));
            return (
              <UniverseCard 
                key={universe.id} 
                universe={universe} 
                resonance={resonanceForUniverse} 
              />
            )
          })}

          {/* New Universe Placeholder */}
          <Link 
            href="/dashboard/universes/create"
            className="group relative flex flex-col items-center justify-center gap-6 rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/30 p-10 transition-all hover:border-primary/50 hover:bg-white hover:shadow-xl"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/50 transition-all group-hover:scale-110">
              <Zap size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition">Khởi tạo Thực tại mới</h3>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-heading font-black tracking-[0.2em]">Cấu hình Tiên đề Gốc</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid gap-8 md:grid-cols-2">
         <Link href="/dashboard/ai-config" className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 flex items-center justify-between hover:border-primary/30 transition-all shadow-sm hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                  <Cpu size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-slate-900">Điều phối AI</h3>
                  <p className="text-sm text-slate-500 mt-1">Quản lý driver nơ-ron và cấu hình mô hình</p>
               </div>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all group-hover:translate-x-1">
               <ChevronRight size={20} />
            </div>
         </Link>

         <Link href="/dashboard/metrics" className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 flex items-center justify-between hover:border-sky-400/30 transition-all shadow-sm hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-sky-600 shadow-lg shadow-sky-200 flex items-center justify-center text-white">
                  <BarChart3 size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-slate-900">Phân tích Đa vũ trụ</h3>
                  <p className="text-sm text-slate-500 mt-1">Chẩn đoán chuyên sâu Z-Metrics & Độ ổn định</p>
               </div>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all group-hover:translate-x-1">
               <ChevronRight size={20} />
            </div>
         </Link>
      </div>
    </div>
  );
};

const QuickStat = ({ icon: Icon, label, value, unit, color = "text-primary" }: { icon: LucideIcon, label: string, value: string, unit?: string, color?: string }) => (
  <div className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 flex flex-col justify-center gap-2 hover:bg-white hover:shadow-md transition-all">
    <div className="flex items-center gap-2.5 text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.2em]">
      <div className="w-4 h-4 rounded-md bg-white border border-slate-100 flex items-center justify-center">
        <Icon size={10} className="text-slate-500" />
      </div>
      {label}
    </div>
    <div className="flex items-baseline gap-1.5">
      <div className={`text-3xl font-heading font-black italic tracking-tighter ${color}`}>{value}</div>
      {unit && <span className="text-[10px] font-heading font-black text-slate-300 uppercase">{unit}</span>}
    </div>
  </div>
);

const UniverseCard = ({ universe, resonance }: { universe: UniverseSummary, resonance?: ResonancePollen[] }) => {
  const hasHighDistortion = resonance?.some(r => r.distortion > 0.5);
  const activeVfx = hasHighDistortion ? resonance?.find(r => r.distortion > 0.5)?.vfx : null;

  return (
    <Link href={`/universes/${universe.id}`} className="h-full">
      <motion.div 
        whileHover={{ y: -6 }}
        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] border bg-white p-8 shadow-sm transition-all hover:shadow-2xl ${hasHighDistortion 
            ? 'border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.15)] hover:border-rose-600'
            : 'border-slate-200 hover:border-primary'
        }`}
      >
        {/* Local VFX Overlay */}
        {activeVfx && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px] z-0 opacity-40">
            {activeVfx.effect_type === 'glitch' && (
              <div className="absolute inset-0 bg-rose-500/10 mix-blend-screen animate-glitch-subtle" />
            )}
            {activeVfx.effect_type === 'bloom_glow' && (
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent blur-2xl" />
            )}
          </div>
        )}

        <div className="relative z-10">
          {/* Status Line */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${universe.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.2em]">{universe.status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}</span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-heading font-black tracking-widest ${hasHighDistortion ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-primary/5 border-primary/10 text-primary'}`}>
              TIC {universe.currentTick.toLocaleString()}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors truncate" title={universe.name}>
              {universe.name}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
              {universe.focus || 'Nội dung thực tại đang được kiến tạo và đồng bộ hóa.'}
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-8 mt-8 border-t border-slate-50">
          {/* Metrics Minimal */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-heading font-black text-slate-300 uppercase tracking-widest">Entropy</span>
                <span className="text-sm font-heading font-black italic text-amber-600">{(universe.entropy ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
                <span className="text-[9px] font-heading font-black text-slate-300 uppercase tracking-widest text-right">Khối lượng</span>
                <span className="text-sm font-heading font-black italic text-sky-600">{(universe.informationalMass ?? 0).toFixed(1)}KG</span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end">
            <div className="flex items-center gap-2 text-[10px] font-heading font-black text-primary group-hover:gap-3 transition-all uppercase tracking-[0.2em]">
                Truy cập <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default DashboardClient;
