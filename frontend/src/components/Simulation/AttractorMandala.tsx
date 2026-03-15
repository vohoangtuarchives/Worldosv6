"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * WorldOS V7: Attractor Mandala
 * Visualization 8 trục trường lực (Bio-to-Spirit)
 * Sử dụng React 19 + Framer Motion
 */

interface AttractorFields {
  survival: number;
  reproduction: number;
  wealth: number;
  power: number;
  knowledge: number;
  meaning: number;
  status: number;
  belonging: number;
}

interface AttractorMandalaProps {
  fields: AttractorFields;
  size?: number;
  className?: string;
}

const FIELD_CONFIG = [
  { key: "survival", label: "Sinh tồn", color: "#ef4444" }, // Red
  { key: "power", label: "Quyền lực", color: "#f97316" }, // Orange
  { key: "wealth", label: "Của cải", color: "#eab308" }, // Yellow
  { key: "status", label: "Địa vị", color: "#22c55e" }, // Green
  { key: "knowledge", label: "Tri thức", color: "#06b6d4" }, // Cyan
  { key: "meaning", label: "Ý nghĩa", color: "#3b82f6" }, // Blue
  { key: "belonging", label: "Thuộc về", color: "#a855f7" }, // Purple
  { key: "reproduction", label: "Duy trì", color: "#ec4899" }, // Pink
];

export function AttractorMandala({ 
  fields, 
  size = 400,
  className = "" 
}: AttractorMandalaProps) {
  const center = size / 2;
  const radius = size * 0.4;

  // Tính toán tọa độ cho 8 trục
  const points = useMemo(() => {
    return FIELD_CONFIG.map((conf, i) => {
      const angle = (i * 360) / 8 - 90; // Rotate to start from top
      const radians = (angle * Math.PI) / 180;
      const value = fields[conf.key as keyof AttractorFields] ?? 0.1;
      const r = radius * Math.max(0.1, Math.min(1.0, value));
      
      return {
        x: center + r * Math.cos(radians),
        y: center + r * Math.sin(radians),
        labelX: center + (radius + 25) * Math.cos(radians),
        labelY: center + (radius + 25) * Math.sin(radians),
        conf
      };
    });
  }, [fields, center, radius]);

  // Chuỗi tọa độ cho đa giác (Polygon path)
  const polygonPath = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <defs>
          <radialGradient id="mandala-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
        </defs>

        {/* Cấu trúc nền Mandala (Lưới Sacred Geometry) */}
        <circle cx={center} cy={center} r={radius} fill="url(#mandala-glow)" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
        {[0.25, 0.5, 0.75, 1].map((step) => (
          <circle 
            key={step} 
            cx={center} 
            cy={center} 
            r={radius * step} 
            fill="none" 
            stroke="rgba(148, 163, 184, 0.05)" 
            strokeDasharray="4 4"
          />
        ))}

        {/* Trục kẻ ngang dọc */}
        {points.map((p, i) => (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={center + (radius * Math.cos(((i * 360) / 8 - 90) * Math.PI / 180))}
            y2={center + (radius * Math.sin(((i * 360) / 8 - 90) * Math.PI / 180))}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Vùng ảnh hưởng (Polygon) */}
        <motion.polygon
          points={polygonPath}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="2"
          initial={false}
          animate={{ points: polygonPath }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        />

        {/* Các điểm dữ liệu */}
        {points.map((p, i) => (
          <g key={`point-${i}`}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill={p.conf.color}
              initial={false}
              animate={{ cx: p.x, cy: p.y }}
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            />
            <text
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-medium uppercase tracking-widest"
              style={{ fontSize: '8px' }}
            >
              {p.conf.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Center Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
      
      <div className="mt-4 grid grid-cols-4 gap-4">
        {FIELD_CONFIG.map(conf => (
          <div key={conf.key} className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500">{conf.label}</span>
            <span className="text-xs font-mono text-slate-200">
              {(fields[conf.key as keyof AttractorFields] ?? 0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
