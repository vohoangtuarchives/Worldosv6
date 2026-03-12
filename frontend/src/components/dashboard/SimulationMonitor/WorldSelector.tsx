"use client";

import React from "react";
import { Loader2, RefreshCw, Radio } from "lucide-react";

interface WorldSelectorProps {
  worlds: { id: number; name: string }[];
  worldId: number | null;
  setWorldId: (id: number | null) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function WorldSelector({
  worlds,
  worldId,
  setWorldId,
  loading,
  onRefresh,
}: WorldSelectorProps) {
  return (
    <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm mb-6">
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
          onClick={onRefresh}
          disabled={loading}
          className="rounded-md border border-border bg-muted/60 px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Làm mới
        </button>
        <span
          className="flex items-center gap-1.5 text-xs text-emerald-400/90"
          title="Server-Sent Events"
        >
          <Radio className="w-4 h-4" />
          Realtime
        </span>
      </div>
    </section>
  );
}
