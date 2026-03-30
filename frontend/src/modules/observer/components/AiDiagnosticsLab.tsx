'use client';

import React, { useState } from 'react';
import { useAiDiagnosticsMutation } from '../api';
import { 
  Terminal, 
  Send, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Brain,
  Network,
  Activity,
  ChevronRight,
  Search,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AiDiagnosticsLab: Interactive laboratory for AI driver verification and causal probing.
 * Refactored for Scientific Light HUD.
 */
export function AiDiagnosticsLab() {
  const [driver, setDriver] = useState('openrouter');
  const [prompt, setPrompt] = useState('Xác minh các tham số ổn định thực tại và độ lệch nhân quả.');
  const mutation = useAiDiagnosticsMutation();

  const handleRun = () => {
    mutation.mutate({ driver, prompt });
  };

  const response = mutation.data as { data?: string | Record<string, unknown>; meta?: { latency: number } } | null;

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-10">
      {/* Header HUD Style */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-8">
         <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
               <Brain size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Phòng Thí nghiệm Chẩn đoán AI</h2>
               <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest mt-1 italic">Phân tích liên kết thần kinh & xác thực driver</p>
            </div>
         </div>
         <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-heading font-black text-slate-500 uppercase tracking-widest">GIAO DIỆN_LÕI_v6.5</span>
         </div>
      </div>

      <div className="grid gap-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest ml-1">Giao diện Trình điều khiển</label>
            <div className="relative group">
              <select 
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm hover:bg-slate-50 cursor-pointer"
              >
                <option value="openrouter">OpenRouter (Đồng bộ Từ xa)</option>
                <option value="ollama">Ollama (Biên trung gian Nội bộ)</option>
                <option value="qwen">Qwen (Quan sát Trạng thái Lượng tử)</option>
                <option value="openai">OpenAI (Đường hầm Kế thừa)</option>
                <option value="mock">Nhân Mô phỏng</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-primary transition-colors">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái Thần kinh</label>
            <div className={`flex h-[58px] items-center gap-4 rounded-2xl border bg-slate-50/50 px-6 transition-all ${
                mutation.isPending ? 'border-primary/20' : 
                mutation.isSuccess ? 'border-emerald-200 bg-emerald-50/30' : 
                mutation.isError ? 'border-rose-200 bg-rose-50/30' : 
                'border-slate-100'
            }`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mutation.status}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  {mutation.isPending ? (
                    <Loader2 size={18} className="animate-spin text-primary" />
                  ) : mutation.isSuccess ? (
                    <ShieldCheck size={18} className="text-emerald-500" />
                  ) : mutation.isError ? (
                    <AlertCircle size={18} className="text-rose-500" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  )}
                </motion.div>
              </AnimatePresence>
              <span className={`text-[10px] font-heading font-black tracking-widest uppercase ${
                mutation.isPending ? 'text-primary animate-pulse' : 
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
          <label className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest ml-1">Dò tìm Nhân quả (Prompt)</label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="NHẬP LỆNH CHẨN ĐOÁN..."
              className="h-32 w-full rounded-[24px] border border-slate-200 bg-white p-6 text-sm font-medium text-slate-800 placeholder:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none shadow-sm"
            />
            <button
              onClick={handleRun}
              disabled={mutation.isPending}
              className="absolute bottom-5 right-5 group flex items-center gap-3 px-8 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl shadow-primary/20"
            >
              <span className="text-[10px] font-heading font-black uppercase tracking-widest">CHẠY DÒ TÌM</span>
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>

        {/* Diagnostic Output Terminal: Dark contrast element in Light HUD */}
        <div className="relative rounded-[32px] border border-slate-200 bg-[#0a0f18] overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-3">
                <Terminal size={16} className="text-primary" />
                <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.2em]">LUỒNG_DỮ_LIỆU_TRÍ_TUỆ</span>
             </div>
             {response?.meta?.latency && (
                <div className="flex items-center gap-3 px-4 py-1 rounded-full bg-primary/10 border border-primary/20">
                   <Activity size={14} className="text-primary animate-pulse" />
                   <span className="text-[10px] font-heading font-black text-primary italic">{response.meta.latency}MS</span>
                </div>
             )}
          </div>
          
          <div className="h-80 overflow-y-auto p-8 font-heading text-xs leading-relaxed text-slate-300 custom-scrollbar-dark">
            <div className="space-y-4">
                {mutation.isIdle && (
                  <div className="flex items-center gap-3 text-slate-600 italic">
                     <Search size={14} />
                     <span>{'//'} SYS: Đang chờ véc-tơ dò tìm ban đầu để khởi tạo hạt nhân...</span>
                  </div>
                )}
                
                {mutation.isPending && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-primary animate-pulse font-bold">
                        <Loader2 size={14} className="animate-spin" />
                        <span>{'//'} SYS: Đang thiết lập đường hầm lượng tử đến {driver.toUpperCase()}...</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 font-medium pl-6">
                        <ShieldCheck size={14} />
                        <span>{'//'} SYS: Đang xác thực bắt tay mã hóa đa tầng...</span>
                    </div>
                  </div>
                )}
                
                {mutation.isError && (
                  <div className="space-y-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center gap-3 text-rose-500 font-bold">
                        <AlertCircle size={16} />
                        <span>ERROR_CRITICAL: PHÁT HIỆN GIÁN ĐOẠN CỔNG THẦN KINH</span>
                    </div>
                    <p className="text-slate-500 font-mono text-[10px] pl-7 uppercase tracking-widest">EXCEPTION: 0X88492_LINK_TIMEOUT // CORE_REJECTION</p>
                  </div>
                )}
                
                {mutation.isSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-pre-wrap selection:bg-primary/30 font-heading text-[#83aaff]"
                  >
                    {typeof response?.data === 'string' ? response.data : JSON.stringify(response?.data ?? response, null, 2)}
                  </motion.div>
                )}
            </div>
          </div>
        </div>

        {/* Security / Info Footer */}
        <div className="flex flex-col md:flex-row items-center gap-8 p-10 rounded-[32px] border border-slate-100 bg-slate-50/30 border-l-8 border-l-primary/40 shadow-sm">
           <div className="p-4 rounded-2xl bg-white border border-slate-100 text-primary shadow-sm">
              <Lock size={32} />
           </div>
           <div className="space-y-2 text-center md:text-left">
              <p className="text-[10px] font-heading font-black text-slate-900 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                 <ShieldCheck size={14} className="text-emerald-500" /> GIAO THỨC_AN NINH_V6
              </p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl italic">
                 Tất cả các giao dịch thần kinh và lệnh dò tìm nhân quả được mã hóa đầu cuối thông qua Hạt nhân Thực tại. 
                 Hệ thống ghi lại nhật ký kiểm toán cho mọi biến động driver AI.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
