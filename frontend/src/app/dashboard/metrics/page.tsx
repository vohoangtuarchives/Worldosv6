'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function MetricsPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full p-12">
      <div className="text-center max-w-2xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cosmos/5 blur-[100px] rounded-full" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cosmos/10 border border-cosmos/20 flex items-center justify-center">
            <BarChart3 size={32} className="text-cosmos" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-foreground uppercase italic px-4 py-2 border-b-2 border-cosmos/40 inline-block">
            Metrics Hub
          </h1>
          <p className="text-sm font-mono text-muted-foreground/60 uppercase tracking-[0.3em]">
            Multiverse Data Stream & Entropy Diagnostics: Under Observation
          </p>
          <div className="flex items-center justify-center gap-4 pt-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-cosmos/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
