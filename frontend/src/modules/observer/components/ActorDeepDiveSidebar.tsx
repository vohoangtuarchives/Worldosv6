'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Activity, Shield, Info } from 'lucide-react';
import type { ActorDetail } from '@/modules/observer/types';

interface ActorDeepDiveSidebarProps {
  actor: ActorDetail | null;
  onClose: () => void;
}

const ActorDeepDiveSidebar = ({ actor, onClose }: ActorDeepDiveSidebarProps) => {
  if (!actor) return null;

  // Derive Aura properties from actor metrics (or defaults)
  const complexity = (actor.influence / 100) || 0.4;
  const entropy = (actor.metrics?.entropy as number) || 0.3;
  
  // Aura color: Scale from blue (stable) to purple/red (complex/chaotic)
  const auraColor = entropy > 0.7 ? '#f43f5e' : complexity > 0.6 ? '#a855f7' : '#0ea5e9';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end pointer-events-none">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm pointer-events-auto"
        />
        
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-screen bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl pointer-events-auto overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
                  <Brain size={18} />
               </div>
               <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Chi tiết Thực thể</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Mind-state Aura Visualization */}
            <div className="relative flex flex-col items-center justify-center py-10">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.15, 0.3, 0.15],
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: auraColor }}
              />
              
              <div className="relative w-32 h-32 rounded-[2rem] bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                 <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 to-transparent" />
                 <Brain size={48} className="text-sky-600 relative z-10" />
                 
                 {/* Aura Rings */}
                 <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute inset-0 border border-dashed border-sky-300/30 rounded-full scale-150"
                 />
              </div>

              <div className="mt-6 text-center">
                 <h3 className="text-2xl font-black text-slate-900">{actor.name}</h3>
                 <p className="text-sky-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{actor.role}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                     <Zap size={14} className="text-orange-500" />
                     <span className="text-[10px] uppercase font-bold tracking-wider">Ảnh hưởng</span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{actor.influence.toFixed(1)}</p>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                     <Activity size={14} className="text-indigo-500" />
                     <span className="text-[10px] uppercase font-bold tracking-wider">Độ phức tạp</span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{(complexity * 100).toFixed(0)}%</p>
               </div>
            </div>

            {/* Biography & Traits */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-600 flex items-center gap-2">
                  <Info size={14} /> Hồ sơ Tự sự
               </h4>
               <p className="text-[13px] leading-relaxed text-slate-600 italic">
                  {actor.biography || "Thực thể này chưa thể hiện tiểu sử tự sự đáng kể trong luồng nhân quả hiện tại."}
               </p>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-600 flex items-center gap-2">
                  <Shield size={14} /> Định hướng & Quan điểm
               </h4>
               <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <p className="text-sm text-sky-900 font-bold">{actor.alignment}</p>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
                <button className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-sky-200">
                   Tiêu điểm Quan sát
                </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};

export default ActorDeepDiveSidebar;
