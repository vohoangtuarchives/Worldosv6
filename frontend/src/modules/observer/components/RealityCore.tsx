'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls, Sparkles } from '@react-three/drei';
import { motion } from 'framer-motion';
import type { Mesh } from 'three';
import type { RealityPulse } from '@/modules/observer/contracts';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getVisualState(pulse?: RealityPulse) {
  if (!pulse) {
    return {
      label: 'Awaiting signal',
      color: '#7dd3fc',
      accent: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
      intensity: 0.2,
      autonomyActive: false,
    };
  }

  if (pulse.entropy >= pulse.entropyThreshold) {
    return {
      label: 'Critical entropy',
      color: '#fb7185',
      accent: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
      intensity: 1,
      autonomyActive: true,
    };
  }

  if (pulse.entropy >= 0.8) {
    return {
      label: 'Pressure rising',
      color: '#f97316',
      accent: 'border-orange-400/30 bg-orange-500/10 text-orange-100',
      intensity: 0.7,
      autonomyActive: pulse.mutationHistorySize > 0,
    };
  }

  return {
    label: 'Stable reality',
    color: '#34d399',
    accent: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
    intensity: 0.35,
    autonomyActive: pulse.mutationHistorySize > 0,
  };
}

function CoreMesh({ intensity, autonomyActive, color }: { intensity: number; autonomyActive: boolean; color: string }) {
  const meshRef = useRef<Mesh>(null);
  const shellRef = useRef<Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.18;
      meshRef.current.rotation.y = time * (0.35 + intensity * 0.5);
      meshRef.current.scale.setScalar(1 + Math.sin(time * (1.6 + intensity * 3)) * 0.04 * (1 + intensity));
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = -time * 0.12;
      shellRef.current.rotation.z = time * 0.08;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6 + intensity * 0.5} />
      <directionalLight position={[2, 2, 3]} intensity={2.2} color={color} />
      <pointLight position={[-3, -2, -1]} intensity={1.8} color="#f8fafc" />
      <Float speed={2 + intensity * 2} rotationIntensity={0.5 + intensity} floatIntensity={1.2 + intensity}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.15, 1]} />
          <MeshDistortMaterial color={color} roughness={0.15} metalness={0.55} distort={0.25 + intensity * 0.5} speed={1.2 + intensity * 2.8} />
        </mesh>
      </Float>
      <mesh ref={shellRef} scale={1.52} rotation={[0.4, 0.2, 0.4]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={color} transparent opacity={autonomyActive ? 0.22 : 0.1} wireframe />
      </mesh>
      <Sparkles count={autonomyActive ? 110 : 48} scale={autonomyActive ? 4.2 : 3.1} size={autonomyActive ? 5 : 3} speed={autonomyActive ? 1.5 : 0.45} color={autonomyActive ? '#fde68a' : color} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={autonomyActive ? 0.8 : 0.35} />
    </>
  );
}

export function RealityCore({ pulse }: { pulse?: RealityPulse }) {
  const visual = getVisualState(pulse);
  const pressure = pulse && pulse.entropyThreshold > 0 ? Math.min(pulse.entropy / pulse.entropyThreshold, 1.4) : 0;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.12),transparent_28%)]" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-white/8 bg-black/30">
          <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }}>
            <CoreMesh intensity={visual.intensity} autonomyActive={visual.autonomyActive} color={visual.color} />
          </Canvas>
          <motion.div
            className="pointer-events-none absolute inset-x-8 bottom-8 h-4 rounded-full bg-white/10"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.25, 0.9, 0.25], scaleX: [0.8, 1 + Math.min(pressure, 1) * 0.24, 0.8] }}
            transition={{ duration: pulse && pulse.entropy >= pulse.entropyThreshold ? 0.7 : 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Reality Pulse</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Nh?p d?p th?c t?i</h3>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${visual.accent}`}>{visual.label}</span>
          </div>

          <p className="text-sm leading-7 text-muted-foreground">
            Entropy, stability v� informational mass dang du?c gom v? m?t l�i tr?c quan duy nh?t d? b?n th?y khi n�o vu tr? b?t d?u r?n n?t v� khi n�o autopoiesis d� v�o gu?ng.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Entropy pressure" value={pulse ? `${(pressure * 100).toFixed(0)}%` : 'N/A'} />
            <StatTile label="Collapse probability" value={pulse ? formatPercent(pulse.collapseProbability) : 'N/A'} />
            <StatTile label="Stability index" value={pulse ? pulse.stabilityIndex.toFixed(2) : 'N/A'} />
            <StatTile label="Informational mass" value={pulse ? pulse.informationalMass.toFixed(2) : 'N/A'} />
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>Autonomy stream</span>
              <span>{pulse ? `Tick ${pulse.tick.toLocaleString()}` : 'Offline'}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${visual.color}, rgba(255,255,255,0.9))` }}
                animate={{ width: `${Math.max(8, Math.min(pressure * 100, 100))}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {pulse?.lastMutationVector ? `Last repair vector: ${pulse.lastMutationVector}` : 'No repair vector has been recorded yet.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
