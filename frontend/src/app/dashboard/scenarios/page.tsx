'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

export default function ScenariosPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full min-h-[60vh] p-12">
      <div className="text-center max-w-2xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 space-y-8"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-sm">
            <GitBranch size={40} className="text-sky-700" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-heading font-black tracking-tighter text-slate-900 uppercase italic px-8 py-3 border-b-4 border-sky-400/40 inline-block">
              Quản lý Kịch bản
            </h1>
            <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.4em] max-w-md mx-auto leading-loose">
              Logic Phân nhánh & Phân tích Hội tụ: Đang Giám sát
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pt-12">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i} 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
                className="w-2.5 h-2.5 rounded-full bg-sky-400" 
              />
            ))}
          </div>

          <div className="pt-8 text-[9px] font-heading font-bold text-slate-300 uppercase tracking-widest animate-pulse">
            Đang khởi tạo các luồng nhân quả thay thế...
          </div>
        </motion.div>
      </div>
    </div>
  );
}
