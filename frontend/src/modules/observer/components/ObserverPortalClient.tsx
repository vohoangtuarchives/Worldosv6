'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Orbit, ScanSearch, ShieldCheck } from 'lucide-react';
import { useObserverUniverseSummaries } from '@/modules/observer/api';
import { UniverseCard } from '@/modules/observer/components/UniverseCard';
import type { UniverseSummary } from '@/modules/observer/types';

export function ObserverPortalClient({ initialUniverses }: { initialUniverses: UniverseSummary[] }) {
  const { data: universes = initialUniverses } = useObserverUniverseSummaries(initialUniverses);

  if (!universes) return null;

  const activeUniverses = universes.filter((universe) => universe.status === 'active').length;
  const totalAnomalies = universes.reduce((sum, universe) => sum + universe.anomalyCount, 0);
  const primaryUniverse = universes[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 pb-8 pt-8">
      <div className="mx-auto max-w-[1540px] space-y-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-card/50 p-8 backdrop-blur-xl md:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-primary/70">Observer Portal</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
                The portal is now the entry point into structured observer workspaces. Each universe gets its own domain navigation,
                rather than forcing the user through a single monolithic dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={primaryUniverse ? `/universes/${primaryUniverse.id}` : '/universes'}
                  className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm text-primary transition hover:bg-primary/20"
                >
                  Enter Primary Workspace
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/system/ai-config"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-background/40 px-5 py-3 text-sm transition hover:bg-white/5"
                >
                  Open System Config
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <PortalMetric label="Tracked universes" value={String(universes.length)} icon={<Orbit size={18} />} />
              <PortalMetric label="Active workspaces" value={String(activeUniverses)} icon={<ShieldCheck size={18} />} />
              <PortalMetric label="Open anomalies" value={String(totalAnomalies)} icon={<ScanSearch size={18} />} />
            </div>
          </div>
        </header>

        <section className="space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">Universes</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Observer workspaces</h2>
          </div>

          {universes.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {universes.map((universe) => (
                <UniverseCard key={universe.id} universe={universe} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-background/30 p-8 text-sm text-muted-foreground">
              No universe data is available from the backend yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PortalMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-background/35 p-5">
      <div className="flex items-center justify-between text-primary/80">
        <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </div>
  );
}
