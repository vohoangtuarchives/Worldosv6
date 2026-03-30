'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { HUDBadge } from './ui/hud-primitives';
import { observerSections } from '@/modules/observer/types';
import { 
  Home, 
  Globe, 
  Search, 
  FlaskConical, 
  Clock, 
  History, 
  ShieldAlert, 
  Users, 
  Atom, 
  Zap, 
  GitBranch, 
  Camera,
  ChevronRight,
  Monitor,
  Target,
  Cpu
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Tổng quan': Home,
  'Thực tại': Globe,
  'Wiki': Search,
  'Phòng Lab Omen': FlaskConical,
  'Dòng thời gian': Clock,
  'Biên niên sử': History,
  'Vết sẹo Thần thoại': ShieldAlert,
  'Thực thể': Users,
  'Tiên đề': Atom,
  'Điều khiển': Zap,
  'Nhánh': GitBranch,
  'Ảnh chụp': Camera,
};

export function ObserverSidebar({ universeId }: { universeId: string }) {
  const pathname = usePathname();

  return (
    <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start font-sans">
      <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm overflow-hidden transition-all hover:shadow-md">
        {/* Subtle HUD background effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
        
        <div className="flex items-center justify-between gap-3 px-3 pb-5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-sky-600 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Thấu kính Quan sát</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-sky-500/20 animate-ping" />
        </div>

        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 xl:mx-0 xl:block xl:space-y-2 xl:overflow-visible xl:px-0 custom-scrollbar">
          {observerSections.map((section) => {
            const href = `/universes/${universeId}${section.href}`;
            const active = pathname === href;
            const Icon = iconMap[section.label] || Target;

            return (
              <Link
                key={href}
                href={href}
                className={`group relative shrink-0 flex items-center gap-4 rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all xl:w-full border shadow-sm ${
                  active
                    ? 'bg-sky-50 text-sky-600 border-sky-100 shadow-sky-500/5'
                    : 'text-slate-400 border-transparent bg-transparent hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                {/* Active Indicator */}
                {active && (
                   <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-500 rounded-r-full" 
                   />
                )}
                
                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-sky-600' : 'text-slate-300 group-hover:text-slate-500'}`} />
                <span className="truncate">{section.label}</span>
                
                {active && (
                   <ChevronRight className="ml-auto w-3.5 h-3.5 text-sky-400 animate-pulse hidden xl:block" />
                )}
              </Link>
            );
          })}

          <div className="my-4 h-px bg-slate-50 mx-2" />

          <Link
            href="/dashboard/ai-config"
            className="group flex items-center gap-4 rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all text-slate-500 border border-dashed border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 hover:text-sky-600 xl:w-full"
          >
            <Cpu className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
            <span className="truncate">Quản trị AI Hệ thống</span>
          </Link>
        </nav>
      </div>
      
      {/* HUD System Status Mini-Card */}
      <div className="hidden xl:block p-6 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm group hover:border-sky-200 transition-all">
         <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Liên kết Hệ thống</span>
            <HUDBadge color="primary" className="text-[8px]">TỐI ƯU</HUDBadge>
         </div>
         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full" 
            />
         </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 3px;
          width: 0px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </aside>
  );
}
