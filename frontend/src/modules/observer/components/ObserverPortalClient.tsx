'use client';

import React from 'react';
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
  Globe,
  Plus
} from 'lucide-react';
import { useObserverUniverseSummaries } from '@/modules/observer/api';
import { UniverseCard } from '@/modules/observer/components/UniverseCard';
import { HUDMetric } from '@/modules/observer/components/ui/hud-primitives';
import type { UniverseSummary } from '@/modules/observer/types';
import { motion } from 'framer-motion';

export function ObserverPortalClient({ initialUniverses }: { initialUniverses: UniverseSummary[] }) {
  const { data: universes = initialUniverses } = useObserverUniverseSummaries(initialUniverses);

  if (!universes) return null;

  const activeUniverses = universes.filter((universe) => universe.status === 'active').length;
  const totalAnomalies = universes.reduce((sum, universe) => sum + universe.anomalyCount, 0);
  const primaryUniverse = universes[0];

  return (
    <div className="space-y-12 pb-24">
      {/* Portal Header HUD: High-Fidelity Light HUD */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-10 lg:p-14 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-[600px] h-full bg-sky-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="grid gap-16 xl:grid-cols-[1fr_450px] relative z-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 shadow-sm">
                <Monitor className="w-4 h-4 text-sky-600 animate-pulse" />
                <span className="text-[10px] font-heading font-black text-sky-700 uppercase tracking-widest leading-none">TRUY CẬP ĐƯỢC CẤP PHÉP</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest leading-none">V6.5.0_PORTAL</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl font-heading font-black tracking-tighter text-slate-950 leading-[1.05] italic">
                Cổng Quan sát<br />
                <span className="text-primary group-hover:glow-sky-light transition-all">Đa vũ trụ</span>
              </h1>
              <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500">
                Mạng lưới liên kết đa chiều đã sẵn sàng. Hệ thống phân tách thực tại đang vận hành ổn định.
                Hãy chọn một nút thắt nhân quả để bắt đầu giám sát trạng thái văn minh.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <Link
                href={primaryUniverse ? `/universes/${primaryUniverse.id}` : '/dashboard/universes/create'}
                className="group relative px-10 py-5 rounded-2xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <span className="relative flex items-center gap-3 text-[10px] font-heading font-black text-white uppercase tracking-[0.25em]">
                  Truy cập Thực tại Chính <ArrowRight size={18} />
                </span>
              </Link>

              <Link
                href="/dashboard/universes/create"
                className="group relative px-10 py-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
              >
                <span className="relative flex items-center gap-3 text-[10px] font-heading font-black text-slate-600 uppercase tracking-[0.25em]">
                  Khởi tạo Mới <Plus size={18} />
                </span>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-3 text-[10px] font-heading font-black uppercase tracking-[0.3em] text-slate-400">
              <Server className="w-4 h-4" /> TRẠNG THÁI TOÀN CẦU
            </div>
            <div className="grid gap-4">
              <HUDMetric label="Thực tại Theo dõi" value={universes.length} icon={<Orbit size={24} />} className="bg-slate-50/50 border-slate-100 p-6 rounded-2xl" />
              <HUDMetric label="Nút Hoạt động" value={activeUniverses} trend={activeUniverses > 0 ? 'up' : 'stable'} icon={<ShieldCheck size={24} />} className="bg-slate-50/50 border-slate-100 p-6 rounded-2xl" />
              <HUDMetric label="Dị biệt Phát hiện" value={totalAnomalies} trend={totalAnomalies > 0 ? 'down' : 'stable'} icon={<ScanSearch size={24} />} className="bg-slate-50/50 border-slate-100 p-6 rounded-2xl" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Universes Grid Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 shadow-sm text-primary">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Hệ thống Điều phối</h2>
              <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest mt-1">Dữ liệu phân mảnh từ các nhánh thực tại</p>
            </div>
          </div>
        </div>

        {universes.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {universes.map((universe) => (
              <UniverseCard key={universe.id} universe={universe} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50">
            <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6 animate-pulse" />
            <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Đang chờ khởi tạo thực tại mới...</p>
          </div>
        )}
      </section>
    </div>
  );
}