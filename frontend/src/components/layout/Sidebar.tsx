'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  Orbit, 
  History, 
  Users, 
  Settings,
  Zap,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: LucideIcon; label: string; active: boolean }) => (
  <Link href={href}>
    <motion.div
      whileHover={{ x: 4 }}
      className={`
        group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
        ${active 
          ? 'bg-sky-100 text-sky-700 border border-sky-200 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}
      `}
    >
      <Icon size={20} />
      
      {/* Tooltip */}
      <div className="absolute left-16 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-lg text-xs font-medium text-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-50 whitespace-nowrap">
        {label}
      </div>

      {/* Active Indicator */}
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute -left-3 w-1 h-6 bg-sky-600 rounded-r-full"
        />
      )}
    </motion.div>
  </Link>
);

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col items-center py-8 bg-white border-r border-slate-200 z-50 overflow-visible">
      <div className="mb-12">
        <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-md">
          <Zap size={22} className="text-white" fill="white" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6">
        <NavItem href="/dashboard" icon={Home} label="Trang chủ" active={pathname === '/dashboard'} />
        <NavItem href="/dashboard" icon={Orbit} label="Trung tâm Vũ trụ" active={pathname === '/dashboard'} />
        <NavItem href="/dashboard/universes/create" icon={Sparkles} label="Xưởng Axiom" active={pathname.includes('/create')} />
        <NavItem href="/dashboard/narrative" icon={History} label="Biên niên sử" active={pathname.includes('/narrative')} />
        <NavItem href="/dashboard" icon={Users} label="Thực thể" active={pathname.includes('/actors')} />
      </nav>

      <div className="mt-auto">
        <NavItem href="/dashboard/ai-config" icon={Settings} label="Cấu hình Hệ thống" active={pathname.startsWith('/dashboard/ai-config')} />
      </div>
    </aside>
  );
};

export default Sidebar;

