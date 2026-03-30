'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useObserverUniverseActors, useObserverActorDetail } from '@/modules/observer/api';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import ActorDeepDiveSidebar from '@/modules/observer/components/ActorDeepDiveSidebar';
import type { ActorSummary } from '@/modules/observer/types';
import { HUDCard, HUDBadge } from '@/modules/observer/components/ui/hud-primitives';
import { 
  Users, 
  Zap, 
  Activity, 
  ChevronRight, 
  Shield, 
  Target,
  Database,
  Search,
  Atom
} from 'lucide-react';



export function UniverseActorsClient({
  universeId,
  initialActors,
}: {
  universeId: string;
  initialActors: ActorSummary[];
}) {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const actorsQuery = useObserverUniverseActors(universeId, initialActors);
  const actors = actorsQuery.data ?? initialActors;

  // Fetch detail for selected actor
  const { data: selectedActorDetail } = useObserverActorDetail(
    selectedActorId ?? '',
    undefined
  );

  const handleActorClick = (summary: ActorSummary) => {
    setSelectedActorId(summary.id);
  };

  const totalInfluence = actors.reduce((sum, actor) => sum + actor.influence, 0);
  const averageInfluence = actors.length > 0 ? totalInfluence / actors.length : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 font-mono">
      {/* HUD Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <HUDCard title="Cư dân Đang hoạt động" icon={Users}>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900">{actors.length}</p>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Thực thể đã Đăng ký</span>
          </div>
        </HUDCard>
        <HUDCard title="Ảnh hưởng Trung bình" icon={Activity}>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-indigo-600">{averageInfluence.toFixed(1)}</p>
            <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest leading-none">Hệ số Tác động</span>
          </div>
        </HUDCard>
        <HUDCard title="Nhịp Xung Nhân quả" icon={Zap} color="orange">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-orange-600 uppercase truncate">
               {actors[0]?.lastDecision ?? 'Không có dấu vết gần đây.'}
            </p>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-orange-500 w-[65%] animate-pulse" />
            </div>
          </div>
        </HUDCard>
      </div>

      {/* Main Actors List HUD */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-50 border border-sky-100 shadow-sm">
                <Target className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.3em]">Danh mục Thực thể</h2>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
              <input 
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none w-64 transition-all shadow-inner"
                placeholder="ĐANG QUÉT CÁC THỰC THỂ..."
              />
           </div>
        </div>

        {actorsQuery.isLoading && actors.length === 0 ? <ObserverLoadingState lines={4} /> : null}
        
        {actorsQuery.isError && actors.length === 0 ? (
          <ObserverErrorState
            title="Không thể truy cập danh mục thực thể"
            description="Lớp thông tin không trả về dữ liệu thực thể cho nhánh này."
            onRetry={() => {
              void actorsQuery.refetch();
            }}
          />
        ) : null}

        {actors.length === 0 && !actorsQuery.isLoading ? (
          <div className="p-20 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Atom className="w-12 h-12 text-slate-200 mx-auto mb-4 animate-spin-slow" />
            <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold">Không Phát hiện Chữ ký Sự sống nào</p>
            <div className="mt-8 flex justify-center gap-4">
               <Link href={`/universes/${universeId}/control`} className="px-4 py-2 border border-sky-200 bg-white text-sky-600 hover:bg-sky-50 text-[10px] font-bold uppercase transition-all rounded-lg shadow-sm">
                  Kích xung Cưỡng bức
               </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 lg:grid-cols-2">
            {actors.map((actor) => (
              <button
                key={actor.id}
                onClick={() => handleActorClick(actor)}
                className="group relative block w-full text-left rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-sky-300 hover:shadow-md overflow-hidden"
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:border-sky-200 transition-all shadow-sm">
                       <Users className="w-6 h-6 text-slate-300 group-hover:text-sky-600 group-hover:animate-pulse transition-all" />
                    </div>
                    <div>
                      <h3 className="text-md font-black text-slate-900 group-hover:text-sky-600 transition-colors uppercase tracking-tight">{actor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <HUDBadge color="primary" className="text-[8px] py-0 border-sky-100">{actor.role}</HUDBadge>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{actor.alignment}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mb-1">Mức độ Ảnh hưởng</div>
                    <div className="text-lg font-black text-slate-900 font-mono italic">{actor.influence.toFixed(1)}</div>
                  </div>
                </div>
                
                <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] leading-relaxed text-slate-600 italic group-hover:text-slate-700 transition-colors">
                  <span className="text-sky-600 font-bold mr-2">NHẬT KÝ:</span>
                  &quot;{actor.lastDecision}&quot;
                </div>
                
                <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase">
                   <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 group-hover:text-sky-600 transition-colors"><Database size={12} /> ID: {actor.id.slice(0, 8)}</span>
                      <span className="flex items-center gap-1"><Shield size={12} /> XÁC THỰC: THÀNH CÔNG</span>
                   </div>
                   <div className="flex items-center gap-1 text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity font-black">
                      CHI TIẾT <ChevronRight size={12} />
                   </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Actor Deep Dive Sidebar */}
      <ActorDeepDiveSidebar 
        actor={selectedActorDetail ?? null} 
        onClose={() => setSelectedActorId(null)} 
      />
    </div>
  );
}
