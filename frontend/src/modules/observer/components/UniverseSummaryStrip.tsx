import type { UniverseDetail } from '@/modules/observer/types';

export function UniverseSummaryStrip({ universe }: { universe: UniverseDetail }) {
  const items = [
    { label: 'Current Tick', value: `#${universe.currentTick.toLocaleString()}` },
    { label: 'Era', value: universe.era },
    { label: 'Stability', value: `${universe.stability.toFixed(1)}%` },
    { label: 'Entropy', value: universe.entropy.toFixed(3) },
    { label: 'Branches', value: String(universe.branchCount) },
    { label: 'Anomalies', value: String(universe.anomalyCount) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-background/35 p-4 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-base font-semibold sm:text-lg">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
