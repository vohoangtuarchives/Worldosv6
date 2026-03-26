import Link from "next/link";
import type { UniverseSummary } from "@/modules/observer/types";

const statusTone: Record<UniverseSummary["status"], string> = {
  active: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
  paused: "text-amber-200 bg-amber-500/10 border-amber-400/20",
  forked: "text-sky-200 bg-sky-500/10 border-sky-400/20",
};

export function UniverseCard({ universe }: { universe: UniverseSummary }) {
  return (
    <Link
      href={`/universes/${universe.id}`}
      className="group rounded-[28px] border border-white/10 bg-card/50 p-6 backdrop-blur-xl transition duration-300 hover:border-primary/40 hover:bg-card/70"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">Universe</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{universe.name}</h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] ${statusTone[universe.status]}`}>
          {universe.status}
        </span>
      </div>

      <p className="max-w-md text-sm leading-6 text-muted-foreground">{universe.focus}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <Metric label="Tick" value={`#${universe.currentTick.toLocaleString()}`} />
        <Metric label="Era" value={universe.era} />
        <Metric label="Stability" value={`${universe.stability.toFixed(1)}%`} />
        <Metric label="Entropy" value={universe.entropy.toFixed(3)} />
        <Metric label="Branches" value={String(universe.branchCount)} />
        <Metric label="Anomalies" value={String(universe.anomalyCount)} />
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-background/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}
