'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { observerSections } from '@/modules/observer/types';

export function ObserverSidebar({ universeId }: { universeId: string }) {
  const pathname = usePathname();

  return (
    <aside className="space-y-3 xl:sticky xl:top-6 xl:self-start">
      <div className="rounded-[28px] border border-white/10 bg-card/45 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-1 pb-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">Observer Lenses</p>
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline-flex xl:hidden">
            Swipe
          </span>
        </div>

        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:block xl:space-y-1 xl:overflow-visible xl:px-0">
          {observerSections.map((section) => {
            const href = `/universes/${universeId}${section.href}`;
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-2xl px-3 py-3 text-sm transition xl:block ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
