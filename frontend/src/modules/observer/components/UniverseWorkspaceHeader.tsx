import Link from 'next/link';
import type { UniverseDetail } from '@/modules/observer/types';

function getStatusTone(status: UniverseDetail['status']) {
  if (status === 'active') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }

  if (status === 'forked') {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
  }

  return 'border-white/10 bg-white/5 text-muted-foreground';
}

export function UniverseWorkspaceHeader({ universe }: { universe: UniverseDetail }) {
  return (
    <header className="rounded-[32px] border border-white/10 bg-card/55 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] uppercase tracking-[0.34em] text-primary/70">Universe Workspace</p>
            <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${getStatusTone(universe.status)}`}>{universe.status}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{universe.name}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{universe.focus}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href={`/universes/${universe.id}/control`} className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-primary transition hover:bg-primary/20">
            Open Control Surface
          </Link>
          <Link href={`/universes/${universe.id}/timeline`} className="rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-center text-sm transition hover:bg-white/5">
            Review Timeline
          </Link>
          <Link href={`/universes/${universe.id}/forks`} className="rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-center text-sm transition hover:bg-white/5">
            Review Branches
          </Link>
        </div>
      </div>
    </header>
  );
}
