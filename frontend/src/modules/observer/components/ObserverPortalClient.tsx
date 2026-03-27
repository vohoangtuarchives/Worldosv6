'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Orbit, 
  ScanSearch, 
  ShieldCheck, 
  Monitor, 
  Terminal,
  Server,
  Activity,
  ChevronRight,
  Zap,
  Globe
} from 'lucide-react';
import { useObserverUniverseSummaries } from '@/modules/observer/api';
import { UniverseCard } from '@/modules/observer/components/UniverseCard';
import { HUDMetric } from '@/modules/observer/components/ui/hud-primitives';
import type { UniverseSummary } from '@/modules/observer/types';

export function ObserverPortalClient({ initialUniverses }: { initialUniverses: UniverseSummary[] }) {
  const { data: universes = initialUniverses } = useObserverUniverseSummaries(initialUniverses);

  if (!universes) return null;

  const activeUniverses = universes.filter((universe) => universe.status === 'active').length;
  const totalAnomalies = universes.reduce((sum, universe) => sum + universe.anomalyCount, 0);
  const primaryUniverse = universes[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-[1540px] space-y-12">
        {/* Portal Header HUD */}
        <header className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-14 group shadow-2xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
          
          <div className="grid gap-16 xl:grid-cols-[1fr_450px] relative z-10">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 shadow-sm">
                    <Monitor className="w-4 h-4 text-sky-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">ĐÃ CẤP QUYỀN TRUY CẬP CỔNG</span>
                 </div>
                 <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">v4.8.0_HUD</span>
                 </div>
              </div>

              <div>
                <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tighter mb-6 leading-[1.1]">
                   Cổng Quan sát<br/>
                   <span className="text-sky-600 group-hover:glow-sky-light transition-all italic">Đa vũ trụ</span>
                </h1>
                <p className="max-w-xl text-xs font-bold leading-relaxed text-slate-400 uppercase tracking-[0.1em]">
                  Các cổng vũ trụ đã được khởi tạo. Kiến trúc không gian làm việc tách biệt đang hoạt động. 
                  Hãy chọn một tầng thực tại để bắt đầu giám sát đa chiều và kiểm soát nhân quả.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-6">
                <Link
                  href={primaryUniverse ? `/universes/${primaryUniverse.id}` : '/universes'}
                  className="group/btn relative px-10 py-5 rounded-2xl bg-sky-600 hover:bg-sky-700 transition-all overflow-hidden shadow-lg shadow-sky-500/25"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center gap-3 text-xs font-black text-white uppercase tracking-[0.2em]">
                    Khởi tạo Nút Chính <ArrowRight size={18} />
                  </span>
                </Link>
                
                <Link
                  href="/system/ai-config"
                  className="group/btn relative px-10 py-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all overflow-hidden shadow-sm"
                >
                  <span className="relative flex items-center gap-3 text-xs font-black text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-[0.2em]">
                    Cấu hình Hệ thống <Zap size={18} />
                  </span>
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                 <Server className="w-4 h-4" /> Đo lường Toàn cầu
              </div>
              <div className="grid gap-4">
                <HUDMetric label="Tầng được Theo dõi" value={universes.length} icon={<Orbit size={24} />} className="bg-slate-50/50 border-slate-100" />
                <HUDMetric label="Ma trận Hoạt động" value={activeUniverses} trend={activeUniverses > 0 ? 'up' : 'stable'} icon={<ShieldCheck size={24} />} className="bg-slate-50/50 border-slate-100" />
                <HUDMetric label="Dị biệt được Phát hiện" value={totalAnomalies} trend={totalAnomalies > 0 ? 'down' : 'stable'} icon={<ScanSearch size={24} />} className="bg-slate-50/50 border-slate-100" />
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-100" />
        </header>

        {/* Universes Grid HUD */}
        <section className="space-y-10">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">
            <div className="flex items-center gap-6">
               <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 shadow-sm">
                  <Globe className="w-8 h-8 text-sky-600" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Không gian Làm việc</h2>
                  <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em] mt-2 font-black italic">Chỉ dành cho các Thực tại được Ủy quyền</p>
               </div>
            </div>
          </div>

          {universes.length > 0 ? (
            <div className="grid gap-10 xl:grid-cols-2 lg:grid-cols-2">
              {universes.map((universe) => (
                <UniverseCard key={universe.id} universe={universe} />
              ))}
            </div>
          ) : (
            <div className="p-32 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/30">
              <Activity className="w-20 h-20 text-slate-200 mx-auto mb-8 animate-pulse" />
              <p className="text-sm text-slate-300 uppercase tracking-[0.4em] font-black">Đang chờ khởi tạo thực tại...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
