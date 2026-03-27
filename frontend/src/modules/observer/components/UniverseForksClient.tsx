'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useObserverBranchComparison, useObserverUniverseForks } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { BranchSummary } from '@/modules/observer/types';

export function UniverseForksClient({
  universeId,
  initialForks,
}: {
  universeId: string;
  initialForks: BranchSummary[];
}) {
  const forksQuery = useObserverUniverseForks(universeId, initialForks);
  const forks = forksQuery.data ?? initialForks;
  const [selectedBranchIdState, setSelectedBranchId] = useState<string | null>(initialForks[0]?.id ?? null);
  const selectedBranchId = selectedBranchIdState ?? forks[0]?.id ?? null;
  const comparisonQuery = useObserverBranchComparison(universeId, selectedBranchId);

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <ObserverPanel eyebrow="Nhánh Vũ trụ" title="Các quỹ đạo song song được dẫn xuất từ vũ trụ này">
        {forksQuery.isLoading && forks.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {forksQuery.isError && forks.length === 0 ? (
          <ObserverErrorState
            title="Các nhánh vũ trụ không khả dụng"
            description="Người quan sát không thể làm mới các nhánh dẫn xuất cho vũ trụ này."
            onRetry={() => {
              void forksQuery.refetch();
            }}
          />
        ) : null}
        {!forksQuery.isLoading && forks.length === 0 ? (
          <ObserverEmptyState
            title="Chưa có nhánh dẫn xuất nào"
            description="Vũ trụ này chưa chia tách thành các quỹ đạo song song. Hãy tạo một nhánh từ bảng điều khiển khi bạn muốn so sánh các kết quả giả định mà không làm thay đổi dòng thời gian chính."
            action={
              <Link href={`/universes/${universeId}/control`} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 shadow-sm">
                Tạo nhánh từ bảng điều khiển
              </Link>
            }
          />
        ) : null}
        {forks.length > 0 ? (
          <div className="space-y-4">
            {forks.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedBranchId === branch.id ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{branch.label}</h3>
                    <p className="mt-2 text-xs font-bold text-slate-400">Tick phân kỳ: {branch.divergenceTick.toLocaleString()}</p>
                  </div>
                  <span className="rounded-full border border-sky-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600 shadow-sm">
                    {branch.status}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-bold text-slate-500">Tick nhánh hiện tại: {branch.currentTick.toLocaleString()}</p>
              </button>
            ))}
          </div>
        ) : null}
      </ObserverPanel>

      <ObserverPanel eyebrow="So sánh" title="Tóm tắt sự phân kỳ của nhánh">
        {!selectedBranchId ? (
          <ObserverEmptyState
            title="Chọn một nhánh để so sánh"
            description="Khi có ít nhất một nhánh tồn tại, bảng này sẽ hiển thị sự thay đổi về entropy, độ ổn định và các chỉ số so với vũ trụ gốc."
          />
        ) : null}
        {comparisonQuery.isLoading && selectedBranchId ? <ObserverLoadingState lines={2} /> : null}
        {comparisonQuery.isError && selectedBranchId ? (
          <ObserverErrorState
            title="So sánh nhánh thất bại"
            description="Điểm cuối so sánh không thể tạo ra sự khác biệt cho nhánh đã chọn."
            onRetry={() => {
              void comparisonQuery.refetch();
            }}
          />
        ) : null}
        {comparisonQuery.data ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Khoảng cách Tick</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{comparisonQuery.data.tickSpan.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Chênh lệch Entropy</p>
                <p className="mt-2 text-2xl font-black text-rose-600">{(comparisonQuery.data.deltas.entropy ?? 0).toFixed(3)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Chênh lệch Độ ổn định</p>
                <p className="mt-2 text-2xl font-black text-indigo-600">{(comparisonQuery.data.deltas.stabilityIndex ?? 0).toFixed(3)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Chênh lệch Tick Hiện tại</p>
                <p className="mt-2 text-2xl font-black text-sky-600">{comparisonQuery.data.deltas.currentTick.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(comparisonQuery.data.metricDeltas).slice(0, 6).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-inner">
                  <p className="text-sm font-black text-slate-700 capitalize">{key}</p>
                  <p className="text-sm font-bold text-sky-600">{(value ?? 0).toFixed(3)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ObserverPanel>
    </div>
  );
}
