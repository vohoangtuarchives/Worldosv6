'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DialProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
}

const Dial = ({ label, value, min, max, unit, color }: DialProps) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135;

  return (
    <div className="group flex flex-col items-center gap-3">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90 transform">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
            strokeDasharray="188.4"
            strokeDashoffset="62.8"
            className="origin-center rotate-[150deg] transform"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="188.4"
            initial={{ strokeDashoffset: 188.4 }}
            animate={{ strokeDashoffset: 188.4 - (percentage / 100) * 125.6 }}
            className="origin-center rotate-[150deg] transform opacity-40"
          />
        </svg>

        <motion.div className="absolute inset-0 flex cursor-pointer items-center justify-center">
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-void/80 shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(255,255,255,0.05)]"
            style={{ rotate: rotation }}
          >
            <div className="absolute top-2 h-3 w-1 rounded-full bg-white/40" />
            <div className="select-none rotate-[45deg] transform text-[10px] text-white/20">|||</div>
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular-nums text-sm font-bold text-white/90">{value.toFixed(1)}</span>
          <span className="text-[8px] font-mono uppercase text-white/40">{unit}</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary">{label}</span>
      </div>
    </div>
  );
};

const ObserverDials = () => {
  const [entropy] = useState(0.42);
  const [stability] = useState(94.5);
  const [density] = useState(72);
  const [mediaFreq] = useState(88.4);

  return (
    <div className="relative flex h-full w-full flex-col gap-6 rounded-[var(--radius)] border border-white/5 bg-card/10 p-5 backdrop-blur-2xl shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-cosmos shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Observer Intervention Dials</h3>
        </div>
        <div className="text-[9px] font-mono text-white/30">SIG_INT: BYPASSED</div>
      </div>

      <div className="flex flex-1 items-center justify-around py-4">
        <Dial label="Reality Entropy" value={entropy} min={0} max={1} unit="lambda" color="hsl(var(--cosmos))" />
        <Dial label="Stability Target" value={stability} min={0} max={100} unit="%" color="hsl(var(--accent))" />
        <Dial label="Narrative Density" value={density} min={0} max={100} unit="Hz" color="hsl(var(--nebula))" />
        <Dial label="Media Frequency" value={mediaFreq} min={0} max={100} unit="MHz" color="hsl(var(--primary))" />
      </div>

      <div className="flex justify-center gap-3">
        <button className="rounded-full border border-cosmos/30 bg-cosmos/10 px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cosmos transition-all active:scale-95 hover:bg-cosmos/20">
          Execute Nudge
        </button>
        <button className="rounded-full border border-white/10 bg-white/5 px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all active:scale-95 hover:bg-white/10">
          Reset Matrix
        </button>
      </div>

      <div className="absolute right-4 bottom-2 flex gap-4 text-[8px] font-mono text-white/10">
        <span>VAL_LST: ACTIVE</span>
        <span>AUTH_SIG: VERIFIED</span>
      </div>
    </div>
  );
};

export default ObserverDials;
