'use client';

import React from 'react';
import { useObserverAutonomyAudit } from '../api';
import { ObserverPanel } from './ObserverPanel';
import { ObserverLoadingState } from './ObserverLoadingState';
import { ObserverErrorState } from './ObserverErrorState';
import { ObserverEmptyState } from './ObserverEmptyState';
import { Cpu, Code, History, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface MutationStreamProps {
  universeId: string;
}

/**
 * MutationStream: Displays the historical log of autopoietic code mutations.
 * Refactored for Scientific Light HUD.
 */
export function MutationStream({ universeId }: MutationStreamProps) {
  const { data, isLoading, isError, refetch } = useObserverAutonomyAudit(universeId);

  if (isLoading) return <ObserverLoadingState lines={4} />;
  
  if (isError) {
    return (
      <ObserverErrorState 
        title="Giao diện Đột biến Ngoại tuyến" 
        description="Không thể đồng bộ hóa với lớp kiểm toán tự thân của hạt nhân thực tại."
        onRetry={() => void refetch()} 
      />
    );
  }

  const mutations = data?.chronicle || [];

  return (
    <ObserverPanel 
      eyebrow="KIỂM TOÁN NHÂN QUẢ" 
      title="Bản kê khai Tự trị"
      badge={mutations.length > 0 ? `${mutations.length} ĐỘT BIẾN` : undefined}
    >
      <div className="space-y-6">
        {mutations.length === 0 ? (
          <ObserverEmptyState 
            title="Thực tại Bất biến" 
            description="Không phát hiện đột biến tự thân nào. Mô phỏng đang vận hành trong các tham số siêu hình tiêu chuẩn."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {mutations.slice(0, 5).map((m, index) => (
              <motion.div 
                key={m.dslHash} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-[24px] border border-slate-100 bg-slate-50/30 p-5 transition-all hover:border-primary/20 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 text-primary shadow-sm group-hover:scale-110 transition-transform">
                      {m.source === 'autopoietic_evolution' ? <Cpu size={18} /> : <Code size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                        {m.dslPath ? m.dslPath.split('/').pop() : 'Quy luật Vô danh'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-heading font-black text-slate-400 uppercase tracking-widest">
                        <History size={10} className="text-slate-300" />
                        TICK {m.latestTick?.toLocaleString() ?? 'KHỞI NGUYÊN'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-lg px-2 py-1 text-[9px] font-heading font-black bg-white border border-slate-100 text-slate-400 uppercase tracking-widest shadow-sm">
                       {m.versionCount} PHIÊN BẢN
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-white/50 border border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/10" />
                    <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
                      &quot;{m.vector || 'Ghi nhận thay đổi cấu trúc nhân kết của các quy luật thực tại...'}&quot;
                    </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-heading font-black text-emerald-600">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span>{m.source === 'autopoietic_evolution' ? 'TỔI ƯU HÓA TỰ THÂN' : 'NẠP MÃ LỆNH'}</span>
                  </div>
                  
                  <Link 
                    href={`/universes/${universeId}/control?mutation=${m.dslHash}`}
                    className="flex items-center gap-2 text-[9px] font-heading font-black text-primary hover:gap-3 transition-all uppercase tracking-widest"
                  >
                    CHI TIẾT <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
            
            {mutations.length > 5 && (
              <button className="group w-full rounded-2xl border-2 border-dashed border-slate-100 py-4 text-[10px] font-heading font-black text-slate-300 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-400 hover:border-slate-200 transition-all flex items-center justify-center gap-3">
                <Activity size={14} className="group-hover:animate-spin-slow" />
                Truy xuất toàn bộ lịch sử đột biến (+{mutations.length - 5})
              </button>
            )}
          </div>
        )}
      </div>
    </ObserverPanel>
  );
}
