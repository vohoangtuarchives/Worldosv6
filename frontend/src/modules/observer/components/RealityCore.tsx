'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import type { RealityPulse } from '@/modules/observer/contracts';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getVisualState(pulse?: RealityPulse) {
  if (!pulse) {
    return {
      label: 'Đang chờ tín hiệu',
      color: '#0ea5e9',
      accent: 'border-sky-200 bg-sky-50 text-sky-700',
      intensity: 0.2,
      autonomyActive: false,
    };
  }

  if (pulse.entropy >= pulse.entropyThreshold) {
    return {
      label: 'Entropy tới hạn',
      color: '#e11d48',
      accent: 'border-rose-200 bg-rose-50 text-rose-700',
      intensity: 1,
      autonomyActive: true,
    };
  }

  if (pulse.entropy >= 0.8) {
    return {
      label: 'Áp lực đang tăng',
      color: '#f97316',
      accent: 'border-orange-200 bg-orange-50 text-orange-700',
      intensity: 0.7,
      autonomyActive: pulse.mutationHistorySize > 0,
    };
  }

  return {
    label: 'Thực tại ổn định',
    color: '#059669',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    intensity: 0.35,
    autonomyActive: pulse.mutationHistorySize > 0,
  };
}

// === HARDCORE: INSTANCED RENDERING HYPER-OPTIMIZATION ===
// Thay vì dùng Sparkles (điểm ảnh 2D), ta dùng InstancedMesh để render hàng vạn hình khối 3D thụ thụ
// chỉ bằng ĐÚNG 1 DRAW CALL duy nhất trên GPU. Máy yếu vẫn mượt.
function InstancedAnomalySwarm({ count, color, era, entropy, stabilityIndex }: { count: number; color: string; era?: string; entropy?: number; stabilityIndex?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const workerRef = useRef<Worker | null>(null);
  const bufferRef = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    // Khởi tạo Worker từ file vừa tạo (Next.js xử lý URL này tự động)
    const worker = new Worker(new URL('../workers/realityPhysics.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, buffer } = e.data;
      if (type === 'INIT_DONE' || type === 'TICK_DONE') {
        // Nhận lại quyền sở hữu Buffer từ Worker
        bufferRef.current = buffer;
        
        if (meshRef.current && type === 'TICK_DONE') {
          // Gắn ma trận tọa độ vào Mesh và báo React Three Fiber vẽ lại
          const view = new Float32Array(buffer);
          meshRef.current.instanceMatrix.array.set(view);
          meshRef.current.instanceMatrix.needsUpdate = true;
        }
      }
    };

    worker.postMessage({ type: 'INIT', payload: { count } });

    return () => {
      worker.terminate();
    };
  }, [count]);

  useFrame(() => {
    // Nếu có buffer sẵn (tức là Worker đã nhả lại) và lưới đã được khởi tạo
    if (workerRef.current && bufferRef.current && meshRef.current) {
      const buf = bufferRef.current;
      // Tạm "khóa" buffer ở luồng chính để đợi Worker xử lý, tránh gửi đúp
      bufferRef.current = null; 
      
      workerRef.current.postMessage({
        type: 'TICK',
        payload: { buffer: buf, era, entropy, stabilityIndex }
      }, [buf]); // Truyền nguyên gốc Object để tối đa CPU, Zero-Copy Mode
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {['sci_fi', 'cyberpunk', 'modern_war'].includes(era || '') ? (
        <boxGeometry />
      ) : ['paleo', 'paleolithic', 'post_apoc'].includes(era || '') ? (
        <tetrahedronGeometry />
      ) : ['ancient_east', 'fantasy'].includes(era || '') ? (
        <octahedronGeometry />
      ) : (
        <sphereGeometry args={[1, 8, 8]} />
      )}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.2} metalness={0.9} />
    </instancedMesh>
  );
}

function CoreMesh({ intensity, autonomyActive, color, distort, era, particleDensity, pulse }: { intensity: number; autonomyActive: boolean; color: string; distort: number; era: string; particleDensity: number; pulse?: RealityPulse }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);

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
          <MeshDistortMaterial color={color} roughness={0.15} metalness={0.55} distort={distort} speed={1.2 + intensity * 2.8} />
        </mesh>
      </Float>
      <mesh ref={shellRef} scale={1.52} rotation={[0.4, 0.2, 0.4]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={color} transparent opacity={autonomyActive ? 0.22 : 0.1} wireframe />
      </mesh>
      {/* Hyper-Optimized Instanced Rendering */}
      <InstancedAnomalySwarm 
        count={particleDensity * (autonomyActive ? 2 : 1)} 
        color={color} 
        era={era} 
        entropy={pulse?.entropy}
        stabilityIndex={pulse?.stabilityIndex}
      />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={autonomyActive ? 0.8 : 0.35} />
    </>
  );
}

export interface VfxConfig {
  primary_color: string;
  distortion: number;
  particle_density: number;
  atmosphere_filter: string;
}

const eraPresets: Record<string, VfxConfig> = {
  paleolithic: { primary_color: '#ff4500', distortion: 0.8, particle_density: 120, atmosphere_filter: 'mist' },
  medieval: { primary_color: '#ffd700', distortion: 0.15, particle_density: 60, atmosphere_filter: 'sepia' },
  modern: { primary_color: '#0ea5e9', distortion: 0.35, particle_density: 40, atmosphere_filter: 'none' },
  cyberpunk: { primary_color: '#00f3ff', distortion: 0.6, particle_density: 150, atmosphere_filter: 'glitch' },
  genesis: { primary_color: '#8b5cf6', distortion: 0.4, particle_density: 80, atmosphere_filter: 'neon' },
};

export function RealityCore({ pulse, era, vfxConfig }: { pulse?: RealityPulse; era?: string; vfxConfig?: VfxConfig }) {
  // Ưu tiên truyền từ Backend, nếu không dùng Presets cứng
  const vfx = vfxConfig || (era ? (eraPresets[era.toLowerCase()] || eraPresets.genesis) : eraPresets.genesis);
  const visual = getVisualState(pulse);
  
  // Mix visual state (stability) with era state (style)
  const finalColor = pulse && pulse.entropy >= pulse.entropyThreshold ? visual.color : vfx.primary_color;
  const finalDistort = vfx.distortion + (visual.intensity * 0.2);

  const pressure = (pulse && (pulse.entropyThreshold ?? 0) > 0) ? Math.min((pulse.entropy ?? 0) / pulse.entropyThreshold, 1.4) : 0;

  return (
    <div className={`relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-1000 ${
      vfx.atmosphere_filter === 'sepia' || vfx.atmosphere_filter === 'dust' ? 'sepia-[0.25]' : 
      vfx.atmosphere_filter === 'glitch' ? 'hue-rotate-30 saturate-150' : 
      vfx.atmosphere_filter === 'mist' ? 'blur-[0.5px]' :
      vfx.atmosphere_filter === 'aurora' ? 'hue-rotate-180 brightness-110' :
      vfx.atmosphere_filter === 'grain' ? 'contrast-125' :
      ''
    }`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(59,130,246,0.05),transparent_24%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.02),transparent_28%)]" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-900 shadow-inner">
          <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }}>
            <CoreMesh 
              intensity={visual.intensity} 
              autonomyActive={visual.autonomyActive} 
              color={finalColor} 
              distort={finalDistort}
              era={era?.toLowerCase() || 'genesis'}
              particleDensity={vfx.particle_density}
              pulse={pulse}
            />
          </Canvas>
          <motion.div
            className="pointer-events-none absolute inset-x-8 bottom-8 h-4 rounded-full"
            style={{ backgroundColor: `${finalColor}33` }}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.15, 0.6, 0.15], scaleX: [0.8, 1 + Math.min(pressure, 1) * 0.24, 0.8] }}
            transition={{ duration: pulse && pulse.entropy >= pulse.entropyThreshold ? 0.7 : 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-sky-600 font-black">NHỊP ĐẬP THỰC TẠI</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Nhịp đập thực tại</h3>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${visual.accent}`}>{visual.label}</span>
          </div>

          <p className="text-sm leading-7 text-slate-500">
            Entropy, tính ổn định và khối lượng thông tin đang được tổng hợp vào một lõi trực quan duy nhất để bạn có thể thấy khi nào vũ trụ bắt đầu rạn nứt và khi nào quá trình tự tạo (autopoiesis) bắt đầu hoạt động.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Áp lực Entropy" value={pulse ? `${(pressure * 100).toFixed(0)}%` : 'N/A'} />
            <StatTile label="Xác suất sụp đổ" value={pulse ? formatPercent(pulse.collapseProbability) : 'N/A'} />
            <StatTile label="Chỉ số ổn định" value={pulse ? (pulse.stabilityIndex ?? 0).toFixed(2) : 'N/A'} />
            <StatTile label="Khối lượng thông tin" value={pulse ? (pulse.informationalMass ?? 0).toFixed(2) : 'N/A'} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold">
              <span>Luồng tự trị</span>
              <span>{pulse ? `Tick ${pulse.tick.toLocaleString()}` : 'Ngoại tuyến'}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-200">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${visual.color}, rgba(255,255,255,0.9))` }}
                animate={{ width: `${Math.max(8, Math.min(pressure * 100, 100))}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500 italic">
              {pulse?.lastMutationVector ? `Vector sửa chữa cuối: ${pulse.lastMutationVector}` : 'Chưa ghi nhận vector sửa chữa nào.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">{value}</p>
    </div>
  );
}
