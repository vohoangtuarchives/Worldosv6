"use client";

import React from "react";

interface MotivationProfile {
  creation: number;
  destruction: number;
  order: number;
  chaos: number;
  self_preservation: number;
  altruism: number;
  physical: number;
  metaphysical: number;
}

interface MotivationRadarProps {
  profile: MotivationProfile;
  size?: number;
  color?: string;
  labelSize?: number;
}

export const MotivationRadar: React.FC<MotivationRadarProps> = ({
  profile,
  size = 300,
  color = "#3b82f6",
  labelSize = 10,
}) => {
  const axes = [
    { key: "creation", label: "Creation" },
    { key: "destruction", label: "Destruction" },
    { key: "order", label: "Order" },
    { key: "chaos", label: "Chaos" },
    { key: "self_preservation", label: "Preservation" },
    { key: "altruism", label: "Altruism" },
    { key: "physical", label: "Physical" },
    { key: "metaphysical", label: "Meta" },
  ];

  const center = size / 2;
  const radius = (size / 2) * 0.7; // Leave space for labels

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const r = radius * value;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = axes.map((axis, i) => getPoint(i, (profile as any)[axis.key] || 0));
  const pointsString = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Grid */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
          <polygon
            key={i}
            points={axes
              .map((_, idx) => {
                const p = getPoint(idx, r);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {axes.map((_, i) => {
          const p = getPoint(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Polygon */}
        <polygon
          points={pointsString}
          fill={`${color}33`} // 20% opacity
          stroke={color}
          strokeWidth="2"
        />

        {/* Labels */}
        {axes.map((axis, i) => {
          const p = getPoint(i, 1.15); // Push labels further out
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              fill="rgba(255,255,255,0.6)"
              fontSize={labelSize}
              textAnchor="middle"
              dominantBaseline="middle"
              className="uppercase tracking-tighter"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
