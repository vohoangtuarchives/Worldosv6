'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '@/store/useSimulationStore';

interface RegionData {
  id: string;
  name: string;
  path: string;
  description: string;
  detailedImage: string;
  stats: {
    pop: string;
    stability: string;
    sci: number;
  };
}

const regions: RegionData[] = [
  {
    id: 'north_peaks',
    name: 'Frostpeak Highlands',
    path: 'M 100 100 L 400 50 L 550 150 L 450 300 L 200 250 Z',
    description: 'Ancient mountain ranges frozen in eternal winter. Home to high-SCI temporal anomalies.',
    detailedImage: '/maps/frostpeak_detailed.png',
    stats: { pop: '1.2M', stability: 'Stable', sci: 0.92 }
  },
  {
    id: 'central_basin',
    name: 'The Gilded Basin',
    path: 'M 400 300 L 700 250 L 900 400 L 750 600 L 500 550 Z',
    description: 'The fertile heart of the continent, where reality convergence is most frequent.',
    detailedImage: '/maps/gilded_basin_detailed.png',
    stats: { pop: '14.5M', stability: 'Fluctuating', sci: 0.45 }
  },
  {
    id: 'southern_isles',
    name: 'Sunken Archipelago',
    path: 'M 100 500 L 300 450 L 400 700 L 200 850 L 50 750 Z',
    description: 'Fragmented lands drifting in the sapphire ocean. High density of maritime entities.',
    detailedImage: '/maps/sunken_archipelago_detailed.png',
    stats: { pop: '3.8M', stability: 'Resonant', sci: 0.78 }
  },
  {
    id: 'eastern_void',
    name: 'The Ashara Void',
    path: 'M 750 600 L 950 550 L 980 900 L 700 950 L 600 750 Z',
    description: 'A desolate wasteland where the rules of reality are fraying at the edges.',
    detailedImage: '/maps/ashara_void_detailed.png',
    stats: { pop: '0.1M', stability: 'Critical', sci: 0.12 }
  }
];

const AncientLivingMap = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [isAxiomVision, setIsAxiomVision] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const { chronicles, entities, universes } = useSimulationStore();

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    const handleLocate = (e: any) => {
      const region = regions.find(r => r.id === e.detail.regionId);
      if (region) handleRegionClick(region);
    };
    window.addEventListener('map-locate', handleLocate);
    return () => window.removeEventListener('map-locate', handleLocate);
  }, []);

  const stability = universes[0]?.stability ?? 0.8;

  const handleRegionClick = (region: RegionData) => {
    if (selectedRegion) return;
    setIsZooming(true);
    setTimeout(() => {
      setSelectedRegion(region);
      setIsZooming(false);
    }, 800);
  };

  const handleBack = () => {
    setIsZooming(true);
    setTimeout(() => {
      setSelectedRegion(null);
      setIsZooming(false);
    }, 800);
  };

  // Generate deterministic "Pins" from chronicles
  const pins = useMemo(() => {
    return chronicles.slice(-5).map((c, i) => {
      // Map to a region or random spot for demo
      const region = regions[i % regions.length];
      return {
        id: `pin-${c.id}`,
        name: c.title,
        x: 200 + (Math.random() * 600),
        y: 200 + (Math.random() * 600),
        content: c.content
      };
    });
  }, [chronicles]);

  // Map entities from store (or use local sim for demo)
  const entityDots = useMemo(() => {
    const list = entities.length > 0 ? entities : Array.from({ length: 40 }, (_, i) => ({ 
      id: `e-${i}`, 
      weight: Math.random(),
      name: `Entity_${i.toString().padStart(3, '0')}`,
      vocation: i % 3 === 0 ? 'Scholar' : i % 3 === 1 ? 'Warrior' : 'Artisan',
      intent: i % 2 === 0 ? 'Researching Axiom_Flow' : 'Meditating on Convergence',
      skill: 'Temporal_Sight'
    }));
    return list.slice(0, 40).map((e: any) => ({
      ...e,
      x: 100 + (Math.random() * 800),
      y: 100 + (Math.random() * 800),
      isHero: (e.weight ?? 0) > 0.7
    }));
  }, [entities]);

  const handleEntityClick = (e: any, dot: any) => {
    e.stopPropagation();
    setSelectedEntity(dot);
  };

  if (!hasMounted) return <div className="w-full h-full bg-void/30 rounded-[var(--radius)] border border-cosmos/20" />;

  return (
    <div className={`w-full h-full relative ${isAxiomVision ? 'bg-[#000814]' : 'bg-void/30'} backdrop-blur-2xl rounded-[var(--radius)] border ${isAxiomVision ? 'border-cosmos/50' : 'border-cosmos/20'} overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] transition-colors duration-1000`}>
      <AnimatePresence mode="wait">
        {!selectedRegion ? (
          <motion.div
            key="world-map"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Base Raster Image with Filter */}
            <img 
              src="/maps/ancient_world_map_master.png" 
              alt="Ancient World Map" 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isAxiomVision ? 'grayscale invert brightness-50 opacity-20' : 'brightness-75 contrast-125'}`}
            />

            {/* Axiom Vision Grid */}
            {isAxiomVision && (
              <div className="absolute inset-0 z-10 opacity-30 pointer-events-none bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
            )}

            {/* Interactive SVG Overlay */}
            <svg 
              viewBox="0 0 1000 1000" 
              className="absolute inset-0 w-full h-full z-20 cursor-crosshair"
              preserveAspectRatio="xMidYMid slice"
            >
              {regions.map((region) => (
                <motion.path
                  key={region.id}
                  d={region.path}
                  fill="transparent"
                  stroke={isAxiomVision ? "rgba(34, 211, 238, 0.4)" : "rgba(139, 92, 246, 0.2)"}
                  strokeWidth={isAxiomVision ? "0.5" : "1"}
                  filter={isAxiomVision ? "none" : "url(#border-shimmer)"}
                  className="transition-all duration-300 pointer-events-auto"
                  whileHover={{ 
                    stroke: isAxiomVision ? "#22d3ee" : "#f472b6", 
                    strokeWidth: 4, 
                    fill: isAxiomVision ? "rgba(34, 211, 238, 0.1)" : "rgba(244, 114, 182, 0.05)",
                    filter: `drop-shadow(0 0 15px ${isAxiomVision ? 'rgba(34, 211, 238, 0.8)' : 'rgba(244, 114, 182, 0.8)'})`
                  }}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(region)}
                />
              ))}

              {/* Axiom Code Streams (Axiom Vision only) */}
              {isAxiomVision && Array.from({ length: 8 }).map((_, i) => (
                <text key={`code-${i}`} x={i * 120 + 20} y="0" className="text-[8px] fill-cosmos/40 font-mono italic opacity-40">
                  <animate attributeName="y" from="-100" to="1100" dur={`${10 + i * 2}s`} repeatCount="indefinite" />
                  {Array.from({ length: 20 }).map(() => (Math.random() > 0.5 ? '0' : '1')).join('')} // AXIOM_RESONANCE_FLUX_{i}
                </text>
              ))}

              {/* Chronicle Pins */}
              {pins.map(pin => (
                 <motion.g
                   key={pin.id}
                   initial={{ opacity: 0, scale: 0 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="cursor-help"
                 >
                   <circle cx={pin.x} cy={pin.y} r="6" fill={isAxiomVision ? "#22d3ee" : "#f472b6"} className="animate-pulse opacity-40" />
                   <circle cx={pin.x} cy={pin.y} r="2" fill="#fff" />
                   {isAxiomVision && (
                     <line x1={pin.x} y1={pin.y} x2={pin.x + 15} y2={pin.y - 15} stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2,2" />
                   )}
                   <text x={pin.x + (isAxiomVision ? 18 : 8)} y={pin.y + (isAxiomVision ? -18 : 4)} className={`text-[10px] ${isAxiomVision ? 'fill-cyan-400' : 'fill-white/60'} font-mono pointer-events-none uppercase`}>
                     {isAxiomVision ? 'DATA_NODE' : 'EVENT_MARKER'}
                   </text>
                 </motion.g>
              ))}

              {/* Entity Markers */}
              {entityDots.map((dot: any) => (
                <g key={dot.id} onClick={(e) => handleEntityClick(e, dot)} className="cursor-pointer">
                  {/* Selection Pulse */}
                  {selectedEntity?.id === dot.id && (
                    <motion.circle 
                      cx={dot.x} cy={dot.y} r="12"
                      stroke="#f472b6" strokeWidth="1" fill="none"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [0.5, 1.5], opacity: [0, 0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <motion.circle 
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.isHero ? 3 : 1.5}
                    fill={dot.isHero ? "#fcd34d" : "#8b5cf6"}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.3, 0.8, 0.3],
                      x: dot.x + (Math.random() * 4 - 2),
                      y: dot.y + (Math.random() * 4 - 2)
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={dot.isHero ? 'glow-cosmos' : ''}
                  />
                  {/* Invisible hit area */}
                  <circle cx={dot.x} cy={dot.y} r="10" fill="transparent" />
                </g>
              ))}

              {/* Dynamic Leylines (Visual only) */}
              <motion.path 
                d="M 200 150 Q 500 400 800 650" 
                stroke="url(#leyline-grad)" 
                strokeWidth="1.5" 
                fill="none" 
                strokeDasharray="10, 20"
                animate={{ strokeDashoffset: -100 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              
              <defs>
                <linearGradient id="leyline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>

                <filter id="border-shimmer">
                  <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise">
                    <animate attributeName="baseFrequency" values="0.01;0.015;0.01" dur="10s" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                </filter>
              </defs>
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="detailed-map"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={selectedRegion.detailedImage} 
              alt={selectedRegion.name} 
              className="absolute inset-0 w-full h-full object-cover mix-blend-lighten opacity-90"
            />
            
            {/* Detailed Overlay HUD */}
            <div className="absolute inset-0 z-20 pointer-events-none p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white/90 uppercase tracking-tighter">{selectedRegion?.name}</h2>
                    <p className="text-xs text-cosmos font-mono uppercase">Local_Reality_Layer // Detailed</p>
                  </div>
                  <button 
                    onClick={handleBack}
                    className="pointer-events-auto px-4 py-2 bg-cosmos/10 border border-cosmos/40 rounded-sm text-[10px] text-cosmos uppercase font-bold hover:bg-cosmos/20 transition-all"
                  >
                    [ RETURN_TO_WORLD_VIEW ]
                  </button>
                </div>

              <div className="grid grid-cols-4 gap-6 p-6 bg-void/60 border border-white/5 backdrop-blur-xl rounded-md">
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">Elevation</span>
                    <span className="text-xs font-bold text-white tracking-widest">8,244m</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">Biomass_Density</span>
                    <span className="text-xs font-bold text-white tracking-widest">High</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">Temporal_Drift</span>
                    <span className="text-xs font-bold text-cosmos tracking-widest">-0.002s</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">Anomaly_Count</span>
                    <span className="text-xs font-bold text-white tracking-widest">12 Active</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Glitch Overlay */}
      {isZooming && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] bg-void/50 backdrop-blur-sm flex items-center justify-center p-20"
        >
          <div className="text-cosmos font-mono text-xl animate-pulse uppercase tracking-[1em]">Zooming_In...</div>
        </motion.div>
      )}

      {/* Bio-Scanner HUD Overlay */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-6 right-6 z-[60] w-64 bg-void/90 border border-cosmos/40 backdrop-blur-2xl rounded-sm p-4 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-cosmos font-mono uppercase">Bio_Scanner // Active</span>
                <h4 className="text-sm font-bold text-white/90">{selectedEntity.name}</h4>
              </div>
              <button 
                onClick={() => setSelectedEntity(null)}
                className="text-white/30 hover:text-white transition-colors"
              >
                [✕]
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-white/30 uppercase font-mono">Vocation</span>
                <span className="text-[10px] font-bold text-white/80">{selectedEntity.vocation}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-white/30 uppercase font-mono">Primary Skill</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cosmos animate-pulse" />
                  <span className="text-[10px] font-bold text-cosmos tracking-widest">{selectedEntity.skill}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-white/5 rounded-sm">
                <span className="text-[8px] text-white/40 uppercase font-mono">Current Intent</span>
                <p className="text-[9px] text-white/70 italic leading-tight">"{selectedEntity.intent}"</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-white/30 uppercase font-mono">Narrative Weight</span>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedEntity.weight * 100}%` }}
                    className="h-full bg-cosmos"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Weather Overlay (Frost/Ash/Rain) */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-40">
        {stability < 0.7 && (
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent)] mix-blend-screen"
          />
        )}
        {/* Simple particle system for Ash/Snow */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`part-${i}`}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: -10, 
              opacity: Math.random() 
            }}
            animate={{ 
              y: ['0%', '110%'],
              x: [null, (Math.random() * 20 - 10) + '%'],
              opacity: [0, 0.6, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* HUD Info Overlay (Global) */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-cosmos rounded-full glow-cosmos" />
          <div className="flex flex-col">
            <h3 className={`text-sm font-bold uppercase tracking-[0.3em] ${isAxiomVision ? 'text-cyan-400' : 'text-white/90'} transition-colors duration-1000 uppercase`}>
              {isAxiomVision ? 'Axiom Reality-Vision' : 'Living World Cartography'}
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              {selectedRegion ? `Detail_View // ${selectedRegion.id.toUpperCase()}` : 'Master_Sim_Layer // High_Res'}
            </p>
          </div>
          <div className="h-10 w-px bg-cosmos/40 mx-2" />
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase font-mono">Vision Mode</span>
              <button 
                onClick={() => setIsAxiomVision(!isAxiomVision)}
                className={`mt-1 px-3 py-1 text-[10px] font-bold uppercase border transition-all ${isAxiomVision ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400' : 'bg-cosmos/20 border-cosmos text-cosmos'} rounded-sm hover:scale-105 active:scale-95`}
              >
                {isAxiomVision ? 'Axiom_Link: Online' : 'Axiom_Link: Passive'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredRegion && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-6 right-6 z-40 w-72 p-4 bg-void/80 border border-cosmos/30 backdrop-blur-xl rounded-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-cosmos uppercase tracking-widest">{hoveredRegion?.name}</span>
              <div className="px-1.5 py-0.5 rounded-sm bg-cosmos/10 border border-cosmos/20 text-[8px] text-cosmos font-mono">
                {hoveredRegion?.id.toUpperCase()}
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-4 italic">
              "{hoveredRegion?.description}"
            </p>
 
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="flex flex-col">
                <span className="text-[8px] text-white/30 uppercase font-mono">Population</span>
                <span className="text-xs font-bold text-white/80 tabular-nums">{hoveredRegion?.stats.pop}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-white/30 uppercase font-mono">Stability</span>
                <span className={`text-xs font-bold ${hoveredRegion?.stats.stability === 'Critical' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {hoveredRegion?.stats.stability}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[8px] text-white/30 uppercase font-mono">
                <span>Self-Causality Index</span>
                <span className="text-cosmos">{((hoveredRegion?.stats.sci ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(hoveredRegion?.stats.sci ?? 0) * 100}%` }}
                  className="h-full bg-cosmos"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-4 text-[8px] font-mono text-muted-foreground/40">
        <span>LAYER_SYNC: 0.9992</span>
        <span>COORD_ACCURACY: NOMINAL</span>
      </div>
    </div>
  );
};

export default AncientLivingMap;
