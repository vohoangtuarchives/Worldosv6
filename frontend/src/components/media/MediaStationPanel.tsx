'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Mic2, Zap, Share2, Activity } from 'lucide-react';

interface MediaStationPanelProps {
  activeNarrative: any;
  onClose?: () => void;
}

const MediaStationPanel = ({ activeNarrative, onClose }: MediaStationPanelProps) => {
  if (!activeNarrative) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-6 top-24 bottom-16 w-96 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
    >
      {/* Header: News Anchor Desk */}
      <div className="p-6 bg-gradient-to-b from-primary/20 to-transparent border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary rounded-full">
            <Radio className="w-3 h-3 text-black animate-pulse" />
            <span className="text-[10px] font-black text-black uppercase tracking-tighter">Live Broadcast</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-2xl font-bold text-white leading-tight tracking-tight mb-2">
          {activeNarrative.headline}
        </h3>
        <p className="text-sm text-primary/80 italic font-medium">
          "{activeNarrative.slogan}"
        </p>
      </div>

      {/* Body: Feature Article */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div className="flex items-center gap-4 py-4 border-y border-white/5">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <Mic2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Lead Reporter</p>
            <p className="text-sm font-semibold text-white/90">The News Anchor AI</p>
          </div>
        </div>

        <div className="prose prose-invert prose-sm">
          <p className="text-white/70 leading-relaxed text-justify">
            {activeNarrative.story_snippet}
          </p>
          <button className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline mt-2">
            Read full transmission...
          </button>
        </div>

        {/* Media Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-[9px] text-white/40 uppercase font-bold">Virality</span>
            </div>
            <p className="text-xl font-mono text-white">{(activeNarrative.intensity * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-red-500" />
              <span className="text-[9px] text-white/40 uppercase font-bold">Distortion</span>
            </div>
            <p className="text-xl font-mono text-white">{(activeNarrative.distortion * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {activeNarrative.tags?.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] text-white/60 uppercase font-bold tracking-wider">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: VFX Config */}
      <div className="p-4 bg-black/40 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">
              Visual: {activeNarrative.vfx?.effect_type || 'standard'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/20">
            TICK: {activeNarrative.origin_tick}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MediaStationPanel;
