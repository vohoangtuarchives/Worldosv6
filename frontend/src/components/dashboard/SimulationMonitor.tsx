"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { WorldSimulationStatusResponse, UniverseSimulationItem } from "@/types/simulation";
import {
  AlertTriangle,
  Loader2,
  Zap,
  RefreshCw,
  Cpu,
  Layers,
  Activity,
  Radio,
} from "lucide-react";

export function SimulationMonitor() {
  const [worlds, setWorlds] = useState<{ id: number; name: string }[]>([]);
  const [worldId, setWorldId] = useState<number | null>(null);
  const [status, setStatus] = useState<WorldSimulationStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [advanceLoadingId, setAdvanceLoadingId] = useState<number | null>(null);
  const [advanceModal, setAdvanceModal] = useState<{ universeId: number; name: string } | null>(null);
  const [advanceTicks, setAdvanceTicks] = useState(5);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchWorlds = useCallback(async () => {
    try {
      const res = await api.worlds();
      const data = Array.isArray(res) ? res : (res as { data?: unknown[] }).data ?? res;
      const list = Array.isArray(data) ? data : [];
      setWorlds(
        list.map((w: { id: number; name?: string }) => ({ id: w.id, name: w.name ?? `World ${w.id}` }))
      );
      if (list.length > 0) {
        setWorldId((prev) => (prev == null ? (list[0] as { id: number }).id : prev));
      }
    } catch (e) {
      console.error("Failed to fetch worlds", e);
      setError("Không tải được danh sách world.");
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!worldId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.worldSimulationStatus(worldId);
      setStatus(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi tải trạng thái simulation";
      setError(msg);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [worldId]);

  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Realtime: SSE stream (EventSource) — server push mỗi ~1.5s, không polling
  useEffect(() => {
    if (!worldId) return;
    const url = api.worldSimulationStatusStreamUrl(worldId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WorldSimulationStatusResponse;
        setStatus(data);
        setError(null);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setError("Mất kết nối realtime. Thử Làm mới hoặc kiểm tra backend.");
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [worldId]);

  const handlePulse = async (ticksPerUniverse: number) => {
    if (!worldId) return;
    setPulseLoading(true);
    try {
      await api.pulseWorld(worldId, ticksPerUniverse);
      await fetchStatus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi pulse";
      setError(msg);
    } finally {
      setPulseLoading(false);
    }
  };

  const handleToggleAutonomic = async () => {
    if (!status?.world) return;
    setPulseLoading(true);
    try {
      await api.toggleAutonomic(status.world.id);
      await fetchStatus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi bật/tắt autonomic";
      setError(msg);
    } finally {
      setPulseLoading(false);
    }
  };

  const handleAdvance = async (universeId: number, ticks: number) => {
    setAdvanceLoadingId(universeId);
    try {
      await api.advance(universeId, ticks);
      setAdvanceModal(null);
      await fetchStatus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi advance";
      setError(msg);
    } finally {
      setAdvanceLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* World selector + controls */}
      <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            World
          </label>
          <select
            value={worldId ?? ""}
            onChange={(e) => setWorldId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border border-border bg-muted text-foreground px-3 py-1.5 text-sm min-w-[180px] flex items-center gap-2"
          >
            <option value="">Chọn world</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchStatus()}
            disabled={loading}
            className="rounded-md border border-border bg-muted/60 px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Làm mới
          </button>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400/90" title="Server-Sent Events">
            <Radio className="w-4 h-4" />
            Realtime
          </span>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/50 text-destructive text-sm rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!worldId ? (
        <div className="rounded-lg border border-border bg-card/50 p-12 text-center text-muted-foreground">
          Chọn một world để xem trạng thái simulation.
        </div>
      ) : loading && !status ? (
        <div className="rounded-lg border border-border bg-card/50 p-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Đang tải...
        </div>
      ) : status ? (
        <>
          {/* Pipeline + Kernel + Autonomic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {status.pipeline && (
              <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Pipeline
                </h2>
                <p className="text-sm text-foreground">Phase: {status.pipeline.phase}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {status.pipeline.steps?.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {status.scheduler && (
              <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Kernel · Scheduler
                </h2>
                <p className="text-sm text-foreground">Tick budget: {status.scheduler.tick_budget}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Snapshot interval: {status.world.snapshot_interval ?? "—"}
                </p>
              </section>
            )}
            {status.autonomic && (
              <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Autonomic
                </h2>
                <p className="text-sm text-foreground">
                  Fork min: {status.autonomic.fork_entropy_min} · Archive: {status.autonomic.archive_entropy_threshold}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      status.world.is_autonomic ? "bg-emerald-900/50 text-emerald-300" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status.world.is_autonomic ? "Bật" : "Tắt"}
                  </span>
                  <button
                    onClick={handleToggleAutonomic}
                    disabled={pulseLoading}
                    className="text-xs px-2 py-1 rounded border border-border bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
                  >
                    {pulseLoading ? "..." : "Bật/Tắt"}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Pulse World */}
          <section className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur-sm">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Pulse World
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                defaultValue={5}
                id="pulse-ticks"
                className="w-16 rounded border border-border bg-muted text-foreground px-2 py-1 text-sm"
              />
              <label htmlFor="pulse-ticks" className="text-sm text-muted-foreground">
                ticks/universe
              </label>
              <button
                onClick={() => {
                  const el = document.getElementById("pulse-ticks") as HTMLInputElement;
                  handlePulse(el ? parseInt(el.value, 10) || 5 : 5);
                }}
                disabled={pulseLoading}
                className="rounded-md border border-border bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-muted/80 disabled:opacity-50 flex items-center gap-2"
              >
                {pulseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Pulse World
              </button>
            </div>
          </section>

          {/* Tick Pipeline engines */}
          {status.tick_pipeline_engines && status.tick_pipeline_engines.length > 0 && (
            <section className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Tick Pipeline (13 engines)
              </h2>
              <div className="flex flex-wrap gap-1">
                {status.tick_pipeline_engines.map((eng) => (
                  <span
                    key={eng.priority}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    title={`Priority ${eng.priority}`}
                  >
                    {eng.priority}. {eng.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Universe table */}
          <section className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur-sm overflow-x-auto">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Universes ({status.universes?.length ?? 0})
            </h2>
            {!status.universes?.length ? (
              <p className="text-muted-foreground text-sm py-6 text-center">
                Chưa có universe. Tạo universe (seed/demo) từ world trước.
              </p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Tên</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Tick</th>
                    <th className="py-2 pr-2">Entropy</th>
                    <th className="py-2 pr-2">Stability</th>
                    <th className="py-2 pr-2">Priority</th>
                    <th className="py-2 pr-2">Decision</th>
                    <th className="py-2 pr-2">Attractors</th>
                    <th className="py-2 pr-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {status.universes.map((u) => (
                    <UniverseRow
                      key={u.id}
                      u={u}
                      onAdvance={() => setAdvanceModal({ universeId: u.id, name: u.name })}
                      advanceLoading={advanceLoadingId === u.id}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}

      {/* Advance modal */}
      {advanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-card p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Advance: {advanceModal.name}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                min={1}
                max={1000}
                value={advanceTicks}
                onChange={(e) => setAdvanceTicks(parseInt(e.target.value, 10) || 1)}
                className="w-20 rounded border border-border bg-muted text-foreground px-2 py-1 text-sm"
              />
              <span className="text-sm text-muted-foreground">ticks</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAdvance(advanceModal.universeId, advanceTicks)}
                disabled={advanceLoadingId !== null}
                className="rounded-md border border-border bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-muted/80 disabled:opacity-50"
              >
                {advanceLoadingId !== null ? "Đang chạy..." : "Advance"}
              </button>
              <button
                onClick={() => setAdvanceModal(null)}
                className="rounded-md border border-border bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-muted/80"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UniverseRow({
  u,
  onAdvance,
  advanceLoading,
}: {
  u: UniverseSimulationItem;
  onAdvance: () => void;
  advanceLoading: boolean;
}) {
  const stability = u.latest_snapshot?.stability_index ?? null;
  const attractors = u.latest_snapshot?.active_attractors ?? [];

  return (
    <tr className="border-b border-border hover:bg-muted/30">
      <td className="py-2 pr-2 font-mono text-muted-foreground">{u.order_index ?? "—"}</td>
      <td className="py-2 pr-2 text-foreground">{u.name}</td>
      <td className="py-2 pr-2">
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            u.status === "active" || u.status === "running"
              ? "bg-emerald-900/40 text-emerald-300"
              : u.status === "halted"
                ? "bg-amber-900/40 text-amber-300"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {u.status}
        </span>
      </td>
      <td className="py-2 pr-2 font-mono text-foreground">{u.current_tick}</td>
      <td className="py-2 pr-2 font-mono text-foreground">{u.entropy != null ? u.entropy.toFixed(2) : "—"}</td>
      <td className="py-2 pr-2 font-mono text-foreground">
        {stability != null ? stability.toFixed(2) : "—"}
      </td>
      <td className="py-2 pr-2 font-mono text-foreground">{u.priority != null ? u.priority.toFixed(2) : "—"}</td>
      <td className="py-2 pr-2">
        <span className="text-xs text-muted-foreground">{u.autonomic_decision ?? "—"}</span>
        {u.fork_count_if_fork != null && (
          <span className="text-[10px] text-muted-foreground ml-1">(fork={u.fork_count_if_fork})</span>
        )}
      </td>
      <td className="py-2 pr-2">
        <div className="flex flex-wrap gap-0.5">
          {attractors.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] px-1 rounded bg-muted text-muted-foreground">
              {a}
            </span>
          ))}
          {attractors.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{attractors.length - 3}</span>
          )}
        </div>
      </td>
      <td className="py-2 pr-2">
        {(u.status === "active" || u.status === "running") && (
          <button
            onClick={onAdvance}
            disabled={advanceLoading}
            className="text-xs px-2 py-1 rounded border border-border bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            Advance
          </button>
        )}
      </td>
    </tr>
  );
}
