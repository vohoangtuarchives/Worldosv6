'use client';

import { useSimulationStore } from '@/store/useSimulationStore';

const AxiomFluxMonitor = () => {
  const currentTick = useSimulationStore((state) => state.currentTick);
  const axioms = useSimulationStore((state) => state.axioms);

  const entries = Object.entries(axioms);

  return (
    <section className="h-full rounded-[28px] border border-white/10 bg-card/45 p-6 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Axiom Flux</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Current parameter envelope</h2>
      <p className="mt-2 text-sm text-muted-foreground">Latest observed tick: {currentTick.toLocaleString()}</p>
      <div className="mt-6 space-y-3">
        {entries.length > 0 ? (
          entries.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/8 bg-background/35 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium capitalize">{key}</p>
                <p className="text-sm font-mono text-primary">{value.toFixed(2)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-background/25 p-6 text-sm text-muted-foreground">
            No axiom telemetry has been loaded yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default AxiomFluxMonitor;
