'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiverseResonance } from '@/modules/observer/api';

const VFXOverlay = () => {
  const { data } = useMultiverseResonance();

  const [activeEffect, setActiveEffect] = useState<{ effect_type: string } | null>(null);

  useEffect(() => {
    if (data && data.resonance_pollen && data.resonance_pollen.length > 0) {
      // Find the narrative with the highest distortion or intensity
      const highestDistortion = [...data.resonance_pollen].sort((a, b) => b.distortion - a.distortion)[0];
      
      // Only apply global VFX if distortion is EXTREMELY high (e.g., > 0.8)
      // Otherwise, let the local UniverseCard handle it
      if (highestDistortion && highestDistortion.distortion > 0.8) {
        // Use a timeout to avoid synchronous setState during effect execution
        const triggerTimer = setTimeout(() => {
          setActiveEffect(highestDistortion.vfx);
        }, 0);
        
        // Clear effect after some time to avoid permanent glitch
        const clearTimer = setTimeout(() => {
          setActiveEffect(null);
        }, 3000);
        
        return () => {
          clearTimeout(triggerTimer);
          clearTimeout(clearTimer);
        };
      }
    }
  }, [data]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      <AnimatePresence>
        {activeEffect && (
          <>
            {/* Glitch Effect */}
            {activeEffect.effect_type === 'glitch' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/20 mix-blend-screen"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                  animation: 'glitch 0.2s infinite',
                }}
              />
            )}

            {/* Ripples Effect */}
            {activeEffect.effect_type === 'ripples' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] rounded-full border-[20px] border-primary/30 blur-2xl"
              />
            )}

            {/* Bloom Glow */}
            {activeEffect.effect_type === 'bloom_glow' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-primary/10 blur-3xl"
              />
            )}

            {/* Vortex Effect */}
            {activeEffect.effect_type === 'vortex' && (
              <motion.div
                initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 360, scale: 2, opacity: 0.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.3)_0%,transparent_70%)] blur-2xl"
              />
            )}
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-5px, 5px); }
          40% { transform: translate(-5px, -5px); }
          60% { transform: translate(5px, 5px); }
          80% { transform: translate(5px, -5px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
};

export default VFXOverlay;
