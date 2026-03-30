'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Zap, History } from 'lucide-react';
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
import { motion } from 'framer-motion';

/* ── Hàm phụ trợ tính toán ngữ nghĩa ────────────────── */

function getHealthStatus(entropy: number, stability: number, anomalyCount: number) {
  const score = stability * 100 - entropy * 50 - anomalyCount * 5;
  if (score >= 70) return { label: 'ỔN ĐỊNH', status: 'nominal' as const, color: 'text-primary' };
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
  if (trend === 'rising' || trend === 'up') return <TrendingUp className="w-4 h-4 text-primary" />;
  if (trend === 'falling' || trend === 'down') return <TrendingDown className="w-4 h-4 text-rose-600" />;
  return <Minus className="w-4 h-4" />;
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
        title="Không thể tải chi tiết Vũ trụ"
        description="Không gian làm việc quan sát không thể cập nhật trạng thái mới nhất của thực tại này."
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
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">

      {/* ── Thực tại HUD Status Bar ─────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-12"
      >
        <div className="flex flex-wrap items-center gap-6 px-10 py-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className={`w-3 h-3 rounded-full ${health.status === 'nominal' ? 'bg-primary shadow-[0_0_10px_rgba(7,89,133,0.4)]' : health.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
            <span className={`font-heading text-xs font-black uppercase tracking-[0.2em] ${health.color}`}>
              TRẠNG THÁI: {health.label}
            </span>
          </div>

          <div className="flex-1 min-w-[300px]">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Độ nhất quán của Thực tại</span>
                <span className="text-[10px] font-heading font-black text-primary italic">{(stability * 100).toFixed(1)}%</span>
             </div>
             <HUDProgress value={stability * 100} color="primary" />
          </div>

          <div className="flex items-center gap-10 text-[10px] font-heading font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
                 <Zap size={12} className="text-amber-500" />
                 {entropyLabel}
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
                 <History size={12} className="text-primary" />
                 TIC_{universe.currentTick.toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Area 1: Bối cảnh & Viễn thám */}
      <div className="lg:col-span-8">
        <ObserverPanel
          eyebrow="BỐI CẢNH"
          title="Trạng thái Nhân quả hiện tại"
          status={health.status}
          metric={{ label: 'ENTROPY', value: entropy.toFixed(4) }}
        >
          <div className="space-y-6 font-body text-base leading-relaxed text-slate-600">
            <p className="font-bold text-slate-900 border-l-4 border-primary/20 pl-6 italic">
              {universe.focus || "Thực tại này đang trong quá trình kiến tạo và đồng bộ hóa dữ liệu mô phỏng từ nhân hệ thống."}
            </p>
            <p className="text-sm">
                Bộ xử lý Quan sát tự động cập nhật các luồng dữ liệu: sử ký, phân nhánh, ảnh chụp và các đột biến thực tại
                theo thời gian thực. Mọi thay đổi về tiên đề sẽ ảnh hưởng trực tiếp đến quỹ đạo nhân quả của thế giới này.
            </p>
          </div>
        </ObserverPanel>
      </div>

      <div className="lg:col-span-4">
        <ObserverPanel eyebrow="VIỄN THÁM" title="Dấu hiệu Sự sống" status={health.status}>
          <div className="flex h-full items-center justify-center py-6">
            <RealityPulse entropy={entropy} stability={stability} />
          </div>
        </ObserverPanel>
      </div>

      {/* Area 2: Sử ký sự kiện */}
      <div className="lg:col-span-8">
        <ObserverPanel
          eyebrow="SỬ KÝ"
          title="Biên niên sử Sự kiện"
          metric={{ label: 'TỔNG', value: String(chronicles.length) }}
        >
          {chroniclesQuery.isLoading && chronicles.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {chroniclesQuery.isError && chronicles.length === 0 ? (
            <ObserverErrorState
              title="Kho lưu trữ biên niên sử không khả dụng"
              description="Hệ thống narrative không thể truy xuất dữ liệu chronicle cho nhánh vũ trụ này."
              onRetry={() => { void chroniclesQuery.refetch(); }}
            />
          ) : null}
          {!chroniclesQuery.isLoading && chronicles.length === 0 ? (
            <ObserverEmptyState
              title="Chưa có dữ liệu biên niên sử"
              description="Mô phỏng chưa phát sinh các tổng hợp narrative đủ lớn cho nhánh thực tại này."
            />
          ) : null}
          {chronicles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {chronicles.slice(0, 4).map((entry) => (
                <article
                  key={entry.id}
                  className="group relative overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-primary/30 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-heading text-xs font-bold uppercase tracking-tight text-slate-900 line-clamp-1">{entry.title}</h3>
                    <Link
                      href={`/universes/${universeId}/chronicles?tick=${entry.tick}`}
                      className="transition-transform group-hover:scale-110"
                    >
                      <HUDBadge color="primary">T-{entry.tick.toLocaleString()}</HUDBadge>
                    </Link>
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-500 font-medium italic">
                    {entry.summary}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>
      </div>

      {/* Area 3: Chỉ số Quan tâm */}
      <div className="lg:col-span-4">
        <ObserverPanel
          eyebrow="TÍN HIỆU TRỰC TIẾP"
          title="Mức độ Can thiệp"
          status={universe.anomalyCount > 5 ? 'warning' : 'nominal'}
        >
          <ul className="space-y-6">
            <MetricItem label="Cụm dị thường" value={universe.anomalyCount} highlighted={universe.anomalyCount > 5} highlightColor="text-rose-600" />
            <MetricItem label="Nhánh hoạt động" value={universe.branchCount} />
            <MetricItem label="Đồng bộ sử ký" value={chronicles.length} />
            <MetricItem label="Khối lượng thông tin" value={`${(universe.informationalMass ?? 0).toFixed(1)} IM`} />
            <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
                <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Độ ổn định hệ thống</span>
                <span className={`text-base font-heading font-black italic ${health.color}`}>{(stability * 100).toFixed(1)}%</span>
            </div>
          </ul>
        </ObserverPanel>
      </div>

      {/* Area 4: Các Tiên đề Thế giới */}
      <div className="lg:col-span-12">
        <ObserverPanel eyebrow="TIÊN ĐỀ" title="Thông số Vật lý & Siêu hình">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {universe.axioms.map((axiom) => (
              <div
                key={axiom.key}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 transition-all hover:border-primary/20 hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                       {getTrendIcon(axiom.trend)}
                  </div>
                  <div>
                    <p className="font-heading text-[10px] font-black uppercase text-slate-900 tracking-tight leading-none">{axiom.key}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-1 font-bold italic">{axiom.trend === 'up' ? 'TĂNG' : axiom.trend === 'down' ? 'GIẢM' : 'ỔN ĐỊNH'}</p>
                  </div>
                </div>
                <p className="font-heading text-sm font-black italic text-primary">
                  {(axiom.value ?? 0).toFixed(3)}
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

      <style jsx global>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function MetricItem({ label, value, highlighted = false, highlightColor = "text-primary" }: { label: string; value: string | number; highlighted?: boolean; highlightColor?: string }) {
  return (
    <li className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
        <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`font-heading text-sm font-black italic ${highlighted ? highlightColor : 'text-slate-900 group-hover:text-primary'} transition-colors`}>
        {value}
      </span>
    </li>
  );
}
