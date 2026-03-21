"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Scroll, History, Milestone, Skull, Network, ArrowLeft } from "lucide-react";

export default function WikiLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const menuItems = [
        { name: "The Grand Timeline", path: "/wiki", icon: <History size={18} /> },
        { name: "Legends & Lineage", path: "/wiki/heroes", icon: <Network size={18} /> },
        { name: "The Archives", path: "/wiki/archives", icon: <Scroll size={18} /> },
    ];

    return (
        <div className="flex h-screen bg-[#0f1115] text-[#d4cbb3] font-serif overflow-hidden selection:bg-amber-900/50">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-[#2a2824] bg-[#141518] flex flex-col shrink-0 flex-none relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
                <div className="p-6 border-b border-[#2a2824] flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-widest uppercase text-amber-500/90" style={{ fontFamily: 'Cinzel, serif' }}>
                            The Loom
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8573] mt-1 font-sans font-bold">
                            Of Lore
                        </p>
                    </div>
                    <BookOpen className="text-[#8a8573] opacity-50" size={24} />
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/wiki' && pathname.startsWith(item.path));
                        return (
                            <Link 
                                key={item.path} 
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                                    isActive 
                                    ? "bg-[#212226] text-amber-500 border-l-2 border-amber-500 shadow-inner" 
                                    : "text-[#8a8573] hover:bg-[#1a1b1f] hover:text-[#d4cbb3]"
                                } font-sans text-sm font-medium tracking-wide`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#2a2824]">
                    <Link href="/timeline" className="flex items-center gap-2 text-xs font-sans text-zinc-500 hover:text-white transition-colors">
                        <ArrowLeft size={14} />
                        Back to Observatory
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden bg-[url('/textures/noise.png')] bg-repeat opacity-95">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f1115] via-transparent to-[#0a0b0d] pointer-events-none" />
                <div className="relative w-full h-full p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
