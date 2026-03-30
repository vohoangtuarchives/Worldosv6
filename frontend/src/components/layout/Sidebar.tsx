'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Orbit, 
  History, 
  Users, 
  Settings,
  Zap,
  Sparkles,
  Globe,
  Search,
  FlaskConical,
  Clock,
  ShieldAlert,
  Atom,
  GitBranch,
  Camera,
  ChevronLeft,
  type LucideIcon
} from 'lucide-react';

const NavItem = ({ href, icon: Icon, label, active, color = 'sky' }: { 
  href: string; 
  icon: LucideIcon; 
  label: string; 
  active: boolean;
  color?: 'sky' | 'amber' | 'slate' 
}) => {
  const colorClasses = {
    sky: active ? 'bg-sky-50 text-sky-700 border-sky-100 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-sky-600',
    amber: active ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600',
    slate: active ? 'bg-slate-100 text-slate-800 border-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900',
  };

  const indicatorColors = {
    sky: 'bg-sky-600',
    amber: 'bg-amber-500',
    slate: 'bg-slate-700',
  };

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 4 }}
        className={`
          group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 border
          ${colorClasses[color]}
        `}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
        
        <div className="absolute left-16 px-3 py-1.5 rounded-lg bg-slate-900 text-white shadow-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-[100] whitespace-nowrap">
          {label}
        </div>

        {active && (
          <motion.div 
            layoutId="sidebar-active"
            className={`absolute -left-4 w-1 h-6 ${indicatorColors[color]} rounded-r-full`}
          />
        )}
      </motion.div>
    </Link>
  );
};

const Sidebar = () => {
  const pathname = usePathname();
  const params = useParams();
  const universeId = params?.universeId as string;

  const isUniverseContext = !!universeId;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[78px] flex flex-col items-center py-6 bg-white border-r border-slate-100 z-50 overflow-y-auto no-scrollbar">
      {/* Brand / Context Switcher */}
      <div className="mb-8">
        <Link href="/dashboard">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
            {isUniverseContext ? <ChevronLeft size={20} className="text-white" /> : <Zap size={20} className="text-white" fill="white" />}
          </div>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {!isUniverseContext ? (
            <motion.div
              key="global-nav"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-4"
            >
              <NavItem href="/dashboard" icon={Home} label="Tổng quan" active={pathname === '/dashboard'} />
              <NavItem href="/dashboard" icon={Orbit} label="Vũ trụ" active={pathname === '/dashboard/universes'} />
              <NavItem href="/dashboard/universes/create" icon={Sparkles} label="Khởi tạo" active={pathname.includes('/create')} color="amber" />
              <NavItem href="/dashboard/narrative" icon={History} label="Biên niên" active={pathname.includes('/narrative')} />
              <NavItem href="/dashboard" icon={Users} label="Cư dân" active={pathname.includes('/actors')} />
            </motion.div>
          ) : (
            <motion.div
              key="universe-nav"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-3"
            >
              <NavItem href={`/universes/${universeId}`} icon={Monitor} label="Bàn làm việc" active={pathname === `/universes/${universeId}`} />
              <NavItem href={`/universes/${universeId}/reality`} icon={Globe} label="Thực tại" active={pathname.includes('/reality')} />
              <NavItem href={`/universes/${universeId}/wiki`} icon={Search} label="Thư viện" active={pathname.includes('/wiki')} />
              <NavItem href={`/universes/${universeId}/omen-lab`} icon={FlaskConical} label="Phòng Lab" active={pathname.includes('/omen-lab')} />
              <NavItem href={`/universes/${universeId}/chronicles`} icon={History} label="Biên niên sử" active={pathname.includes('/chronicles')} />
              <NavItem href={`/universes/${universeId}/myth-scars`} icon={ShieldAlert} label="Vết sẹo" active={pathname.includes('/myth-scars')} />
              <NavItem href={`/universes/${universeId}/timeline`} icon={Clock} label="Dòng thời gian" active={pathname.includes('/timeline')} />
              <NavItem href={`/universes/${universeId}/axioms`} icon={Atom} label="Tiên đề" active={pathname.includes('/axioms')} />
              <NavItem href={`/universes/${universeId}/control`} icon={Zap} label="Điều khiển" active={pathname.includes('/control')} />
              <NavItem href={`/universes/${universeId}/forks`} icon={GitBranch} label="Phân nhánh" active={pathname.includes('/forks')} />
              <NavItem href={`/universes/${universeId}/snapshots`} icon={Camera} label="Ảnh chụp" active={pathname.includes('/snapshots')} />
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="mt-8 pt-6 border-t border-slate-50">
        <NavItem href="/dashboard/ai-config" icon={Settings} label="Hệ thống" active={pathname.startsWith('/dashboard/ai-config')} color="slate" />
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </aside>
  );
};

import { Monitor } from 'lucide-react';

export default Sidebar;
