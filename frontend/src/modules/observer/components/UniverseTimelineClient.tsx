'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  useObserverAutonomyAudit, 
  useObserverUniverseChronicles, 
  useObserverUniverseForks, 
  useObserverUniverseSnapshots, 
  useObserverUniverseTimeline 
} from '@/modules/observer/api';
import type { AutonomyAudit } from '@/modules/observer/contracts';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { BranchSummary, ChronicleEntry, SnapshotSummary, TimelineEvent } from '@/modules/observer/types';
import { HUDCard, HUDBadge } from '@/modules/observer/components/ui/hud-primitives';
import { 
  History, 
  Zap, 
  GitBranch, 
  Layers, 
  Clock, 
  Activity, 
  ChevronRight,
  Database,
  ShieldAlert,
  ArrowRightCircle,
  Shield
} from 'lucide-react';



function laneClass(highlighted: boolean) {
  return highlighted ? 'border-sky-300 bg-sky-50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'border-slate-200 bg-white shadow-sm';
}

export function UniverseTimelineClient({
  universeId,
  initialTimeline,
  initialChronicles,
  initialSnapshots,
  initialForks,
  initialAutonomyAudit,
}: {
  universeId: string;
  initialTimeline: TimelineEvent[];
  initialChronicles: ChronicleEntry[];
  initialSnapshots: SnapshotSummary[];
  initialForks: BranchSummary[];
  initialAutonomyAudit?: AutonomyAudit;
}) {
  const searchParams = useSearchParams();
  const focusedTick = Number(searchParams.get('tick') ?? '');
  const timelineQuery = useObserverUniverseTimeline(universeId, initialTimeline);
  const chroniclesQuery = useObserverUniverseChronicles(universeId, initialChronicles);
  const snapshotsQuery = useObserverUniverseSnapshots(universeId, initialSnapshots);
  const forksQuery = useObserverUniverseForks(universeId, initialForks);
  const auditQuery = useObserverAutonomyAudit(universeId, initialAutonomyAudit);

  const timeline = timelineQuery.data ?? initialTimeline;
  const chronicles = chroniclesQuery.data ?? initialChronicles;
  const snapshots = snapshotsQuery.data ?? initialSnapshots;
  const forks = forksQuery.data ?? initialForks;
  const mutations = auditQuery.data?.chronicle ?? [];

  const interventions = [
    ...snapshots.map((snapshot) => ({ id: `snapshot-${snapshot.id}`, kind: 'Snapshot', tick: snapshot.tick, label: snapshot.label, summary: snapshot.note })),
    ...forks.map((fork) => ({ id: `fork-${fork.id}`, kind: 'Fork', tick: fork.divergenceTick, label: fork.label, summary: `Branch ${fork.status} now tracks tick ${fork.currentTick}.` })),
  ].sort((left, right) => right.tick - left.tick);

  const mutationLane = mutations
    .map((entry) => ({
      id: entry.dslHash,
      tick: entry.latestTick ?? -1,
      label: entry.dslPath ?? entry.dslHash,
      summary: entry.vector ?? entry.source,
      timestamp: entry.latestTimestamp,
      versionCount: entry.versionCount,
    }))
    .sort((left, right) => right.tick - left.tick);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 font-mono">
      {/* Main Timeline Control HUD */}
      <section className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="absolute -inset-2 bg-primary/5 blur-3xl pointer-events-none" />
        
        {/* Lane 1: Causal Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Luồng Nhân Quả</h2>
            </div>
            <HUDBadge color="primary">Hoạt động</HUDBadge>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {timelineQuery.isLoading && timeline.length === 0 ? <ObserverLoadingState lines={4} /> : null}
            {timelineQuery.isError && timeline.length === 0 ? (
              <ObserverErrorState title="Lỗi Đồng bộ" description="Liên kết lượng tử bị gián đoạn." onRetry={() => void timelineQuery.refetch()} />
            ) : null}
            {timeline.length === 0 && !timelineQuery.isLoading && (
              <div className="p-8 text-center text-[10px] text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-lg">Đang chờ luồng nhân quả...</div>
            )}
            {timeline.map((entry) => {
              const highlighted = Number.isFinite(focusedTick) && entry.tick === focusedTick;
              return (
                <article key={entry.id} className={`relative rounded-lg border p-4 transition-all duration-300 ${laneClass(highlighted)} group hover:border-sky-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-sky-600 font-bold tracking-tighter">TIC-{entry.tick.toString().padStart(6, '0')}</span>
                    <HUDBadge color="primary" className="text-[8px] border-sky-200">{entry.category}</HUDBadge>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-3 italic">"{entry.summary}"</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{entry.zone}</span>
                    <Link href={`/universes/${universeId}/chronicles?tick=${entry.tick}`} className="flex items-center gap-1 text-[9px] text-sky-600 font-bold hover:text-sky-700 transition-colors">
                      <History className="w-3 h-3" /> PHÂN TÍCH
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Lane 2: Intervention Layer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Sự Can Thiệp</h2>
            </div>
            <HUDBadge color="secondary">An toàn</HUDBadge>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {interventions.map((entry) => {
              const highlighted = Number.isFinite(focusedTick) && entry.tick === focusedTick;
              return (
                <article key={entry.id} className={`rounded-lg border p-4 transition-all ${laneClass(highlighted)} border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-indigo-600/60 font-bold">TIC-{entry.tick.toString().padStart(6, '0')}</span>
                    <span className="text-[9px] font-black text-indigo-600 px-1 bg-indigo-100 rounded">{entry.kind}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-2 uppercase">{entry.label}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{entry.summary}</p>
                  <Link href={`/universes/${universeId}/control`} className="inline-flex items-center gap-2 text-[9px] text-indigo-600 font-bold hover:underline">
                    <Database size={12} /> TRUY XUẤT TRẠNG THÁI
                  </Link>
                </article>
              );
            })}
            {interventions.length === 0 && <div className="p-8 text-center text-[10px] text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-lg">Đang chờ sự can thiệp...</div>}
          </div>
        </div>

        {/* Lane 3: Mutation Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Nhật Ký Đột Biến</h2>
            </div>
            <HUDBadge color="orange">Không ổn định</HUDBadge>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {mutationLane.map((entry) => {
              const highlighted = Number.isFinite(focusedTick) && entry.tick === focusedTick;
              return (
                <article key={entry.id} className={`rounded-lg border p-4 transition-all ${laneClass(highlighted)} border-orange-200 bg-orange-50/50 hover:bg-orange-50`}>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] text-orange-600/60 font-bold italic">
                       {entry.tick < 0 ? 'ĐANG ĐỒNG BỘ' : `TIC-${entry.tick.toString().padStart(6, '0')}`}
                     </span>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] text-orange-600 font-bold bg-orange-100 px-1 rounded">v{entry.versionCount}</span>
                        <ShieldAlert className="w-3 h-3 text-orange-600 animate-pulse" />
                     </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1 truncate">{entry.label}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mb-4 break-all opacity-70">{entry.id}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'Không rõ thời gian'}</span>
                    <Link href={`/universes/${universeId}/control`} className="text-[9px] text-orange-600 hover:text-orange-700 font-bold">
                      KIỂM TRA ĐỘT BIẾN
                    </Link>
                  </div>
                </article>
              );
            })}
            {mutationLane.length === 0 && <div className="p-8 text-center text-[10px] text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-lg">Đang chờ quá trình tự tạo...</div>}
          </div>
        </div>
      </section>

      {/* Narrative Synthesis HUD */}
      <section className="mt-12 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
           <Layers className="w-6 h-6 text-sky-600" />
           <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.3em]">Tổng Hợp Tự Sự</h2>
        </div>
        
        {chronicles.length === 0 && !chroniclesQuery.isLoading ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Đang khởi tạo các mảnh biên niên sử...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chronicles.slice(0, 9).map((entry) => (
              <HUDCard key={entry.id} title={entry.title} color="primary" className="hover:scale-[1.02] transition-transform">
                <p className="text-xs leading-relaxed text-slate-600 mb-6 italic">"{entry.summary}"</p>
                <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-3">
                  <HUDBadge color="primary" className="text-[8px] border-sky-100">Mã tham chiếu: {entry.id.slice(0, 8)}</HUDBadge>
                  <Link href={`/universes/${universeId}/timeline?tick=${entry.tick}`} className="text-[9px] font-bold text-sky-600 hover:underline flex items-center gap-1">
                    ĐẾN TICK <ArrowRightCircle size={10} />
                  </Link>
                </div>
              </HUDCard>
            ))}
          </div>
        )}
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.4);
        }
      `}</style>
    </div>
  );
}
