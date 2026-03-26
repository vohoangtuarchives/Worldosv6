'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, Code, History, RefreshCw, Terminal, Trash2, X } from 'lucide-react';

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };

interface AiLog {
  id: number;
  feature: string;
  driver: string;
  input: JsonLike;
  output: JsonLike;
  latency_ms: number;
  status: string;
  error_message: string;
  created_at: string;
}

interface AiLogResponse {
  data?: AiLog[];
  last_page?: number;
}

const AiLogViewer = () => {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AiLog | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-logs?page=${page}&limit=20`);
      const data = (await response.json()) as AiLogResponse;
      setLogs(data.data ?? []);
      setLastPage(data.last_page ?? 1);
    } catch (error) {
      console.error('Failed to fetch AI logs', error);
      setLogs([]);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirm('Ban co chac chan muon xoa toan bo nhat ky AI? Hanh dong nay khong the hoan tac.')) {
      return;
    }

    try {
      await fetch('/api/ai-logs/clear', { method: 'DELETE' });
      await fetchLogs();
    } catch (error) {
      console.error('Failed to clear logs', error);
    }
  };

  const formatJSON = (data: JsonLike) => JSON.stringify(data, null, 2);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-500">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">AI interaction logs</h2>
            <p className="text-xs text-muted-foreground">Track driver I/O and runtime performance.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => void fetchLogs()} className="rounded-lg border border-border/40 p-2 transition-colors hover:bg-card">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-mono text-red-500 transition-all hover:bg-red-500/20"
          >
            <Trash2 size={14} />
            CLEAR_LOGS
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/40 bg-card/20">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Feature</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Latency</th>
              <th className="px-6 py-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {logs.map((log) => (
              <tr key={log.id} className="group cursor-pointer transition-colors hover:bg-primary/5" onClick={() => setSelectedLog(log)}>
                <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4">
                  <span className="rounded bg-secondary/30 px-2 py-1 text-[10px] font-mono uppercase">{log.feature}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{log.driver}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-red-500" />}
                    <span className={log.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>{log.status.toUpperCase()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Clock size={12} className="text-muted-foreground" />
                    {log.latency_ms}ms
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="rounded-lg border border-border/40 bg-card p-2 opacity-0 transition-all hover:border-primary/50 group-hover:opacity-100">
                    <ChevronRight size={14} className="text-primary" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center italic text-muted-foreground">
                  No AI logs have been recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-mono text-muted-foreground">
          Page {page} / {lastPage}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-border/40 px-4 py-2 text-xs transition-all hover:bg-card disabled:opacity-30"
          >
            Previous
          </button>
          <button
            disabled={page === lastPage}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-border/40 px-4 py-2 text-xs transition-all hover:bg-card disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-void/80 backdrop-blur-md" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 p-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-2 ${selectedLog.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {selectedLog.status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">AI interaction details</h3>
                    <p className="text-xs font-mono text-muted-foreground">
                      LOG_ID: {selectedLog.id} {"//"} {new Date(selectedLog.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="rounded-lg border border-transparent p-2 transition-all hover:border-border/40 hover:bg-card">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-auto p-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <MetaCard label="Feature" value={selectedLog.feature.toUpperCase()} />
                  <MetaCard label="Driver" value={selectedLog.driver} />
                  <MetaCard label="Latency" value={`${selectedLog.latency_ms} ms`} />
                  <MetaCard label="Status" value={selectedLog.status.toUpperCase()} status={selectedLog.status} />
                </div>

                {selectedLog.error_message && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="mb-2 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-red-500">
                      <AlertCircle size={14} /> EXCEPTION_DETAILS
                    </p>
                    <pre className="whitespace-pre-wrap text-xs font-mono text-red-400">{selectedLog.error_message}</pre>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <DataBlock label="REQUEST_INPUT" icon={<Terminal size={14} />} tone="text-sky-400" data={formatJSON(selectedLog.input)} />
                  <DataBlock label="RESPONSE_OUTPUT" icon={<Code size={14} />} tone="text-emerald-400" data={formatJSON(selectedLog.output)} empty={!selectedLog.output} />
                </div>
              </div>

              <div className="border-t border-border/30 bg-muted/10 p-6 text-right">
                <button onClick={() => setSelectedLog(null)} className="rounded-lg bg-primary px-6 py-2 text-xs font-bold text-primary-foreground">
                  CLOSE_MONITOR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function MetaCard({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-void/40 p-4">
      <p className="mb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-bold ${status === 'success' ? 'text-emerald-500' : status === 'error' ? 'text-red-500' : 'text-primary'}`}>{value}</p>
    </div>
  );
}

function DataBlock({
  label,
  icon,
  tone,
  data,
  empty = false,
}: {
  label: string;
  icon: React.ReactNode;
  tone: string;
  data: string;
  empty?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="max-h-[400px] overflow-auto rounded-xl border border-border/40 bg-void/60 p-6 font-mono text-sm">
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 italic text-muted-foreground">
            <AlertCircle size={20} className="opacity-20" />
            <p className="text-[10px]">EMPTY_RESPONSE</p>
          </div>
        ) : (
          <pre className={`whitespace-pre-wrap text-xs ${tone}`}>{data}</pre>
        )}
      </div>
    </div>
  );
}

export default AiLogViewer;
