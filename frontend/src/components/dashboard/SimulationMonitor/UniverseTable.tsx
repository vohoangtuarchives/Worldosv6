"use client";

import React from "react";
import type { WorldSimulationStatusResponse, UniverseSimulationItem } from "@/types/simulation";

interface UniverseTableProps {
  status: WorldSimulationStatusResponse;
  advanceLoadingId: number | null;
  onAdvanceClick: (universeId: number, name: string) => void;
}

export function UniverseTable({
  status,
  advanceLoadingId,
  onAdvanceClick,
}: UniverseTableProps) {
  return (
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
              <th className="py-2 pr-2">Ecology</th>
              <th className="py-2 pr-2">Timeline Score</th>
              <th className="py-2 pr-2">Attractors</th>
              <th className="py-2 pr-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {status.universes.map((u) => (
              <UniverseRow
                key={u.id}
                u={u}
                onAdvance={() => onAdvanceClick(u.id, u.name)}
                advanceLoading={advanceLoadingId === u.id}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
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
  const timelineScore = u.timeline_score ?? null;

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
      <td className="py-2 pr-2 font-mono text-foreground">
        {timelineScore != null ? timelineScore.toFixed(2) : "—"}
      </td>
      <td className="py-2 pr-2">
        {u.latest_snapshot?.ecology ? (
          <div className="flex flex-col text-[10px] leading-tight text-muted-foreground">
            <span className="font-semibold text-emerald-400 capitalize">{u.latest_snapshot.ecology.biome || '—'}</span>
            <span>Stress: {(u.latest_snapshot.ecology.resource_stress || 0).toFixed(2)}</span>
          </div>
        ) : "—"}
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
