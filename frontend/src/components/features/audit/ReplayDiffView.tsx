"use client";

/**
 * components/features/audit/ReplayDiffView.tsx
 *
 * Component hiển thị kết quả replay diff — so sánh original vs. replay.
 * Dùng khi cần phân tích chi tiết divergence của một tick.
 */

import React from 'react';
import type { ReplayResult } from '@/types/simulation';

interface ReplayDiffViewProps {
  result: ReplayResult;
  tick: number;
  seed: number;
}

export function ReplayDiffView({ result, tick, seed }: ReplayDiffViewProps) {
  const isDivergent = !result.ok && result.divergences && result.divergences.length > 0;

  return (
    <div className="replay-diff-view rounded-xl border p-4" style={{
      borderColor: result.ok ? '#065f46' : '#7f1d1d',
      background: result.ok ? 'rgba(6,78,59,0.15)' : 'rgba(127,29,29,0.15)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{result.ok ? '✅' : '⚠️'}</span>
          <h3 className="font-semibold text-white text-sm">
            Replay — Tick {tick}
          </h3>
          <span className="text-gray-500 text-xs font-mono">seed:{seed}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
          result.ok ? 'text-emerald-300 bg-emerald-900/40' : 'text-red-300 bg-red-900/40'
        }`}>
          {result.ok ? 'DETERMINISTIC' : 'NON-DETERMINISTIC'}
        </span>
      </div>

      {/* Error box */}
      {result.error && (
        <div className="text-red-300 text-sm p-2 bg-red-900/20 rounded border border-red-700 mb-3">
          <span className="font-semibold">Error: </span>{result.error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="bg-gray-800 rounded p-2">
          <p className="text-gray-400 mb-1">Effects</p>
          <div className="flex gap-2">
            <span className="text-gray-300">Original: <strong>{result.manifest_effect_count ?? '—'}</strong></span>
            {result.replay_effect_count !== undefined && (
              <>
                <span className="text-gray-600">→</span>
                <span className={result.replay_effect_count === result.manifest_effect_count ? 'text-emerald-300' : 'text-red-300'}>
                  Replay: <strong>{result.replay_effect_count}</strong>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <p className="text-gray-400 mb-1">Events</p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-gray-300">Original: <strong>{result.manifest_events?.length ?? '—'}</strong></span>
            {result.replay_events !== undefined && (
              <>
                <span className="text-gray-600">→</span>
                <span className={result.replay_events.length === (result.manifest_events?.length ?? 0) ? 'text-emerald-300' : 'text-red-300'}>
                  Replay: <strong>{result.replay_events.length}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divergences table */}
      {isDivergent && result.divergences && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
            Divergences ({result.divergences.length})
          </p>
          <div className="space-y-1">
            {result.divergences.map((d, i) => (
              <div key={i} className="flex gap-2 text-xs p-2 bg-gray-900 rounded items-start">
                <span className="text-yellow-400 font-mono min-w-[80px]">{d.field}</span>
                <span className="text-red-300 font-mono flex-1 truncate">{JSON.stringify(d.original)}</span>
                <span className="text-gray-600">→</span>
                <span className="text-emerald-300 font-mono flex-1 truncate">{JSON.stringify(d.replay)}</span>
                {d.note && <span className="text-gray-500 italic">{d.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event type comparison */}
      {result.manifest_events && result.replay_events && (
        <div className="mt-3 border-t border-gray-700 pt-3">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Event Types</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500 mb-1">Original</p>
              <div className="flex flex-wrap gap-1">
                {result.manifest_events.map((e, i) => (
                  <span key={i} className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{e}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Replay</p>
              <div className="flex flex-wrap gap-1">
                {result.replay_events.map((e, i) => (
                  <span key={i} className={`px-1.5 py-0.5 rounded ${result.manifest_events?.includes(e)
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'}`
                  }>{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
