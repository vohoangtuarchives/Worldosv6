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
  onChange: (val: number) => void;
}

const Dial = ({ label, value, min, max, unit, color, onChange }: DialProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135; // -135 to +135 degrees

  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative w-24 h-24">
        {/* Background Track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
            strokeDasharray="188.4"
            strokeDashoffset="62.8" // 2/3 circle
            className="transform rotate-[150deg] origin-center"
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
            className="transform rotate-[150deg] origin-center opacity-40"
          />
        </svg>

        {/* The Dial Knob */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <motion.div 
            className="w-16 h-16 rounded-full bg-void/80 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(255,255,255,0.05)] relative flex items-center justify-center"
            style={{ rotate: rotation }}
          >
            <div className="absolute top-2 w-1 h-3 bg-white/40 rounded-full" />
            <div className="text-[10px] font-mono text-white/20 select-none transform rotate-[45deg]">|||</div>
          </motion.div>
        </motion.div>
        
        {/* Central Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm font-bold text-white/90 tabular-nums">{value.toFixed(1)}</span>
          <span className="text-[8px] font-mono text-white/40 uppercase">{unit}</span>
        </div>
      </div>
      
      <div className="text-center">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
      </div>
    </div>
  );
};

const ObserverDials = () => {
  const [entropy, setEntropy] = useState(0.42);
  const [stability, setStability] = useState(94.5);
  const [density, setDensity] = useState(72);

  return (
    <div className="w-full h-full p-5 bg-card/10 backdrop-blur-2xl rounded-[var(--radius)] border border-white/5 flex flex-col gap-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cosmos shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Observer Intervention Dials</h3>
        </div>
        <div className="text-[9px] font-mono text-white/30">SIG_INT: BYPASSED</div>
      </div>

      <div className="flex-1 flex items-center justify-around py-4">
        <Dial 
          label="Reality Entropy" 
          value={entropy} 
          min={0} 
          max={1} 
          unit="λ" 
          color="hsl(var(--cosmos))"
          onChange={setEntropy}
        />
        <Dial 
          label="Stability Target" 
          value={stability} 
          min={0} 
          max={100} 
          unit="%" 
          color="hsl(var(--accent))"
          onChange={setStability}
        />
        <Dial 
          label="Narrative Density" 
          value={density} 
          min={0} 
          max={100} 
          unit="Hz" 
          color="hsl(var(--nebula))"
          onChange={setDensity}
        />
      </div>

      <div className="flex justify-center gap-3">
        <button className="px-6 py-1.5 bg-cosmos/10 border border-cosmos/30 rounded-full text-[10px] font-bold text-cosmos hover:bg-cosmos/20 transition-all uppercase tracking-widest active:scale-95">
          Execute Nudge
        </button>
        <button className="px-6 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 hover:bg-white/10 transition-all uppercase tracking-widest active:scale-95">
          Reset Matrix
        </button>
      </div>
      
      {/* Background Micro-indicators */}
      <div className="absolute bottom-2 right-4 text-[8px] font-mono text-white/10 flex gap-4">
        <span>VAL_LST: ACTIVE</span>
        <span>AUTH_SIG: VERIFIED</span>
      </div>
    </div>
  );
};

export default ObserverDials;
