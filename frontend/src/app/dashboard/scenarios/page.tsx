'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Zap } from 'lucide-react';

export default function ScenariosPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full p-12">
      <div className="text-center max-w-2xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <GitBranch size={32} className="text-primary" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-foreground uppercase italic px-4 py-2 border-b-2 border-primary/40 inline-block">
            Scenario Manager
          </h1>
          <p className="text-sm font-mono text-muted-foreground/60 uppercase tracking-[0.3em]">
            Branching Logic & Convergence Analysis: Under Observation
          </p>
          <div className="flex items-center justify-center gap-4 pt-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
