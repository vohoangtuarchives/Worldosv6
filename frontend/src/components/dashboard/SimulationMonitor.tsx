"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { WorldSimulationStatusResponse } from "@/types/simulation";
import {
  AlertTriangle,
  Loader2,
  Layers,
  Activity,
} from "lucide-react";

import { WorldSelector } from "./SimulationMonitor/WorldSelector";
import { PulseAndAutonomicPanel } from "./SimulationMonitor/PulseAndAutonomicPanel";
import { UniverseTable } from "./SimulationMonitor/UniverseTable";

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

  // Realtime: SSE stream (EventSource)
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
      <WorldSelector
        worlds={worlds}
        worldId={worldId}
        setWorldId={setWorldId}
        loading={loading}
        onRefresh={fetchStatus}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/50 text-destructive text-sm rounded-lg mb-6">
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
          <PulseAndAutonomicPanel
            status={status}
            pulseLoading={pulseLoading}
            onPulse={handlePulse}
            onToggleAutonomic={handleToggleAutonomic}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {status.pipeline && (
              <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Pipeline Blocks (7 Blocks)
                </h2>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "simulation",
                    "autonomic",
                    "scheduler",
                    "decision",
                    "cascade",
                    "ecology",
                    "timeline_selection",
                    "narrative",
                  ].map((s) => {
                    const isActive = status.pipeline?.steps?.includes(s);
                    return (
                      <span
                        key={s}
                        className={`text-xs px-2 py-1.5 rounded-md border ${
                          isActive
                            ? "bg-primary/20 border-primary/50 text-primary-foreground font-medium shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            : "bg-muted/50 border-border text-muted-foreground"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}
            
            {status.tick_pipeline_engines && status.tick_pipeline_engines.length > 0 && (
              <section className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur-sm">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Tick Pipeline ({status.tick_pipeline_engines.length} engines)
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
          </div>

          <UniverseTable
            status={status}
            advanceLoadingId={advanceLoadingId}
            onAdvanceClick={(universeId, name) => setAdvanceModal({ universeId, name })}
          />
        </>
      ) : null}

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
