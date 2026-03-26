'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Play, FastForward, SkipForward } from 'lucide-react';
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
      toast.success(`Simulation pulsed: +${ticks} ticks`, {
        icon: <Zap size={14} className="text-primary" />,
      });
      setIsOpen(false);
    } catch (error) {
      toast.error('Causal advancement failed');
    }
  };

  const pulseOptions = [
    { label: 'Minor Pulse', ticks: 1, icon: Play, desc: '+1 Tick' },
    { label: 'Standard Pulse', ticks: 5, icon: FastForward, desc: '+5 Ticks' },
    { label: 'Deep Pulse', ticks: 10, icon: SkipForward, desc: '+10 Ticks' },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-2 flex flex-col gap-2 p-2 rounded-[24px] bg-void/60 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {pulseOptions.map((opt) => (
              <button
                key={opt.ticks}
                onClick={() => pulseSimulation(opt.ticks)}
                disabled={advanceMutation.isPending}
                className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <opt.icon size={18} />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{opt.desc}</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-white transition-all" />
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
          relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500
          ${isOpen ? 'bg-primary rotate-45' : 'bg-void border border-primary/40 text-primary'}
          ${advanceMutation.isPending ? 'animate-pulse' : ''}
          glow-primary
        `}
      >
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none" />
        <Zap size={28} fill={isOpen ? "white" : "none"} className={isOpen ? "text-white" : "text-primary"} />
        
        {advanceMutation.isPending && (
           <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="188.5"
                className="text-primary animate-dash"
              />
           </svg>
        )}
      </motion.button>
    </div>
  );
};

export default SimulationControlFAB;
