'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Trash2, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Code,
  X,
  RefreshCw,
  Terminal
} from 'lucide-react';

interface AiLog {
  id: number;
  feature: string;
  driver: string;
  input: any;
  output: any;
  latency_ms: number;
  status: string;
  error_message: string;
  created_at: string;
}

const AiLogViewer = () => {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AiLog | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-logs?page=${page}&limit=20`);
      const data = await res.json();
      setLogs(data.data);
      setLastPage(data.last_page);
    } catch (err) {
      console.error('Failed to fetch AI logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ nhật ký AI? Hành động này không thể hoàn tác.')) return;
    try {
      await fetch('/api/ai-logs/clear', { method: 'DELETE' });
      fetchLogs();
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  const formatJSON = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Nhật ký Tương tác AI</h2>
            <p className="text-xs text-muted-foreground">Theo dõi Input/Output và Hiệu năng của các Driver</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={fetchLogs}
            className="p-2 rounded-lg border border-border/40 hover:bg-card transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={14} />
            CLEAR_LOGS
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/20 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Feature</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Latency</th>
              <th className="px-6 py-4 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {logs.map((log) => (
              <tr 
                key={log.id} 
                className="hover:bg-primary/5 transition-colors cursor-pointer group"
                onClick={() => setSelectedLog(log)}
              >
                <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded bg-secondary/30 text-[10px] font-mono uppercase">
                    {log.feature}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                  {log.driver}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                    <span className={log.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Clock size={12} className="text-muted-foreground" />
                    {log.latency_ms}ms
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-lg bg-card border border-border/40 opacity-0 group-hover:opacity-100 transition-all hover:border-primary/50">
                    <ChevronRight size={14} className="text-primary" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                  Chưa có dữ liệu nhật ký nào được ghi lại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground font-mono">Trang {page} / {lastPage}</p>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-lg border border-border/40 disabled:opacity-30 hover:bg-card transition-all text-xs"
          >
            Quay lại
          </button>
          <button 
            disabled={page === lastPage}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-lg border border-border/40 disabled:opacity-30 hover:bg-card transition-all text-xs"
          >
            Tiếp theo
          </button>
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-void/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl h-[80vh] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg ${selectedLog.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {selectedLog.status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                   </div>
                   <div>
                      <h3 className="text-xl font-bold tracking-tight">Chi tiết Tương tác AI</h3>
                      <p className="text-xs text-muted-foreground font-mono">LOG_ID: {selectedLog.id} // {new Date(selectedLog.created_at).toLocaleString()}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-lg hover:bg-card border border-transparent hover:border-border/40 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="p-4 rounded-xl bg-void/40 border border-border/40">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono">Feature</p>
                      <p className="font-bold text-primary">{selectedLog.feature.toUpperCase()}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-void/40 border border-border/40">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono">Driver</p>
                      <p className="font-bold text-primary">{selectedLog.driver}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-void/40 border border-border/40">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono">Latency</p>
                      <p className="font-bold text-primary">{selectedLog.latency_ms} ms</p>
                   </div>
                   <div className="p-4 rounded-xl bg-void/40 border border-border/40">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono">Status</p>
                      <p className={`font-bold ${selectedLog.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{selectedLog.status.toUpperCase()}</p>
                   </div>
                </div>

                {/* Error Box */}
                {selectedLog.error_message && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-[10px] uppercase tracking-widest text-red-500 mb-2 font-mono font-bold flex items-center gap-2">
                      <AlertCircle size={14} /> EXCEPTION_DETAILS
                    </p>
                    <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">{selectedLog.error_message}</pre>
                  </div>
                )}

                {/* Input/Output Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                       <Terminal size={14} /> REQUEST_INPUT
                    </div>
                    <div className="p-6 rounded-xl bg-void/60 border border-border/40 font-mono text-sm overflow-auto max-h-[400px]">
                       <pre className="text-xs text-sky-400">{formatJSON(selectedLog.input)}</pre>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                       <Code size={14} /> RESPONSE_OUTPUT
                    </div>
                    <div className="p-6 rounded-xl bg-void/60 border border-border/40 font-mono text-sm overflow-auto max-h-[400px]">
                       {(!selectedLog.output || (selectedLog.output.text === null) || (selectedLog.output.text === '')) ? (
                         <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground italic">
                            <AlertCircle size={20} className="opacity-20" />
                            <p className="text-[10px]">EMPTY_RESPONSE</p>
                         </div>
                       ) : (
                         <pre className="text-xs text-emerald-400 whitespace-pre-wrap">{formatJSON(selectedLog.output)}</pre>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/30 bg-muted/10 text-right">
                <button 
                   onClick={() => setSelectedLog(null)}
                   className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                >
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

export default AiLogViewer;
