'use client';

import React from 'react';
import { useObserverAutonomyAudit } from '../api';
import { ObserverPanel } from './ObserverPanel';
import { ObserverLoadingState } from './ObserverLoadingState';
import { ObserverErrorState } from './ObserverErrorState';
import { ObserverEmptyState } from './ObserverEmptyState';
import { Cpu, Code, History, Terminal } from 'lucide-react';
import Link from 'next/link';

interface MutationStreamProps {
  universeId: string;
}

/**
 * MutationStream: Displays the historical log of autopoietic code mutations.
 */
export function MutationStream({ universeId }: MutationStreamProps) {
  const { data, isLoading, isError, refetch } = useObserverAutonomyAudit(universeId);

  if (isLoading) return <ObserverLoadingState lines={4} />;
  
  if (isError) {
    return (
      <ObserverErrorState 
        title="Mutation interface offline" 
        description="Could not synchronize with the autopoietic audit layer."
        onRetry={() => void refetch()} 
      />
    );
  }

  const mutations = data?.chronicle || [];

  return (
    <ObserverPanel 
      eyebrow="Causal Audit" 
      title="Autonomy Manifest"
      badge={mutations.length > 0 ? `${mutations.length} MUTATIONS` : undefined}
    >
      <div className="space-y-4">
        {mutations.length === 0 ? (
          <ObserverEmptyState 
            title="Stable Reality" 
            description="No autopoietic mutations detected. The simulation is operating within standard metaphysical parameters."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {mutations.slice(0, 5).map((m: any) => (
              <div 
                key={m.dsl_hash} 
                className="group relative rounded-2xl border border-white/5 bg-background/20 p-4 transition hover:border-primary/30 hover:bg-background/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {m.source === 'autopoietic_evolution' ? <Cpu size={16} /> : <Code size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold tracking-tight text-white/90">
                        {m.dsl_path ? m.dsl_path.split('/').pop() : 'Anonymous Law'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        <History size={10} />
                        TICK {m.latest_tick ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono bg-white/5 text-muted-foreground uppercase tracking-widest">
                       {m.version_count} VERSIONS
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2 italic">
                  &quot;{m.vector || 'Stabilizing reality through rule mutation...'}&quot;
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] font-medium text-emerald-400/80">
                     <Terminal size={12} />
                     <span>OPTIMIZED VIA {m.source.toUpperCase()}</span>
                  </div>
                  
                  <Link 
                    href={`/universes/${universeId}/control?mutation=${m.dsl_hash}`}
                    className="text-[10px] font-bold text-primary underline-offset-4 hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100 transition"
                  >
                    View Diff
                  </Link>
                </div>
              </div>
            ))}
            
            {mutations.length > 5 && (
              <button className="w-full rounded-xl border border-dashed border-white/10 py-3 text-xs font-medium text-muted-foreground hover:bg-white/5 transition">
                Load full mutation chronicle (+{mutations.length - 5})
              </button>
            )}
          </div>
        )}
      </div>
    </ObserverPanel>
  );
}
