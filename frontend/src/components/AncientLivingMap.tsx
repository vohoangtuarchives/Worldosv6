'use client';

import { useMemo } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

const AncientLivingMap = () => {
  const chronicles = useSimulationStore((state) => state.chronicles);
  const entities = useSimulationStore((state) => state.entities);

  const highlights = useMemo(
    () =>
      chronicles.slice(0, 3).map((entry, index) => ({
        id: entry.id ?? `chronicle-${index}`,
        title: entry.title ?? `Chronicle ${index + 1}`,
        summary: entry.content ?? 'Narrative signal available for geographic correlation.',
      })),
    [chronicles],
  );

  const populations = useMemo(
    () =>
      entities.slice(0, 4).map((entity, index) => ({
        id: entity.id,
        name: entity.name ?? `Entity ${index + 1}`,
        role: entity.vocation ?? 'Observer',
      })),
    [entities],
  );

  return (
    <section className="h-full rounded-[28px] border border-white/10 bg-card/45 p-6 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">World Layer</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Geographic observation surface</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/8 bg-background/35 p-5">
          <div className="grid h-[320px] grid-cols-3 gap-3">
            {['North Basin', 'Archive Coast', 'River Spine', 'Glass Plain', 'Hill Ring', 'Southern Step'].map((region) => (
              <div key={region} className="flex items-end rounded-2xl border border-white/8 bg-gradient-to-br from-primary/10 to-transparent p-4 text-sm font-medium">
                {region}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Active populations</p>
            <div className="mt-3 space-y-3">
              {populations.length > 0 ? (
                populations.map((population) => (
                  <div key={population.id} className="rounded-xl border border-white/8 bg-card/40 px-3 py-2">
                    <p className="text-sm font-medium">{population.name}</p>
                    <p className="text-xs text-muted-foreground">{population.role}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No population telemetry has been synchronized yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Regional highlights</p>
            <div className="mt-3 space-y-3">
              {highlights.length > 0 ? (
                highlights.map((highlight) => (
                  <div key={highlight.id} className="rounded-xl border border-white/8 bg-card/40 px-3 py-3">
                    <p className="text-sm font-medium">{highlight.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{highlight.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chronicle-linked geography will appear here when narrative data arrives.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AncientLivingMap;
