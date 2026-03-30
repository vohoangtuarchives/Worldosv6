'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Play, FastForward, SkipForward, Power, Activity } from 'lucide-react';
import { useAdvanceUniverseMutation } from '@/modules/observer/api';
import { toast } from 'sonner';

interface SimulationControlFABProps {
  universeId: string;
}

/**
 * SimulationControlFAB: Global floating control for simulation tick management.
 * Refactored for Scientific Light HUD.
 */
const SimulationControlFAB = ({ universeId }: SimulationControlFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const advanceMutation = useAdvanceUniverseMutation(universeId);

  const pulseSimulation = async (ticks: number) => {
    try {
      await advanceMutation.mutateAsync(ticks);
      toast.success(`XUNG NHÂN QUẢ THÀNH CÔNG: +${ticks} NHỊP`, {
        icon: <Zap size={14} className="text-primary" />,
        className: "bg-white border-primary/20 text-primary font-heading text-[10px] uppercase font-black shadow-2xl rounded-2xl",
      });
      setIsOpen(false);
    } catch {
      toast.error('PHÁT HIỆN LỖI TIẾN TRÌNH NHÂN QUẢ', {
        className: "bg-white border-rose-200 text-rose-600 font-heading text-[10px] uppercase font-black shadow-2xl rounded-2xl",
      });
    }
  };

  const pulseOptions = [
    { label: 'Xung Delta', ticks: 1, icon: Play, desc: '+1 VÉC-TƠ NHỊP' },
    { label: 'Xung Macro', ticks: 5, icon: FastForward, desc: '+5 VÉC-TƠ NHỊP' },
    { label: 'Bùng nổ Kỳ dị', ticks: 10, icon: SkipForward, desc: '+10 VÉC-TƠ NHỊP' },
  ];

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
            className="mb-6 flex flex-col gap-2 p-3 rounded-[32px] bg-white border border-slate-200 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden min-w-[320px]"
          >
            <div className="px-6 py-5 border-b border-slate-50 mb-2 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Activity size={14} className="text-primary animate-pulse" />
                  <span className="text-[10px] font-heading font-black uppercase tracking-[0.3em] text-slate-400">Ghi đè Nhân quả Thủ công</span>
               </div>
               <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            </div>
            
            {pulseOptions.map((opt, idx) => (
              <motion.button
                key={opt.ticks}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => pulseSimulation(opt.ticks)}
                disabled={advanceMutation.isPending}
                className="group flex items-center gap-5 px-6 py-5 rounded-[24px] hover:bg-slate-50 transition-all text-left disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                  <opt.icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-heading font-black text-slate-900 uppercase tracking-widest">{opt.label}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-heading font-black italic mt-1 tracking-wider opacity-60">{opt.desc}</p>
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(7,89,133,0.3)] transition-all duration-500
          ${isOpen ? 'bg-primary rotate-[135deg] shadow-primary/40' : 'bg-white border border-slate-100 text-primary'}
          ${advanceMutation.isPending ? 'animate-pulse' : ''}
          active:scale-90 overflow-hidden
        `}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
        <div className={`absolute inset-0 rounded-full animate-ping pointer-events-none transition-opacity ${isOpen ? 'bg-white/10' : 'bg-primary/10 opacity-40'}`} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
          >
            {isOpen ? (
               <Power size={36} className="text-white" />
            ) : (
               <Zap size={36} className="text-primary" />
            )}
          </motion.div>
        </AnimatePresence>
        
        {advanceMutation.isPending && (
           <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                 cx="48"
                 cy="48"
                 r="46"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="3"
                 strokeDasharray="289"
                 className="text-primary animate-dash"
              />
           </svg>
        )}
      </motion.button>
    </div>
  );
};

export default SimulationControlFAB;
