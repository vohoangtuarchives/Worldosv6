'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

export default function NarrativePage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full p-12">
      <div className="text-center max-w-2xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-right-brain/5 blur-[100px] rounded-full" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-right-brain/10 border border-right-brain/20 flex items-center justify-center">
            <BookOpen size={32} className="text-right-brain" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-foreground uppercase italic px-4 py-2 border-b-2 border-right-brain/40 inline-block">
            Lore Keeper
          </h1>
          <p className="text-sm font-mono text-muted-foreground/60 uppercase tracking-[0.3em]">
            Historical Records & Prophecy Weaver: Under Observation
          </p>
          <div className="flex items-center justify-center gap-4 pt-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-right-brain/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
