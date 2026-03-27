'use client';

import Link from 'next/link';
import { useObserverUniverseSnapshots } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { SnapshotSummary } from '@/modules/observer/types';

export function UniverseSnapshotsClient({
  universeId,
  initialSnapshots,
}: {
  universeId: string;
  initialSnapshots: SnapshotSummary[];
}) {
  const snapshotsQuery = useObserverUniverseSnapshots(universeId, initialSnapshots);
  const snapshots = snapshotsQuery.data ?? initialSnapshots;

  return (
    <ObserverPanel eyebrow="Ảnh chụp Trạng thái" title="Các điểm kiểm tra lưu trữ trạng thái">
      {snapshotsQuery.isLoading && snapshots.length === 0 ? <ObserverLoadingState lines={3} /> : null}
      {snapshotsQuery.isError && snapshots.length === 0 ? (
        <ObserverErrorState
          title="Ảnh chụp trạng thái không khả dụng"
          description="Người quan sát không thể làm mới các ảnh chụp điểm kiểm tra cho nhánh này."
          onRetry={() => {
            void snapshotsQuery.refetch();
          }}
        />
      ) : null}
      {!snapshotsQuery.isLoading && snapshots.length === 0 ? (
        <ObserverEmptyState
          title="Chưa có ảnh chụp trạng thái nào được ghi lại"
          description="Nhánh này chưa công bố ảnh chụp điểm kiểm tra nào. Hãy ghi lại một ảnh từ bảng điều khiển để tạo tham chiếu ổn định cho các nhánh và kiểm tra trong tương lai."
          action={
            <Link href={`/universes/${universeId}/control`} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 shadow-sm">
              Tạo từ bảng điều khiển
            </Link>
          }
        />
      ) : null}
      {snapshots.length > 0 ? (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <article key={snapshot.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">{snapshot.label}</h3>
                  <p className="mt-1 text-xs font-bold text-slate-400">{snapshot.capturedAt}</p>
                </div>
                <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-1 rounded border border-sky-100">TICK {snapshot.tick.toLocaleString()}</span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-slate-600 italic">"{snapshot.note}"</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Entropy</p>
                  <p className="mt-1 text-lg font-black text-rose-600">{(snapshot.entropy ?? 0).toFixed(3)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Độ ổn định</p>
                  <p className="mt-1 text-lg font-black text-indigo-600">{(snapshot.stabilityIndex ?? 0).toFixed(3)}</p>
                </div>
                {Object.entries(snapshot.metrics)
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 capitalize">{key}</p>
                      <p className="mt-1 text-lg font-black text-sky-600">{typeof value === 'number' ? (value ?? 0).toFixed(2) : String(value)}</p>
                    </div>
                  ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </ObserverPanel>
  );
}
