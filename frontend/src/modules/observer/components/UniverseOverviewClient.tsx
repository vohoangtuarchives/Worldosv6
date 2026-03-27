'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useObserverUniverseChronicles, useObserverUniverseDetail, useObserverRealityPulse } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { RealityPulse } from '@/modules/observer/components/RealityPulse';
import { MutationStream } from '@/modules/observer/components/MutationStream';
import { AiDiagnosticsLab } from '@/modules/observer/components/AiDiagnosticsLab';
import { HUDBadge, HUDProgress } from '@/modules/observer/components/ui/hud-primitives';
import type { ChronicleEntry, UniverseDetail } from '@/modules/observer/types';

/* ── Hàm phụ trợ tính toán ngữ nghĩa ────────────────── */

function getHealthStatus(entropy: number, stability: number, anomalyCount: number) {
  const score = stability * 100 - entropy * 50 - anomalyCount * 5;
  if (score >= 70) return { label: 'ỔN ĐỊNH', status: 'nominal' as const, color: 'text-sky-600' };
  if (score >= 40) return { label: 'CẢNH BÁO', status: 'warning' as const, color: 'text-amber-600' };
  return { label: 'NGUY CẤP', status: 'critical' as const, color: 'text-rose-600' };
}

function getEntropyLabel(entropy: number) {
  if (entropy > 0.75) return 'Entropy Tăng vọt';
  if (entropy > 0.5) return 'Entropy Đang tăng';
  if (entropy > 0.25) return 'Entropy Ổn định';
  return 'Entropy Thấp';
}

function getTrendIcon(trend: string) {
  if (trend === 'rising' || trend === 'up') return <TrendingUp className="w-3 h-3 text-sky-600" />;
  if (trend === 'falling' || trend === 'down') return <TrendingDown className="w-3 h-3 text-rose-600" />;
  return <Minus className="w-3 h-3 text-slate-300" />;
}

/* ── Component chính ─────────────────────────────────── */

export function UniverseOverviewClient({
  universeId,
  initialUniverse,
  initialChronicles,
}: {
  universeId: string;
  initialUniverse: UniverseDetail;
  initialChronicles: ChronicleEntry[];
}) {
  const universeQuery = useObserverUniverseDetail(universeId, initialUniverse);
  const chroniclesQuery = useObserverUniverseChronicles(universeId, initialChronicles);
  const pulseQuery = useObserverRealityPulse(universeId);

  if (universeQuery.isError && !universeQuery.data) {
    return (
      <ObserverErrorState
        title="Universe detail could not be loaded"
        description="The observer workspace could not refresh the latest universe posture."
        onRetry={() => { void universeQuery.refetch(); }}
      />
    );
  }

  if (!universeQuery.data) {
    return <ObserverLoadingState lines={3} />;
  }

  const universe = universeQuery.data;
  const chronicles = chroniclesQuery.data ?? initialChronicles;
  const pulse = pulseQuery.data;

  const entropy = pulse?.entropy ?? universe.entropy;
  const stability = pulse?.stabilityIndex ?? universe.stability / 100;
  const health = getHealthStatus(entropy, stability, universe.anomalyCount);
  const entropyLabel = getEntropyLabel(entropy);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">

      {/* ── Thanh sức khỏe tổng hợp ──────────────────── */}
      <div className="lg:col-span-12">
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className={`w-2 h-2 rounded-full ${health.status === 'nominal' ? 'bg-sky-500' : health.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
          <span className={`font-display text-[10px] font-bold uppercase tracking-[0.3em] ${health.color}`}>
            THỰC TẠI: {health.label}
          </span>
          <div className="flex-1">
            <HUDProgress value={stability * 100} color="primary" />
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest">
            <span>{entropyLabel}</span>
            <span>|</span>
            <span>TICK_{universe.currentTick}</span>
          </div>
        </div>
      </div>

      {/* Area 1: Tình hình & Dấu hiệu sống */}
      <div className="lg:col-span-8">
        <ObserverPanel
          eyebrow="Tình hình"
          title="Tư thế nhân quả hiện tại"
          status={health.status}
          metric={{ label: 'ENTROPY', value: entropy.toFixed(3) }}
        >
          <div className="space-y-4 font-mono text-sm leading-7 text-foreground/80">
            <p>{universe.focus}</p>
            <p>
              Workspace tự động làm mới theo tài nguyên: chronicles, forks, snapshots và mutations tiến hóa độc lập
              mà không cần reload toàn bộ route.
            </p>
          </div>
        </ObserverPanel>
      </div>

      <div className="lg:col-span-4">
        <ObserverPanel eyebrow="Dấu hiệu sống" title="Sức khỏe thực tại" status={health.status}>
          <div className="flex h-full items-center justify-center py-4">
            <RealityPulse entropy={entropy} stability={stability} />
          </div>
        </ObserverPanel>
      </div>

      {/* Area 2: Biên niên sử gần đây */}
      <div className="lg:col-span-8">
        <ObserverPanel
          eyebrow="Tường thuật"
          title="Biên niên sử gần đây"
          metric={{ label: 'TỔNG', value: String(chronicles.length) }}
        >
          {chroniclesQuery.isLoading && chronicles.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {chroniclesQuery.isError && chronicles.length === 0 ? (
            <ObserverErrorState
              title="Kho lưu trữ biên niên sử không khả dụng"
              description="Lớp narrative không trả về dữ liệu chronicle cho nhánh vũ trụ này."
              onRetry={() => { void chroniclesQuery.refetch(); }}
            />
          ) : null}
          {!chroniclesQuery.isLoading && chronicles.length === 0 ? (
            <ObserverEmptyState
              title="Chưa có biên niên sử"
              description="Simulation chưa phát sinh tổng hợp narrative cho nhánh này."
            />
          ) : null}
          {chronicles.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {chronicles.slice(0, 4).map((entry) => (
                <article
                  key={entry.id}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display text-sm font-bold uppercase tracking-tight text-slate-800">{entry.title}</h3>
                    <Link
                      href={`/universes/${universeId}/chronicles?tick=${entry.tick}`}
                      className="font-mono text-[10px] text-primary/60 transition hover:text-primary"
                    >
                      <HUDBadge color="primary">T-{entry.tick}</HUDBadge>
                    </Link>
                  </div>
                  <p className="mt-2 line-clamp-2 font-mono text-xs leading-5 text-slate-500">{entry.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>
      </div>

      {/* Area 3: Tín hiệu thời gian thực */}
      <div className="lg:col-span-4 lg:row-span-1">
        <ObserverPanel
          eyebrow="Tín hiệu trực tiếp"
          title="Chỉ số quan tâm"
          status={universe.anomalyCount > 5 ? 'warning' : 'nominal'}
        >
          <ul className="space-y-4 font-mono text-xs text-slate-600">
            <li className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Cụm dị thường</span>
              <span className={`font-bold ${universe.anomalyCount > 5 ? 'text-amber-500' : 'text-sky-600'}`}>
                {universe.anomalyCount}
              </span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Nhánh đang hoạt động</span>
              <span className="font-bold text-sky-600">{universe.branchCount}</span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Đồng bộ lưu trữ</span>
              <span className="font-bold text-sky-600">{chronicles.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Stability Index</span>
              <span className={`font-bold ${health.color}`}>{(stability * 100).toFixed(1)}%</span>
            </li>
          </ul>
        </ObserverPanel>
      </div>

      {/* Area 4: Các Axiom cơ bản */}
      <div className="lg:col-span-12">
        <ObserverPanel eyebrow="Định đề" title="Tham số thế giới cơ bản">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {universe.axioms.map((axiom) => (
              <div
                key={axiom.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:shadow-sm group"
              >
                <div className="flex items-center gap-2">
                  {getTrendIcon(axiom.trend)}
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase text-slate-800">{axiom.key}</p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-400">{axiom.trend}</p>
                  </div>
                </div>
                <p className="font-mono text-xs font-bold text-sky-600">
                  {(axiom.value ?? 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </ObserverPanel>
      </div>

      {/* Area 5: Chẩn đoán & Mutation Stream */}
      <div className="lg:col-span-8">
        <AiDiagnosticsLab />
      </div>
      <div className="lg:col-span-4">
        <MutationStream universeId={universeId} />
      </div>
    </div>
  );
}
