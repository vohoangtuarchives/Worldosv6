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
        title="Giao diện Mutation ngoại tuyến" 
        description="Không thể đồng bộ hóa với lớp kiểm toán tự thân."
        onRetry={() => void refetch()} 
      />
    );
  }

  const mutations = data?.chronicle || [];

  return (
    <ObserverPanel 
      eyebrow="Kiểm toán Nhân quả" 
      title="Bản kê khai Tự trị"
      badge={mutations.length > 0 ? `${mutations.length} MUTATIONS` : undefined}
    >
      <div className="space-y-4">
        {mutations.length === 0 ? (
          <ObserverEmptyState 
            title="Thực tại Ổn định" 
            description="Không phát hiện mutation tự thân nào. Simulation đang hoạt động trong các tham số siêu hình tiêu chuẩn."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {mutations.slice(0, 5).map((m: any) => (
              <div 
                key={m.dsl_hash} 
                className="group relative rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      {m.source === 'autopoietic_evolution' ? <Cpu size={16} /> : <Code size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold tracking-tight text-slate-800">
                        {m.dsl_path ? m.dsl_path.split('/').pop() : 'Quy luật Vô danh'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        <History size={10} />
                        TICK {m.latest_tick ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 uppercase tracking-widest">
                       {m.version_count} PHIÊN BẢN
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-500 line-clamp-2 italic">
                  &quot;{m.vector || 'Ổn định thực tại thông qua quy luật mutation...'}&quot;
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] font-medium text-emerald-600">
                     <Terminal size={12} />
                     <span>TỐI ƯU HÓA QUA {m.source.toUpperCase()}</span>
                  </div>
                  
                  <Link 
                    href={`/universes/${universeId}/control?mutation=${m.dsl_hash}`}
                    className="text-[10px] font-bold text-sky-600 underline-offset-4 hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100 transition"
                  >
                    Xem khác biệt
                  </Link>
                </div>
              </div>
            ))}
            
            {mutations.length > 5 && (
              <button className="w-full rounded-xl border border-dashed border-slate-200 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 transition">
                Tải toàn bộ biên niên sử mutation (+{mutations.length - 5})
              </button>
            )}
          </div>
        )}
      </div>
    </ObserverPanel>
  );
}
