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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Biên niên sử</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{chronicles.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Độ quan trọng cao</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">{highImportanceCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Tick mới nhất</p>
          <p className="mt-2 text-2xl font-black text-sky-600">{chronicles[0]?.tick?.toLocaleString() ?? 'N/A'}</p>
        </div>
      </div>

      <ObserverPanel eyebrow="Biên niên sử" title="Kho lưu trữ tự sự cho nhánh đang hoạt động">
        {chroniclesQuery.isLoading && chronicles.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {chroniclesQuery.isError && chronicles.length === 0 ? (
          <ObserverErrorState
            title="Kho lưu trữ biên niên sử không khả dụng"
            description="Lớp tự sự không trả về dữ liệu biên niên sử cho nhánh này."
            onRetry={() => {
              void chroniclesQuery.refetch();
            }}
          />
        ) : null}
        {!chroniclesQuery.isLoading && visibleChronicles.length === 0 ? (
          <ObserverEmptyState
            title={Number.isFinite(focusedTick) ? 'Không có biên niên sử nào khớp với tick này' : 'Chưa có kho lưu trữ biên niên sử'}
            description={
              Number.isFinite(focusedTick)
                ? 'Tick này hiện không ánh xạ tới cửa sổ biên niên sử nào. Hãy thử sự kiện khác hoặc xóa bộ lọc.'
                : 'Mô phỏng chưa phát ra tổng hợp tự sự cho nhánh này. Khi biên niên sử được tạo, kho lưu trữ này sẽ trở thành lớp cốt truyện của vũ trụ.'
            }
            action={
              <>
                <Link href={`/universes/${universeId}/timeline`} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 shadow-sm">
                  Mở dòng thời gian
                </Link>
                {Number.isFinite(focusedTick) ? (
                  <Link href={`/universes/${universeId}/chronicles`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 shadow-sm">
                    Xóa bộ lọc tick
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
                  className={`relative rounded-3xl border p-6 transition-all hover:shadow-md ${highlighted ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-slate-100 bg-white'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight text-slate-900">{entry.title}</h3>
                      <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                         <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 font-mono">
                            Cửa sổ Kỷ nguyên {entry.fromTick.toLocaleString()} — {entry.toTick.toLocaleString()}
                         </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/universes/${universeId}/timeline?tick=${entry.tick}`} className="px-3 py-1.5 rounded-full border border-sky-200 bg-white text-[9px] font-black uppercase tracking-widest text-sky-600 hover:bg-sky-50 transition-colors shadow-sm">
                        Kiểm tra Nút Nhân quả
                      </Link>
                      <span className="px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Trọng số {((entry.importance ?? 0) * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                     <p className="text-[13px] leading-7 text-slate-600 first-letter:text-4xl first-letter:font-black first-letter:text-sky-600 first-letter:mr-3 first-letter:float-left first-letter:leading-none first-letter:mt-1">
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
