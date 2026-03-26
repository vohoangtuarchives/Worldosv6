'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useObserverUniverseChronicles } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { ChronicleEntry } from '@/modules/observer/types';

export function UniverseChroniclesClient({
  universeId,
  initialChronicles,
}: {
  universeId: string;
  initialChronicles: ChronicleEntry[];
}) {
  const searchParams = useSearchParams();
  const focusedTick = Number(searchParams.get('tick') ?? '');
  const chroniclesQuery = useObserverUniverseChronicles(universeId, initialChronicles);
  const chronicles = chroniclesQuery.data ?? initialChronicles;
  const visibleChronicles = Number.isFinite(focusedTick)
    ? chronicles.filter((entry) => entry.fromTick <= focusedTick && entry.toTick >= focusedTick)
    : chronicles;
  const highImportanceCount = chronicles.filter((entry) => entry.importance >= 0.7).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Chronicles</p>
          <p className="mt-2 text-2xl font-semibold">{chronicles.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">High Importance</p>
          <p className="mt-2 text-2xl font-semibold">{highImportanceCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Latest Tick</p>
          <p className="mt-2 text-2xl font-semibold">{chronicles[0]?.tick?.toLocaleString() ?? 'N/A'}</p>
        </div>
      </div>

      <ObserverPanel eyebrow="Chronicles" title="Narrative archive for the active branch">
        {chroniclesQuery.isLoading && chronicles.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {chroniclesQuery.isError && chronicles.length === 0 ? (
          <ObserverErrorState
            title="Chronicle archive is unavailable"
            description="The narrative layer did not return chronicle data for this branch."
            onRetry={() => {
              void chroniclesQuery.refetch();
            }}
          />
        ) : null}
        {!chroniclesQuery.isLoading && visibleChronicles.length === 0 ? (
          <ObserverEmptyState
            title={Number.isFinite(focusedTick) ? 'No chronicle matches this timeline tick' : 'No chronicle archive yet'}
            description={
              Number.isFinite(focusedTick)
                ? 'This tick does not currently map to a chronicle window. Try another timeline event or clear the filter.'
                : 'The simulation has not emitted narrative synthesis for this branch yet. Once chronicles are generated, this archive becomes the story-facing layer of the universe.'
            }
            action={
              <>
                <Link href={`/universes/${universeId}/timeline`} className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20">
                  Open timeline
                </Link>
                {Number.isFinite(focusedTick) ? (
                  <Link href={`/universes/${universeId}/chronicles`} className="rounded-2xl border border-white/10 bg-background/40 px-4 py-3 text-sm transition hover:bg-white/5">
                    Clear tick filter
                  </Link>
                ) : null}
              </>
            }
          />
        ) : null}
        {visibleChronicles.length > 0 ? (
          <div className="space-y-4">
            {visibleChronicles.map((entry) => {
              const highlighted = Number.isFinite(focusedTick) && entry.fromTick <= focusedTick && entry.toTick >= focusedTick;
              return (
                <article
                  key={entry.id}
                  className={`relative rounded-3xl border bg-background/25 p-6 transition-all hover:bg-background/45 ${highlighted ? 'border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'border-white/5'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight text-white font-serif">{entry.title}</h3>
                      <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                         <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
                            Epoch Window {entry.fromTick.toLocaleString()} — {entry.toTick.toLocaleString()}
                         </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/universes/${universeId}/timeline?tick=${entry.tick}`} className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors">
                        Inspect Causal Node
                      </Link>
                      <span className="px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Weight {(entry.importance * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                     <p className="text-sm leading-7 text-muted-foreground/90 first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-none first-letter:mt-1">
                        {entry.summary}
                     </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </ObserverPanel>
    </div>
  );
}
