'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';

interface AppHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function AppHeader({ sidebarOpen, onToggleSidebar }: AppHeaderProps) {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-[var(--z-header)] flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-6 py-4 backdrop-blur-xl"
    >
      {/* Sidebar toggle */}
      <button
        id="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-slate-400 transition hover:bg-slate-800/50 hover:text-white"
      >
        {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
      </button>

      {/* Right side: user info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-200">Admin Portal</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-400">
            Root Access
          </p>
        </div>
        <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
          <Image
            src="https://api.dicebear.com/7.x/bottts/svg?seed=WorldOS"
            alt="Admin avatar"
            width={36}
            height={36}
            unoptimized
          />
        </div>
      </div>
    </header>
  );
}
