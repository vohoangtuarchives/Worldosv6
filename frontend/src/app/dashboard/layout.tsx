'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    Settings, 
    Database, 
    History, 
    Menu, 
    X, 
    Zap,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, href, active }: any) => (
    <Link href={href}>
        <motion.div
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                active 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
        >
            <Icon size={20} className={active ? 'text-cyan-400' : 'group-hover:text-slate-100'} />
            <span className="font-medium">{label}</span>
            {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
        </motion.div>
    </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
        { icon: Database, label: 'Key Pool', href: '/dashboard/config/key-pool' },
        { icon: History, label: 'AI Logs', href: '/dashboard/logs' },
        { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-[#0a0a0c] text-slate-200 overflow-hidden">
            {/* Sidebar */}
            <motion.aside 
                initial={false}
                animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
                className="relative h-screen bg-[#0f0f12] border-r border-slate-800/50 flex flex-col z-50 overflow-hidden"
            >
                <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-900/20">
                        <Zap size={22} className="text-white fill-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        WorldOS V6
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-4 mb-4">Main Menu</div>
                    {menuItems.map((item) => (
                        <SidebarItem 
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">System Status</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-semibold">Intelligence Active</span>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)]">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-slate-800/50 px-8 py-4 flex items-center justify-between">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold">Admin Portal</span>
                            <span className="text-[10px] text-cyan-400 font-mono tracking-tighter uppercase">Root Access</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                           <img src="https://api.dicebear.com/7.x/bottts/svg?seed=WorldOS" alt="avatar" />
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
