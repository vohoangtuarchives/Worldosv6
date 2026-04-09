'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UniverseProvider } from '@/contexts/UniverseContext';
import Sidebar from '@/components/shell/Sidebar';
import AppHeader from '@/components/shell/AppHeader';

function ShellContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)] text-slate-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_50%_-10%,rgba(30,27,75,0.4),transparent_60%)]"
        >
          <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * DashboardShell — root layout wrapper for all dashboard routes.
 * Wraps content with UniverseProvider and renders the Sidebar + AppHeader.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UniverseProvider>
      <ShellContent>{children}</ShellContent>
    </UniverseProvider>
  );
}
