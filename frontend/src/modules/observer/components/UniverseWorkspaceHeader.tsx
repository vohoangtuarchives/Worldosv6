'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { UniverseDetail } from '@/modules/observer/types';
import {
  Activity,
  GitBranch,
  Terminal,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { HUDBadge } from './ui/hud-primitives';

function getStatusInfo(status: UniverseDetail['status']) {
  switch (status) {
    case 'active':
      return {
        color: 'sky' as const,
        label: 'THỰC TẠI ỔN ĐỊNH',
        icon: ShieldCheck
      };
    case 'forked':
      return {
        color: 'emerald' as const,
        label: 'NHÁNH PHÂN KỲ',
        icon: GitBranch
      };
    default:
      return {
        color: 'slate' as const,
        label: 'ĐANG XÁC ĐỊNH TRẠNG THÁI',
        icon: Activity
      };
  }
}

export function UniverseWorkspaceHeader({ universe }: { universe: UniverseDetail }) {
  const statusInfo = getStatusInfo(universe.status);
  const StatusIcon = statusInfo.icon;

  const badgeColorMapping: Record<string, "primary" | "secondary" | "destructive" | "neutral"> = {
    sky: "primary",
    emerald: "secondary",
    slate: "neutral"
  };

  return (
    <header className="relative rounded-[32px] border border-slate-200 bg-white p-10 lg:p-14 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
      {/* HUD Background Decorations */}
      <div className="absolute top-0 right-0 w-[400px] h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none transition-all group-hover:bg-primary/10" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between relative z-10 font-sans">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-heading font-black uppercase tracking-[0.25em] text-slate-400">KHÔNG GIAN LÀM VIỆC V6.5</span>
            </div>
            <HUDBadge color={badgeColorMapping[statusInfo.color]} className="px-5 py-2 rounded-xl border-primary/10">
              <div className="flex items-center gap-2.5 font-heading font-black text-[10px] tracking-widest leading-none">
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusInfo.label}</span>
              </div>
            </HUDBadge>
          </div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl lg:text-6xl font-heading font-black text-slate-900 uppercase tracking-tighter leading-none italic"
            >
              {universe.name}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-primary ml-2"
              >_</motion.span>
            </motion.h1>
            <p className="text-sm font-medium leading-relaxed text-slate-500 max-w-2xl italic">
              &ldquo;{universe.focus || "Thông số thực tại đang được đồng bộ hóa từ Hạt nhân Đa vũ trụ."}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 lg:pt-0">
          <Link
            href={`/universes/${universe.id}/control`}
            className="group/btn relative px-10 py-5 rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all overflow-hidden shadow-lg shadow-primary/20"
          >
            <span className="relative flex items-center gap-3 text-[10px] font-heading font-black uppercase tracking-widest">
              <Zap className="w-5 h-5 transition-transform group-hover/btn:scale-110" /> Thực thi Điều khiển
            </span>
          </Link>

          <Link
            href={`/universes/${universe.id}/timeline`}
            className="group/btn relative px-10 py-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className="relative flex items-center gap-3 text-[10px] font-heading font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">
              <Clock className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-300 group-hover:text-primary" /> Kiểm toán Dòng thời gian
            </span>
          </Link>

          <Link
            href={`/universes/${universe.id}/forks`}
            className="group/btn relative px-10 py-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className="relative flex items-center gap-3 text-[10px] font-heading font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">
              <GitBranch className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-300 group-hover:text-primary" /> Kiểm tra Nhánh
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom scanning decorative line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-50 group-hover:bg-primary/20 transition-colors" />
    </header>
  );
}
