'use client';

import Link from 'next/link';
import { useObserverUniverseMythScars } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import { Clock } from 'lucide-react';
import type { MythScar } from '@/modules/observer/types';

const severityStyles: Record<'low' | 'medium' | 'high', string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-500/5',
  medium: 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-500/5',
  high: 'border-rose-200 bg-rose-50 text-rose-700 shadow-rose-500/5',
};

const severityLabels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Mức độ thấp',
  medium: 'Mức độ trung bình',
  high: 'Mức độ cao',
};

export function UniverseMythScarsClient({
  universeId,
  initialMythScars,
}: {
  universeId: string;
  initialMythScars: MythScar[];
}) {
  const mythScarsQuery = useObserverUniverseMythScars(universeId, initialMythScars);
  const mythScars = mythScarsQuery.data ?? initialMythScars;
  const severityCount = mythScars.reduce<Record<'low' | 'medium' | 'high', number>>(
    (accumulator, scar) => {
      accumulator[scar.severity] += 1;
      return accumulator;
    },
    { low: 0, medium: 0, high: 0 },
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="grid gap-6 md:grid-cols-3">
        {(['high', 'medium', 'low'] as const).map((severity) => (
          <div key={severity} className={`rounded-[2rem] border p-6 transition-all hover:shadow-md ${severityStyles[severity]}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">{severityLabels[severity]}</p>
            <p className="mt-4 text-3xl font-black">{severityCount[severity]}</p>
          </div>
        ))}
      </div>

      <ObserverPanel eyebrow="Vết sẹo Thần thoại" title="Các xáo trộn bộ nhớ dài hạn vẫn đang định hình thế giới">
        {mythScarsQuery.isLoading && mythScars.length === 0 ? <ObserverLoadingState lines={3} /> : null}
        {mythScarsQuery.isError && mythScars.length === 0 ? (
          <ObserverErrorState
            title="Dữ liệu Vết sẹo Thần thoại hiện không khả dụng"
            description="Quan sát viên không thể làm mới dữ liệu vết sẹo chưa giải quyết cho nhánh thực tại này."
            onRetry={() => {
              void mythScarsQuery.refetch();
            }}
          />
        ) : null}
        {!mythScarsQuery.isLoading && mythScars.length === 0 ? (
          <ObserverEmptyState
            title="Hiện không có Vết sẹo Thần thoại nào"
            description="Nhánh này hiện không để lộ các vết sẹo thần thoại chưa giải quyết. Các chấn thương tự sự dai dẳng và xáo trộn bộ nhớ dài hạn sẽ xuất hiện tại đây khi được hệ thống mô phỏng phát hiện."
            action={
              <Link href={`/universes/${universeId}/timeline`} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition hover:bg-slate-50">
                Kiểm tra Dòng thời gian Phân kỳ
              </Link>
            }
          />
        ) : null}
        {mythScars.length > 0 ? (
          <div className="space-y-6">
            {mythScars.map((scar) => (
              <article key={scar.id} className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-sky-100 group">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors uppercase tracking-tight">{scar.title}</h3>
                    <div className="mt-3 flex items-center gap-3">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Nhịp khởi nguồn: <span className="text-slate-900">{scar.originTick.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-xl border px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${severityStyles[scar.severity]}`}>
                    {severityLabels[scar.severity]} / Chỉ số: {(scar.severityScore * 100).toFixed(0)}
                  </span>
                </div>
                <div className="mt-6 border-t border-slate-50 pt-6">
                  <p className="text-sm font-medium leading-relaxed text-slate-500 italic">
                    &ldquo;{scar.consequence}&rdquo;
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </ObserverPanel>
    </div>
  );
}

