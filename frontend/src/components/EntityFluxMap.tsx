'use client';

import { useSimulationStore } from '@/store/useSimulationStore';

const EntityFluxMap = () => {
  const entities = useSimulationStore((state) => state.entities);

  return (
    <section className="h-full rounded-[28px] border border-white/10 bg-card/45 p-6 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Entity Flux</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Tracked social actors</h2>
      <div className="mt-6 space-y-3">
        {entities.length > 0 ? (
          entities.slice(0, 6).map((entity, index) => (
            <div key={entity.id} className="rounded-2xl border border-white/8 bg-background/35 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{entity.name ?? `Entity ${index + 1}`}</p>
                <span className="text-xs text-primary/80">{entity.vocation ?? 'Unknown role'}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{entity.intent ?? 'No active intention reported.'}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-background/25 p-6 text-sm text-muted-foreground">
            Entity telemetry will appear here after synchronization.
          </div>
        )}
      </div>
    </section>
  );
};

export default EntityFluxMap;
