'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { VAFCameraMovement } from '@/lib/vaf/types';

// ──────────────────────────────────────────────
// CameraRenderer
// Wraps children with CSS transforms to simulate
// camera movements: zoom, pan, dolly, shake.
// ──────────────────────────────────────────────

interface Props {
  camera: VAFCameraMovement;
  progress: number; // 0-1 within current scene
  children: React.ReactNode;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export default function CameraRenderer({ camera, progress, children }: Props) {
  const { type, speed, easing } = camera;
  const p = clamp01(progress * speed);

  // Shake needs a time-based oscillation
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (type !== 'shake') return;
    startRef.current = performance.now();
    let running = true;

    const tick = () => {
      if (!running) return;
      const t = (performance.now() - startRef.current) / 1000;
      setShakeOffset({
        x: Math.sin(t * 10) * 3,
        y: Math.cos(t * 12) * 2,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [type]);

  const transform = useMemo(() => {
    switch (type) {
      case 'static':
        return 'none';
      case 'zoom_in':
        return `scale(${1 + 0.15 * p})`;
      case 'zoom_out':
        return `scale(${1.15 - 0.15 * p})`;
      case 'pan_left':
        return `translateX(${-(50 * p)}px)`;
      case 'pan_right':
        return `translateX(${50 * p}px)`;
      case 'dolly':
        return `scale(${1 + 0.1 * p}) translateY(${-(20 * p)}px)`;
      case 'shake':
        return `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`;
      default:
        return 'none';
    }
  }, [type, p, shakeOffset]);

  const easingMap: Record<string, string> = {
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    linear: 'linear',
  };

  if (type === 'shake') {
    return (
      <motion.div
        className="absolute inset-0 overflow-hidden"
        animate={{ x: shakeOffset.x, y: shakeOffset.y }}
        transition={{ duration: 0.05, ease: 'linear' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        transform,
        transitionProperty: 'transform',
        transitionDuration: '0.1s',
        transitionTimingFunction: easingMap[easing] ?? 'ease-in-out',
      }}
    >
      {children}
    </div>
  );
}
