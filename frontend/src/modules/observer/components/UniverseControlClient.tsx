'use client';

import { Activity, Radio, ShieldAlert, Sparkles } from 'lucide-react';
import { useObserverAutonomyAudit, useObserverRealityPulse, useObserverUniverseDetail } from '@/modules/observer/api';
import type { AutonomyAudit, RealityPulse } from '@/modules/observer/contracts';
import { MutationStream } from '@/modules/observer/components/MutationStream';
import { ObserverControlSurface } from '@/modules/observer/components/ObserverControlSurface';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import { RealityCore } from '@/modules/observer/components/RealityCore';
import type { UniverseDetail } from '@/modules/observer/types';
import { useObserverUniverseRealtime } from '@/modules/observer/useObserverUniverseRealtime';

function getConnectionTone(state: 'idle' | 'connecting' | 'connected' | 'disconnected') {
  if (state === 'connected') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (state === 'connecting') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (state === 'disconnected') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function UniverseControlClient({
  universeId,
  initialUniverse,
  initialRealityPulse,
  initialAutonomyAudit,
}: {
  universeId: string;
  initialUniverse: UniverseDetail;
  initialRealityPulse?: RealityPulse;
  initialAutonomyAudit?: AutonomyAudit;
}) {
  const universeQuery = useObserverUniverseDetail(universeId, initialUniverse);
  const realityPulseQuery = useObserverRealityPulse(universeId, initialRealityPulse);
  const autonomyAuditQuery = useObserverAutonomyAudit(universeId, initialAutonomyAudit);
  const realtime = useObserverUniverseRealtime(universeId);

  if (universeQuery.isError && !universeQuery.data) {
    return (
      <ObserverErrorState
        title="Bảng điều khiển không khả dụng"
        description="Người quan sát không thể làm mới trạng thái nhánh hiện tại trước khi hiển thị các nút điều khiển."
        onRetry={() => {
          void universeQuery.refetch();
        }}
      />
    );
  }

  if (!universeQuery.data) {
    return <ObserverLoadingState lines={2} />;
  }

  const universe = universeQuery.data;
  const pulse = realityPulseQuery.data;
  const audit = autonomyAuditQuery.data;
  const pressure = pulse && pulse.entropyThreshold > 0 ? pulse.entropy / pulse.entropyThreshold : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-sky-600 font-bold">Bảng điều khiển Quan sát / Auditor Expansion</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Nhịp Reality, kiểm toán Mutation và các nút can thiệp tập trung tại một bảng điều khiển.</h1>
            <p className="text-sm leading-7 text-slate-600">
              Thay vì dự đoán hệ thống đang làm gì, bạn giờ đây nhìn được nhịp Entropy, Mutation Chronicle và tín hiệu realtime từ cùng một dashboard. Mọi hành động can thiệp cũng đã bám vào invalidation rõ ràng nên các bảng liên quan tự cập nhật theo cùng resource keys.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <StatusBadge icon={Radio} label="Realtime" value={realtime.connectionState.toUpperCase()} tone={getConnectionTone(realtime.connectionState)} />
            <StatusBadge icon={Activity} label="Vũ trụ" value={`${universe.status.toUpperCase()} / T${universe.currentTick}`} tone="border-slate-200 bg-slate-50 text-slate-700" />
            <StatusBadge icon={ShieldAlert} label="Áp lực Entropy" value={pulse ? formatPercent(Math.min(pressure, 1.5)) : 'N/A'} tone="border-orange-200 bg-orange-50 text-orange-700" />
            <StatusBadge icon={Sparkles} label="Độ sâu Mutation" value={String(audit?.totalMutations ?? 0)} tone="border-sky-200 bg-sky-50 text-sky-700" />
          </div>
        </div>

        {realtime.lastEventLabel ? (
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 font-mono italic">Tín hiệu trực tiếp: {realtime.lastEventLabel}</div>
        ) : null}
      </section>

      <ObserverPanel eyebrow="Reality Core" title="Nhịp đập trung tâm của Vũ trụ">
        {realityPulseQuery.isError && !pulse ? (
          <ObserverErrorState
            title="Reality pulse không khả dụng"
            description="Người quan sát không thể đọc hàm sóng trực tiếp hoặc khối lượng thông tin."
            onRetry={() => {
              void realityPulseQuery.refetch();
            }}
          />
        ) : (
          <RealityCore pulse={pulse} />
        )}
      </ObserverPanel>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <ObserverPanel eyebrow="Autonomy Audit" title="Luồng Mutation và sổ cái khác biệt">
          <MutationStream universeId={universeId} />
        </ObserverPanel>

        <ObserverPanel eyebrow="Can thiệp" title="Điều khiển quy trình cốt lõi">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-slate-500 font-mono">
              Advance, fork, chuyển trạng thái và capture snapshot đều đi qua React Query mutations với invalidation rõ ràng, nên tab điều khiển không còn phụ thuộc vào việc làm mới thủ công để lấy dữ liệu mới.
            </p>
            <ObserverControlSurface universeId={universe.id} currentTick={universe.currentTick} status={universe.status} />
          </div>
        </ObserverPanel>
      </div>
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold tracking-tight">{value}</p>
    </div>
  );
}
