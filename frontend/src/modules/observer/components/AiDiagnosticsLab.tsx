'use client';

import React, { useState } from 'react';
import { useAiDiagnosticsMutation } from '../api';
import { ObserverPanel } from './ObserverPanel';
import { 
  Terminal, 
  Send, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Cpu,
  Brain,
  Network,
  Activity,
  ChevronRight
} from 'lucide-react';

/**
 * AiDiagnosticsLab: Phòng thí nghiệm để xác minh kết nối và xác thực AI Driver.
 */
export function AiDiagnosticsLab() {
  const [driver, setDriver] = useState('openrouter');
  const [prompt, setPrompt] = useState('Xác minh các tham số ổn định thực tại.');
  const mutation = useAiDiagnosticsMutation();

  const handleRun = () => {
    mutation.mutate({ driver, prompt });
  };

  const response = mutation.data as any;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8 font-sans">
      {/* Header HUD Style */}
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-6">
         <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 shadow-sm">
               <Brain className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Phòng Thí nghiệm Chẩn đoán Thần kinh</h2>
         </div>
         <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
            <Network className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao diện_Lõi_v1.2</span>
         </div>
      </div>

      <div className="grid gap-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Giao diện Trình điều khiển</label>
            <div className="relative">
              <select 
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5 transition appearance-none cursor-pointer hover:bg-slate-50 shadow-sm"
              >
                <option value="openrouter">OpenRouter (Đồng bộ Từ xa)</option>
                <option value="ollama">Ollama (Biên trung gian Nội bộ)</option>
                <option value="qwen">Qwen (Quan sát Trạng thái Lượng tử)</option>
                <option value="openai">OpenAI (Đường hầm Kế thừa)</option>
                <option value="mock">Nhân Mô phỏng</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trạng thái Thần kinh</label>
            <div className="flex h-[52px] items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 shadow-inner">
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin text-sky-500" />
              ) : mutation.isSuccess ? (
                <ShieldCheck size={16} className="text-emerald-500" />
              ) : mutation.isError ? (
                <AlertCircle size={16} className="text-rose-500" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-200" />
              )}
              <span className={`text-[11px] font-black uppercase tracking-widest ${
                mutation.isPending ? 'text-sky-500 animate-pulse' : 
                mutation.isSuccess ? 'text-emerald-600' : 
                mutation.isError ? 'text-rose-600' : 
                'text-slate-400'
              }`}>
                {mutation.isPending ? 'ĐANG_THIẾT_LẬP_LIÊN_KẾT' : mutation.isSuccess ? 'LIÊN_KẾT_HOẠT_ĐỘNG' : mutation.isError ? 'LỖI_NGUY_CẤP' : 'CHẾ_ĐỘ_CHỜ'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dò tìm Nhân quả (Prompt)</label>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="NHẬP LỆNH CHẨN ĐOÁN..."
              className="h-32 w-full rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 placeholder:text-slate-200 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5 transition resize-none custom-scrollbar shadow-sm"
            />
            <button
              onClick={handleRun}
              disabled={mutation.isPending}
              className="absolute bottom-4 right-4 flex items-center gap-3 px-6 py-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-md shadow-sky-500/20"
            >
              <span className="text-[11px] font-black uppercase tracking-widest">Chạy_Dò_tìm</span>
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        {/* Diagnostic Output Terminal */}
        <div className="relative rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden group shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
          
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Terminal size={14} className="text-sky-500" />
                <span>LUỒNG_DỮ_LIỆU_TRÍ_TUỆ</span>
             </div>
             {response?.meta?.latency && (
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                  <Activity size={12} className="text-sky-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-sky-400">{response.meta.latency}ms</span>
               </div>
             )}
          </div>
          
          <div className="h-72 overflow-y-auto p-6 text-xs leading-relaxed text-sky-400/90 font-mono custom-scrollbar-dark">
            {mutation.isIdle && (
              <span className="text-slate-600 italic font-medium">// SYS: Đang chờ véc-tơ dò tìm ban đầu...</span>
            )}
            {mutation.isPending && (
              <div className="space-y-2">
                <span className="text-sky-500 animate-pulse block font-bold">// SYS: Đang thiết lập đường hầm lượng tử đến {driver.toUpperCase()}...</span>
                <span className="text-slate-600 block font-medium">// SYS: Đang xác thực bắt tay mã hóa...</span>
              </div>
            )}
            {mutation.isError && (
              <div className="space-y-2">
                <span className="text-rose-500 block font-bold">ERROR_CRITICAL: Phát hiện gián đoạn cổng thần kinh.</span>
                <span className="text-slate-600 block font-medium">CODE: 0x88492_LINK_TIMEOUT</span>
              </div>
            )}
            {mutation.isSuccess && (
              <pre className="whitespace-pre-wrap selection:bg-sky-500/20 font-mono">
                {typeof response?.data === 'string' ? response.data : JSON.stringify(response?.data ?? response, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center gap-5 p-6 rounded-2xl border border-slate-100 bg-slate-50/50 border-l-4 border-l-sky-500/50 shadow-sm">
           <div className="p-3 rounded-2xl bg-sky-100/50 text-sky-600 shadow-inner">
              <ShieldCheck size={24} />
           </div>
           <div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Giao thức_An ninh_V5</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 leading-relaxed">
                 Tất cả các giao dịch thần kinh đều được mã hóa đầu cuối và nhật ký thông qua tầng quan sát APEX. Truy cập trái phép sẽ bị truy vết qua dòng nhân quả.
              </p>
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
