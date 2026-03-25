'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Chronicle {
  from_tick: number;
  content: string;
  type?: 'event' | 'observation' | 'meta';
}

interface ChronicleStreamProps {
  chronicles: Chronicle[];
}

const TypewriterText = ({ text }: { text: string }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.02 }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

const ChronicleStream = ({ chronicles }: ChronicleStreamProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [chronicles]);

  return (
    <div className="flex flex-col gap-4 p-5 bg-card/20 backdrop-blur-xl rounded-[var(--radius)] border border-border/40 h-full overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] relative">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h4 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Chronicle Stream</h4>
        </div>
        <div className="flex gap-2">
          <div className="px-2 py-0.5 rounded-sm bg-primary/5 border border-primary/20 text-[8px] font-mono text-primary/70">
            DENSITY: HIGH
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar mask-fade-bottom"
      >
        <AnimatePresence initial={false}>
          {chronicles.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-8 h-8 rounded-full border border-primary/20 border-t-primary animate-spin mb-4" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                Awaiting Narrative Pulse...
              </div>
            </motion.div>
          ) : (
            chronicles.map((c, i) => (
              <motion.div 
                key={`${c.from_tick}-${i}`}
                initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                className="group relative"
              >
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="text-[9px] font-mono text-primary/60 font-bold">
                    [{String(c.from_tick).padStart(6, '0')}]
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                  <span className="text-[8px] font-mono text-muted-foreground/40 group-hover:text-primary/40 transition-colors uppercase">
                    Obsv_Node_01
                  </span>
                </div>
                
                <div className="pl-3 border-l-2 border-primary/10 group-hover:border-primary/40 transition-colors">
                  <p className="text-[13px] text-foreground/85 leading-relaxed font-narrative italic tracking-tight">
                    <TypewriterText text={c.content} />
                  </p>
                </div>

                {/* Micro-interaction: glitch effect on hover could go here */}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-3 flex items-center justify-between text-[8px] font-mono text-muted-foreground/50 border-t border-border/10">
        <span>STRM_ID: CX-9912</span>
        <span className="animate-pulse">RECORDING_ENABLED</span>
      </div>
    </div>
  );
};

export default ChronicleStream;
