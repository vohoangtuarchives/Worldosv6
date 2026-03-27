'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  useAdvanceUniverseMutation,
  useCreateUniverseSnapshotMutation,
  useForkUniverseMutation,
  useToggleUniverseStatusMutation,
} from '@/modules/observer/api';

function parseInteger(value: string, minimum: number, maximum?: number): number | undefined {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    return undefined;
  }

  if (typeof maximum === 'number' && parsed > maximum) {
    return undefined;
  }

  return parsed;
}

export function ObserverControlSurface({
  universeId,
  currentTick,
  status,
}: {
  universeId: string;
  currentTick: number;
  status: 'active' | 'paused' | 'forked';
}) {
  const advanceMutation = useAdvanceUniverseMutation(universeId);
  const forkMutation = useForkUniverseMutation(universeId);
  const toggleMutation = useToggleUniverseStatusMutation(universeId);
  const snapshotMutation = useCreateUniverseSnapshotMutation(universeId);
  const [advanceTicks, setAdvanceTicks] = useState('5');
  const [forkTick, setForkTick] = useState(String(currentTick));
  const [forkName, setForkName] = useState('');

  const isBusy = advanceMutation.isPending || forkMutation.isPending || toggleMutation.isPending || snapshotMutation.isPending;

  async function handleAdvance() {
    const ticks = parseInteger(advanceTicks, 1, 1000);
    if (ticks === undefined) {
      toast.error('Cửa sổ tick phải là một số nguyên từ 1 đến 1000.');
      return;
    }

    try {
      await advanceMutation.mutateAsync(ticks);
      toast.success(`Đã tiến tới ${ticks} tick trong mô phỏng.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tiến tới thất bại.');
    }
  }

  async function handleFork() {
    const divergenceTick = parseInteger(forkTick, 0, currentTick);
    if (divergenceTick === undefined) {
      toast.error(`Tick phân kỳ phải là số nguyên từ 0 đến ${currentTick}.`);
      return;
    }

    if (forkName.trim().length > 120) {
      toast.error('Nhãn nhánh phải dưới 120 ký tự.');
      return;
    }

    try {
      const payload = await forkMutation.mutateAsync({
        tick: divergenceTick,
        name: forkName.trim() || undefined,
      });
      const data = typeof payload === 'object' && payload ? (payload.data as Record<string, unknown> | undefined) : undefined;
      const branchId = typeof data?.child_universe_id === 'number' ? data.child_universe_id : 'mới';
      setForkName('');
      toast.success(`Đã tách nhánh ${branchId} từ tick ${divergenceTick}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tách nhánh thất bại.');
    }
  }

  async function handleToggleStatus() {
    try {
      const payload = await toggleMutation.mutateAsync();
      const nextStatus = typeof payload?.new_status === 'string' ? payload.new_status : 'cập nhật';
      toast.success(`Trạng thái vũ trụ đã đổi sang ${nextStatus}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cập nhật trạng thái thất bại.');
    }
  }

  async function handleSnapshot() {
    try {
      const payload = await snapshotMutation.mutateAsync();
      const data = typeof payload === 'object' && payload ? (payload.data as Record<string, unknown> | undefined) : undefined;
      const snapshot = data?.snapshot as Record<string, unknown> | undefined;
      const tick = typeof snapshot?.tick === 'number' ? snapshot.tick : currentTick;
      toast.success(`Đã ghi lại snapshot tại tick ${tick}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ghi snapshot thất bại.');
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          void handleAdvance();
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.26em] text-sky-600 font-bold">Tiến tới</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Tiến tới trạng thái nhân quả tiếp theo</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sử dụng các cửa sổ tick có giới hạn để người quan sát có thể kiểm tra các thay đổi mà không làm mất đi dấu vết câu chuyện.
        </p>
        <label className="mt-5 block text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">
          Cửa sổ Tick
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
            inputMode="numeric"
            min="1"
            step="1"
            value={advanceTicks}
            onChange={(event) => setAdvanceTicks(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={isBusy}
          className="mt-5 w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {advanceMutation.isPending ? 'Đang tiến tới...' : 'Tiến trình Simulation'}
        </button>
      </form>

      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          void handleFork();
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.26em] text-sky-600 font-bold">Fork</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Tách một quỹ đạo song song</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Tách nhánh từ một điểm kiểm tra nhân quả đã biết để so sánh các kết quả mà không làm thay đổi nhanh đang hoạt động.
        </p>
        <label className="mt-5 block text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">
          Tick phân kỳ
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
            inputMode="numeric"
            min="0"
            max={currentTick}
            step="1"
            value={forkTick}
            onChange={(event) => setForkTick(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">
          Nhãn của nhánh
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
            value={forkName}
            onChange={(event) => setForkName(event.target.value)}
            placeholder="Bình minh mới"
            maxLength={120}
          />
        </label>
        <button
          type="submit"
          disabled={isBusy}
          className="mt-5 w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {forkMutation.isPending ? 'Đang tạo nhánh...' : 'Tạo nhánh mới'}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.26em] text-sky-600 font-bold">Trạng thái</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Tư thế quan sát</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Trạng thái nhánh hiện tại là <span className="font-bold text-slate-900 uppercase">{status}</span>. Chuyển đổi trạng thái khi bạn cần tạm dừng tiến trình tự động hoặc tiếp tục quan sát tích cực.
        </p>
        <p className="mt-5 text-3xl font-bold text-sky-600 font-mono">Tick {currentTick.toLocaleString()}</p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            void handleToggleStatus();
          }}
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {toggleMutation.isPending ? 'Đang cập nhật...' : 'Chuyển đổi trạng thái'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.26em] text-sky-600 font-bold">Snapshot</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Ghi lại trạng thái hiện tại</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Lưu trữ một điểm kiểm tra ngay bây giờ để các so sánh nhánh trong tương lai có một khung tham chiếu ổn định.
        </p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            void handleSnapshot();
          }}
          className="mt-5 w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {snapshotMutation.isPending ? 'Đang ghi lại...' : 'Tạo Snapshot'}
        </button>
      </div>
    </div>
  );
}
