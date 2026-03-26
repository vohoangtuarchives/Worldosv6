'use client';

import type { ChronicleRecord } from '@/store/useSimulationStore';

interface CausalGraphProps {
  chronicles: ChronicleRecord[];
}

const CausalGraph = ({ chronicles }: CausalGraphProps) => {
  const nodes = chronicles.slice(0, 5);

  return (
    <section className="h-full rounded-[28px] border border-white/10 bg-card/45 p-6 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Causal Graph</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Narrative influence chain</h2>
      <div className="mt-6 space-y-3">
        {nodes.length > 0 ? (
          nodes.map((node, index) => (
            <div key={node.id ?? index} className="rounded-2xl border border-white/8 bg-background/35 p-4">
              <p className="text-sm font-medium">{node.title ?? `Event ${index + 1}`}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{node.content ?? 'Causal summary pending.'}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-background/25 p-6 text-sm text-muted-foreground">
            No chronicle nodes available for graph projection.
          </div>
        )}
      </div>
    </section>
  );
};

export default CausalGraph;
