'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface GaugeCardProps {
  label: string;
  value: string;
  meta?: string;
  icon: LucideIcon;
  tone?: string;
  index?: number;
}

const defaultTone = 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20 text-cyan-200';

export default function GaugeCard({ label, value, meta, icon: Icon, tone = defaultTone, index = 0 }: GaugeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-[28px] border bg-gradient-to-br p-6 ${tone}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300/80">{label}</span>
        <Icon size={18} className="text-white/80" />
      </div>
      <div className="text-4xl font-black tracking-[-0.04em] text-white">{value}</div>
      {meta && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300/70">{meta}</p>}
    </motion.div>
  );
}
