'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Cpu, 
  Settings, 
  LayoutDashboard,
  Zap,
  Box
} from 'lucide-react';

const navItems = [
  { name: 'OBSERVER_HUB', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI_ORCHESTRATOR', path: '/dashboard/ai-config', icon: Cpu },
  // { name: 'SIM_CHRONICLE', path: '/dashboard/chronicle', icon: BarChart3 },
];

const DashboardNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 p-1 bg-void/40 border border-border/40 rounded-xl">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;

        return (
          <Link 
            key={item.path}
            href={item.path}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all relative ${
              isActive 
                ? 'text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {isActive && (
              <motion.div 
                layoutId="nav-active"
                className="absolute inset-0 bg-primary rounded-lg shadow-lg shadow-primary/20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
               <Icon size={14} />
               {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default DashboardNav;
