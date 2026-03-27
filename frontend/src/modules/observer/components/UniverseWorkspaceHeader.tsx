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
        label: 'NHÂN QUẢ ỔN ĐỊNH',
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
        label: 'TRẠNG THÁI CHƯA XÁC ĐỊNH',
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
    <header className="relative rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm overflow-hidden group transition-all hover:shadow-md">
      {/* HUD Background Decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 blur-[120px] pointer-events-none transition-all group-hover:bg-sky-500/10" />
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
      
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between relative z-10 font-sans">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Không gian v4.2</span>
            </div>
            <HUDBadge color={badgeColorMapping[statusInfo.color]} className="px-4 py-1.5 rounded-xl border-sky-100">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusInfo.label}</span>
              </div>
            </HUDBadge>
          </div>
          
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none"
            >
              {universe.name}
              <motion.span 
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-sky-500 ml-2"
              >_</motion.span>
            </motion.h1>
            <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-[0.2em] max-w-2xl leading-relaxed italic opacity-80 decoration-sky-500/30 underline decoration-2 underline-offset-4">
              &ldquo;{universe.focus}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link 
            href={`/universes/${universe.id}/control`} 
            className="group/btn relative px-8 py-5 rounded-[1.25rem] border border-sky-100 bg-sky-50 hover:bg-sky-500 hover:text-white transition-all overflow-hidden shadow-sm"
          >
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-sky-600 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left" />
            <span className="relative flex items-center gap-3 text-xs font-black text-sky-600 group-hover/btn:text-white uppercase tracking-widest">
              <Zap className="w-5 h-5 transition-transform group-hover/btn:scale-110" /> Thực thi Điều khiển
            </span>
          </Link>
          
          <Link 
            href={`/universes/${universe.id}/timeline`} 
            className="group/btn relative px-8 py-5 rounded-[1.25rem] border border-slate-100 bg-white hover:bg-slate-50 transition-all overflow-hidden shadow-sm"
          >
             <span className="relative flex items-center gap-3 text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">
              <Clock className="w-5 h-5 transition-transform group-hover:scale-110" /> Kiểm toán Dòng thời gian
            </span>
          </Link>

          <Link 
            href={`/universes/${universe.id}/forks`} 
            className="group/btn relative px-8 py-5 rounded-[1.25rem] border border-slate-100 bg-white hover:bg-slate-50 transition-all overflow-hidden shadow-sm"
          >
             <span className="relative flex items-center gap-3 text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">
              <GitBranch className="w-5 h-5 transition-transform group-hover:scale-110" /> Kiểm tra Nhánh
            </span>
          </Link>
        </div>
      </div>
      
      {/* Bottom scanning line effect */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-100 group-hover:bg-sky-500/20 transition-colors" />
    </header>
  );
}
