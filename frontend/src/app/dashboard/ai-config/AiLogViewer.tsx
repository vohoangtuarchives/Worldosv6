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
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ nhật ký AI? Hành động này không thể hoàn tác.')) {
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
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-2.5 text-sky-600 shadow-sm">
            <History size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Nhật ký tương tác AI</h2>
            <p className="text-xs text-slate-500 mt-0.5">Theo dõi luồng I/O của driver và hiệu suất thực thi mô phỏng.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => void fetchLogs()} 
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:border-primary hover:text-primary"
            title="Làm mới"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-[10px] font-heading font-black uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-100 shadow-sm shadow-rose-100"
          >
            <Trash2 size={14} />
            XÓA NHẬT KÝ
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-6 py-5">Thời gian</th>
              <th className="px-6 py-5">Tính năng</th>
              <th className="px-6 py-5">Driver</th>
              <th className="px-6 py-5">Trạng thái</th>
              <th className="px-6 py-5">Độ trễ</th>
              <th className="px-6 py-5 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="group cursor-pointer transition-colors hover:bg-primary/5" onClick={() => setSelectedLog(log)}>
                <td className="px-6 py-4 text-[10px] font-heading font-bold text-slate-500">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4">
                  <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[9px] font-heading font-black uppercase text-slate-600 tracking-wider transition-colors group-hover:bg-white">{log.feature}</span>
                </td>
                <td className="px-6 py-4 font-heading font-black text-[10px] text-primary/80 uppercase tracking-wider">{log.driver}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={`text-[10px] font-heading font-black uppercase tracking-widest ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.status === 'success' ? 'THÀNH CÔNG' : 'THẤT BẠI'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-heading font-black text-slate-600">
                    <Clock size={12} className="text-slate-400" />
                    {log.latency_ms}MS
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-[-4px]">
                    <ChevronRight size={14} className="text-primary" />
                  </div>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center italic text-slate-400 text-xs">
                  Chưa có nhật ký AI nào được ghi lại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <p className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-400">
          Trang {page} / {lastPage}
        </p>
        <div className="flex gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-[10px] font-heading font-black uppercase tracking-widest transition-all hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600"
          >
            Quay lại
          </button>
          <button
            disabled={page === lastPage}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-[10px] font-heading font-black uppercase tracking-widest transition-all hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600"
          >
            Tiếp theo
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-10 py-8">
                <div className="flex items-center gap-5">
                  <div className={`rounded-2xl p-3 shadow-sm ${selectedLog.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    {selectedLog.status === 'success' ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết tương tác AI</h3>
                    <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.25em]">
                      LOG_ID: {selectedLog.id} {"//"} {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-10 overflow-auto p-10 custom-scrollbar-light">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetaCard label="Tính năng" value={selectedLog.feature.toUpperCase()} />
                  <MetaCard label="Driver" value={selectedLog.driver} />
                  <MetaCard label="Độ trễ" value={`${selectedLog.latency_ms} MS`} />
                  <MetaCard label="Trạng thái" value={selectedLog.status.toUpperCase()} status={selectedLog.status} />
                </div>

                {selectedLog.error_message && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                    <p className="mb-3 flex items-center gap-2 text-[10px] font-heading font-black uppercase tracking-widest text-rose-600">
                      <AlertCircle size={14} /> CHI TIẾT NGOẠI LỆ (EXCEPTION)
                    </p>
                    <pre className="whitespace-pre-wrap text-xs font-heading font-bold text-rose-700 leading-relaxed">{selectedLog.error_message}</pre>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                  <DataBlock label="REQUEST_INPUT" icon={<Terminal size={14} />} tone="text-sky-700" data={formatJSON(selectedLog.input)} />
                  <DataBlock label="RESPONSE_OUTPUT" icon={<Code size={14} />} tone="text-emerald-700" data={formatJSON(selectedLog.output)} empty={!selectedLog.output} />
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 px-10 py-8 flex justify-end">
                <button onClick={() => setSelectedLog(null)} className="rounded-2xl bg-primary px-10 py-3.5 text-[10px] font-heading font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                  ĐÓNG GIÁM SÁT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

function MetaCard({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:border-slate-200">
      <p className="mb-2 text-[10px] font-heading font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-lg font-black tracking-tighter font-heading ${status === 'success' ? 'text-emerald-600' : status === 'error' ? 'text-rose-600' : 'text-primary'}`}>{value}</p>
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
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[10px] font-heading font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
        <span className="p-1.5 rounded-lg border border-slate-100 bg-white">{icon}</span> {label}
      </div>
      <div className="max-h-[400px] overflow-auto rounded-3xl border border-slate-100 bg-slate-50 p-8 font-heading font-bold shadow-inner">
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-slate-300">
            <AlertCircle size={32} className="opacity-10" />
            <p className="text-[10px] uppercase font-black tracking-widest italic">PHẢN HỒI TRỐNG</p>
          </div>
        ) : (
          <pre className={`whitespace-pre-wrap text-xs leading-relaxed ${tone}`}>{data}</pre>
        )}
      </div>
    </div>
  );
}

export default AiLogViewer;
