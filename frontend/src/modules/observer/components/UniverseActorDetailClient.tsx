'use client';

import { useObserverActorDecisions, useObserverActorDetail, useObserverActorEvents } from '@/modules/observer/api';
import { ObserverEmptyState } from '@/modules/observer/components/ObserverEmptyState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverPanel } from '@/modules/observer/components/ObserverPanel';
import type { ActorDecision, ActorDetail, ActorEventEntry } from '@/modules/observer/types';
import { HUDCard, HUDBadge } from '@/modules/observer/components/ui/hud-primitives';

export function UniverseActorDetailClient({
  actorId,
  initialActor,
  initialEvents,
  initialDecisions,
}: {
  actorId: string;
  initialActor: ActorDetail;
  initialEvents: ActorEventEntry[];
  initialDecisions: ActorDecision[];
}) {
  const actorQuery = useObserverActorDetail(actorId, initialActor);
  const eventsQuery = useObserverActorEvents(actorId, initialEvents);
  const decisionsQuery = useObserverActorDecisions(actorId, initialDecisions);

  if (actorQuery.isError && !actorQuery.data) {
    return (
      <ObserverErrorState
        title="Thông tin thực thể hiện không khả dụng"
        description="Quan sát viên không thể tải hồ sơ thực thể hiện tại."
        onRetry={() => {
          void actorQuery.refetch();
        }}
      />
    );
  }

  if (!actorQuery.data) {
    return <ObserverLoadingState lines={3} />;
  }

  const actor = actorQuery.data;
  const visibleEvents = (eventsQuery.data ?? initialEvents).length > 0 ? eventsQuery.data ?? initialEvents : actor.recentEvents;
  const decisions = decisionsQuery.data ?? initialDecisions;
  const traitEntries = Object.entries(actor.traits).slice(0, 6);

  return (
    <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.2fr)_minmax(400px,0.8fr)] font-sans">
      <div className="space-y-8">
        <ObserverPanel eyebrow="Hồ sơ Thực thể" title={actor.name}>
          <div className="space-y-6 text-sm leading-relaxed text-slate-500">
            <p className="font-medium text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
              &ldquo;{actor.biography}&rdquo;
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Vai trò</p>
                <p className="mt-2 text-base font-black text-slate-900">{actor.role}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Khuynh hướng</p>
                <p className="mt-2 text-base font-black text-sky-600">{actor.alignment}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Giai đoạn Đời sống</p>
                <p className="mt-2 text-base font-black text-slate-900">{actor.lifeStage}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Trạng thái</p>
                <div className="mt-2">
                  <HUDBadge color={actor.isAlive ? 'primary' : 'neutral'}>
                    {actor.isAlive ? 'Sống' : 'Ngừng hoạt động'}
                  </HUDBadge>
                </div>
              </div>
            </div>
          </div>
        </ObserverPanel>

        <ObserverPanel eyebrow="Vết tích Quyết định" title="Kết quả lập luận gần đây">
          {decisionsQuery.isLoading && decisions.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {decisionsQuery.isError && decisions.length === 0 ? (
            <ObserverErrorState
              title="Vết tích quyết định không khả dụng"
              description="Không thể làm mới lịch sử lập luận của thực thể."
              onRetry={() => {
                void decisionsQuery.refetch();
              }}
            />
          ) : null}
          {!decisionsQuery.isLoading && decisions.length === 0 ? (
            <ObserverEmptyState
              title="Chưa có vết tích quyết định"
              description="Thực thể này chưa công bố bất kỳ quyết định nào có thể truy xuất. Khi các dấu vết lập luận được lưu trữ, chúng sẽ xuất hiện ở đây cùng với điểm tin cậy và tiện ích."
            />
          ) : null}
          {decisions.length > 0 ? (
            <div className="space-y-4">
              {decisions.map((decision) => (
                <article key={decision.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-sky-200 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{decision.actionType.replaceAll('_', ' ')}</h3>
                    <span className="text-[10px] font-black text-sky-600/60 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">Nhịp {decision.tick.toLocaleString()}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500 font-medium">{decision.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      Độ tin cậy {(decision.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      Tiện ích {decision.utilityScore.toFixed(2)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>
      </div>

      <div className="space-y-8">
        <ObserverPanel eyebrow="Tầm ảnh hưởng" title="Trọng số quyết định và đặc điểm">
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-8 shadow-inner">
            <p className="text-5xl font-black text-sky-600 tracking-tighter">{actor.influence.toFixed(1)}</p>
            <p className="mt-3 text-xs font-bold text-sky-700/60 uppercase tracking-tight leading-relaxed">
              Điểm ảnh hưởng được suy ra từ các chỉ số thực thể, liên kết thực thể tối cao và áp lực quyết định.
            </p>
          </div>
          {traitEntries.length > 0 ? (
            <div className="mt-6 space-y-3">
              {traitEntries.map(([trait, value]) => (
                <div key={trait} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{trait.replaceAll('_', ' ')}</p>
                  <p className="text-sm font-black text-sky-600">{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </ObserverPanel>

        <ObserverPanel eyebrow="Sự kiện" title="Sự kiện đời sống gần đây">
          {eventsQuery.isLoading && visibleEvents.length === 0 ? <ObserverLoadingState lines={3} /> : null}
          {eventsQuery.isError && visibleEvents.length === 0 ? (
            <ObserverErrorState
              title="Sự kiện thực thể không khả dụng"
              description="Không thể làm mới dòng thời gian sự kiện của thực thể."
              onRetry={() => {
                void eventsQuery.refetch();
              }}
            />
          ) : null}
          {!eventsQuery.isLoading && visibleEvents.length === 0 ? (
            <ObserverEmptyState
              title="Chưa có sự kiện thực thể nào được ghi lại"
              description="Khi dòng thời gian thực thể khả dụng, bảng này sẽ hiển thị các sự kiện cột mốc giải thích vị thế và quyết định hiện tại."
            />
          ) : null}
          {visibleEvents.length > 0 ? (
            <div className="space-y-4">
              {visibleEvents.slice(0, 6).map((event) => (
                <article key={event.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{event.type.replaceAll('_', ' ')}</h3>
                    <span className="text-[10px] font-black text-slate-300">Nhịp {event.tick.toLocaleString()}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500 font-medium">{event.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
        </ObserverPanel>
      </div>
    </div>
  );
}

