'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

// ──────────────────────────────────────────────
// NarrationOverlay
// Typewriter narration text at bottom of screen.
// Re-triggers animation when text changes.
// ──────────────────────────────────────────────

interface Props {
  text: string;
  isPlaying: boolean;
}

// ── Container variants ─────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      staggerChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.3 },
  },
};

// ── Character variants (typewriter) ────────────

const charVariants = {
  hidden: { opacity: 0, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.08 },
  },
};

// ── Helpers ────────────────────────────────────

function splitIntoChars(str: string): string[] {
  return Array.from(str);
}

// ── Main component ─────────────────────────────

export default function NarrationOverlay({ text, isPlaying }: Props) {
  const chars = useMemo(() => splitIntoChars(text), [text]);

  if (!text) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none z-20 pb-6 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          className="max-w-3xl w-full bg-black/60 backdrop-blur-md rounded-t-2xl px-8 py-6 pointer-events-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {isPlaying ? (
            <p className="text-white/90 text-lg leading-relaxed font-serif">
              {chars.map((char, i) => (
                <motion.span
                  key={`${i}-${char}`}
                  variants={charVariants}
                >
                  {char}
                </motion.span>
              ))}
            </p>
          ) : (
            <p className="text-white/90 text-lg leading-relaxed font-serif">
              {text}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
