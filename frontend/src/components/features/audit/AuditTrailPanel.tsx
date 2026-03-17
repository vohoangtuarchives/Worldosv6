"use client";

/**
 * components/features/audit/AuditTrailPanel.tsx
 *
 * Phase 8: UI hiển thị Audit Trail — danh sách tick manifests
 * của một universe với khả năng trigger deterministic replay.
 */

import React, { useEffect, useState } from 'react';
import { useAuditTrail } from '@/hooks/useAuditTrail';
import type { TickManifest } from '@/types/simulation';

interface AuditTrailPanelProps {
  universeId: number;
}

export function AuditTrailPanel({ universeId }: AuditTrailPanelProps) {
  const {
    manifests, selectedManifest, replayResult,
    isLoading, isReplaying, error,
    fetchManifests, fetchManifest, triggerReplay, clearResult,
  } = useAuditTrail();

  const [expandedTick, setExpandedTick] = useState<number | null>(null);

  useEffect(() => {
    fetchManifests(universeId, 30);
  }, [universeId, fetchManifests]);

  const handleRowClick = async (manifest: TickManifest) => {
    if (expandedTick === manifest.tick) {
      setExpandedTick(null);
      clearResult();
      return;
    }
    setExpandedTick(manifest.tick);
    await fetchManifest(universeId, manifest.tick);
  };

  const handleReplay = async (tick: number) => {
    await triggerReplay(universeId, tick);
  };

  const statusColor = (ok: boolean | undefined) => {
    if (ok === undefined) return 'text-gray-400';
    return ok ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="audit-trail-panel bg-gray-900 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-purple-400">⏺</span>
          Audit Trail
        </h2>
        <button
          onClick={() => fetchManifests(universeId, 30)}
          disabled={isLoading}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-3 p-2 bg-red-900/20 rounded border border-red-800">
          {error}
        </div>
      )}

      {manifests.length === 0 && !isLoading && (
        <div className="text-gray-500 text-sm text-center py-8">
          Chưa có dữ liệu audit trail cho universe này.
        </div>
      )}

      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {manifests.map((m) => (
          <div key={m.tick} className="rounded-lg border border-gray-700 overflow-hidden">
            {/* Row header */}
            <button
              onClick={() => handleRowClick(m)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-purple-400 font-mono text-sm w-20">Tick {m.tick}</span>
                <span className="text-gray-400 text-xs font-mono">seed {m.seed}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{m.engines_ran?.length ?? 0} engines</span>
                <span>{m.effects?.length ?? 0} effects</span>
                <span>{m.events?.length ?? 0} events</span>
                <span className="text-gray-600">{m.elapsed_ms?.toFixed(1)}ms</span>
                <span className={expandedTick === m.tick ? 'rotate-180' : ''}>▼</span>
              </div>
            </button>

            {/* Expanded detail */}
            {expandedTick === m.tick && (
              <div className="px-3 pb-3 border-t border-gray-700 bg-gray-800/50">
                {isLoading && !selectedManifest && (
                  <div className="text-gray-500 text-xs py-2">Loading detail...</div>
                )}
                {selectedManifest && selectedManifest.tick === m.tick && (
                  <div className="mt-2 space-y-3">
                    {/* Engines */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Engines Ran</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedManifest.engines_ran?.map((e) => (
                          <span key={e} className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">
                            {e}
                          </span>
                        ))}
                        {selectedManifest.engines_skipped?.map((e) => (
                          <span key={e} className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded line-through">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Effects / Events summary */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold uppercase tracking-wide">Effects</p>
                        <p className="text-white font-mono">{selectedManifest.effects?.length ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold uppercase tracking-wide">Events</p>
                        <p className="text-white font-mono">{selectedManifest.events?.length ?? 0}</p>
                      </div>
                    </div>

                    {/* Replay button */}
                    <button
                      onClick={() => handleReplay(m.tick)}
                      disabled={isReplaying}
                      className="text-xs px-3 py-1.5 rounded bg-purple-700 hover:bg-purple-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isReplaying ? '⟳ Replaying...' : '▶ Trigger Replay'}
                    </button>

                    {/* Replay result */}
                    {replayResult && (
                      <div className={`p-2 rounded text-xs border ${replayResult.ok ? 'border-emerald-700 bg-emerald-900/20' : 'border-red-700 bg-red-900/20'}`}>
                        <p className={`font-semibold ${statusColor(replayResult.ok)}`}>
                          {replayResult.ok ? '✓ Deterministic — No divergences' : '⚠ Divergences detected'}
                        </p>
                        {replayResult.error && (
                          <p className="text-red-300 mt-1">{replayResult.error}</p>
                        )}
                        {replayResult.divergences && replayResult.divergences.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {replayResult.divergences.map((d, i) => (
                              <div key={i} className="flex gap-2 text-xs">
                                <span className="text-yellow-400 font-mono">{d.field}:</span>
                                <span className="text-red-300">was {JSON.stringify(d.original)}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-emerald-300">now {JSON.stringify(d.replay)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
