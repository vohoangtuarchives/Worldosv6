'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  LayoutDashboard, 
  History, 
  BookOpen, 
  Settings,
  Zap
} from 'lucide-react';

const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => (
  <Link href={href}>
    <motion.div
      whileHover={{ x: 4 }}
      className={`
        group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
        ${active 
          ? 'bg-primary/20 text-primary border border-primary/30 glow-sm' 
          : 'text-muted-foreground hover:bg-card/40 hover:text-foreground border border-transparent'}
      `}
    >
      <Icon size={20} />
      
      {/* Tooltip */}
      <div className="absolute left-16 px-3 py-1.5 rounded-md bg-popover/90 backdrop-blur-md border border-border/50 text-xs font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-50 whitespace-nowrap">
        {label}
      </div>

      {/* Active Indicator */}
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute -left-3 w-1 h-6 bg-primary rounded-r-full glow-primary"
        />
      )}
    </motion.div>
  </Link>
);

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col items-center py-8 bg-card/10 backdrop-blur-2xl border-r border-border/20 z-50 overflow-visible">
      <div className="mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cosmos flex items-center justify-center glow-primary">
          <Zap size={22} className="text-white" fill="white" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6">
        <NavItem href="/" icon={Home} label="Home" active={pathname === '/'} />
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Observer Console" active={pathname.startsWith('/dashboard')} />
        <NavItem href="/chronicles" icon={History} label="Chronicles" active={pathname.startsWith('/chronicles')} />
        <NavItem href="/wiki" icon={BookOpen} label="Loom of Lore" active={pathname.startsWith('/wiki')} />
      </nav>

      <div className="mt-auto">
        <NavItem href="/settings" icon={Settings} label="System Config" active={pathname === '/settings'} />
      </div>
    </aside>
  );
};

export default Sidebar;
