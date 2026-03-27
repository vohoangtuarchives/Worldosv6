'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Play, FastForward, SkipForward, Power } from 'lucide-react';
import { useAdvanceUniverseMutation } from '@/modules/observer/api';
import { toast } from 'sonner';

interface SimulationControlFABProps {
  universeId: string;
}

const SimulationControlFAB = ({ universeId }: SimulationControlFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const advanceMutation = useAdvanceUniverseMutation(universeId);

  const pulseSimulation = async (ticks: number) => {
    try {
      await advanceMutation.mutateAsync(ticks);
      toast.success(`XUNG NHÂN QUẢ THÀNH CÔNG: +${ticks} NHỊP`, {
        icon: <Zap size={14} className="text-sky-500" />,
        className: "bg-white border-sky-200 text-sky-600 font-sans text-xs uppercase font-black shadow-lg",
      });
      setIsOpen(false);
    } catch (error) {
      toast.error('PHÁT HIỆN LỖI TIẾN TRÌNH NHÂN QUẢ', {
        className: "bg-white border-rose-200 text-rose-600 font-sans text-xs uppercase font-black shadow-lg",
      });
    }
  };

  const pulseOptions = [
    { label: 'Xung Delta', ticks: 1, icon: Play, desc: '+1 VÉC-TƠ NHỊP' },
    { label: 'Xung Macro', ticks: 5, icon: FastForward, desc: '+5 VÉC-TƠ NHỊP' },
    { label: 'Bùng nổ Kỳ dị', ticks: 10, icon: SkipForward, desc: '+10 VÉC-TƠ NHỊP' },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 flex flex-col gap-2 p-2 rounded-[2rem] bg-white border border-slate-200 shadow-2xl overflow-hidden min-w-[280px]"
          >
            <div className="px-5 py-4 border-b border-slate-100 mb-2 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Ghi đè Nhân quả Thủ công</span>
               <div className="w-2 h-2 rounded-full bg-sky-500/40 animate-pulse" />
            </div>
            {pulseOptions.map((opt) => (
              <button
                key={opt.ticks}
                onClick={() => pulseSimulation(opt.ticks)}
                disabled={advanceMutation.isPending}
                className="group flex items-center gap-5 px-5 py-4 rounded-2xl hover:bg-slate-50 transition-all text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-sm">
                  <opt.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{opt.label}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-black italic mt-1">{opt.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-sky-500 transition-all" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500
          ${isOpen ? 'bg-sky-500 rotate-[135deg] shadow-sky-500/25' : 'bg-white border-2 border-slate-100 text-sky-600'}
          ${advanceMutation.isPending ? 'animate-pulse' : ''}
          hover:shadow-sky-500/20 active:scale-90
        `}
      >
        <div className="absolute inset-0 rounded-full bg-sky-500/10 animate-ping pointer-events-none" />
        
        {isOpen ? (
           <Power size={32} className="text-white" />
        ) : (
           <Zap size={32} className="text-sky-600" />
        )}
        
        {advanceMutation.isPending && (
           <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="239"
                className="text-sky-500 animate-dash"
              />
           </svg>
        )}
      </motion.button>
    </div>
  );
};

export default SimulationControlFAB;
