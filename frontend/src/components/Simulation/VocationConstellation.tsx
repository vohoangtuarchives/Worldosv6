'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { MotivationRadar } from './MotivationRadar';
import { Sparkles, Info, X } from 'lucide-react';

interface Vocation {
  id: string;
  name: string;
  min_tier: number;
  tags: string[];
  motivation_profile: {
    creation: number;
    destruction: number;
    order: number;
    chaos: number;
    self_preservation: number;
    altruism: number;
    physical: number;
    metaphysical: number;
  };
}

const VocationConstellation: React.FC = () => {
  const [vocations, setVocations] = useState<Vocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVocation, setSelectedVocation] = useState<Vocation | null>(null);

  useEffect(() => {
    const fetchVocations = async () => {
      try {
        const response: any = await api.library.vocations();
        if (response.success) {
          setVocations(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch vocations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVocations();
  }, []);

  // Pseudo-random positioning based on ID string hash
  const getPosition = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = (Math.abs(hash) % 800) - 400; // -400 to 400
    const y = (Math.abs(hash * 13) % 400) - 200; // -200 to 200
    return { x, y };
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-slate-950 rounded-3xl border border-white/10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative min-h-[650px] flex flex-col">
      {/* Background Starfield */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 2 + 'px',
              height: Math.random() * 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 's'
            }}
          />
        ))}
      </div>

      <header className="relative z-10 mb-8">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          Vocation Constellation
        </h2>
        <p className="text-slate-500 mt-1 italic">Mapping the trajectory of mortal souls towards divinity across {vocations.length} templates.</p>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-visible">
        {/* Connection Lines (SVG) - Just a few random ones for aesthetic */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
           <defs>
             <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
               <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
               <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
             </linearGradient>
           </defs>
           {vocations.slice(0, 15).map((v, i) => {
             if (i === 0) return null;
             const p1 = getPosition(vocations[i-1].id);
             const p2 = getPosition(v.id);
             return (
               <line 
                key={i}
                x1={`calc(50% + ${p1.x}px)`} 
                y1={`calc(50% + ${p1.y}px)`} 
                x2={`calc(50% + ${p2.x}px)`} 
                y2={`calc(50% + ${p2.y}px)`} 
                stroke="url(#line-grad)" 
                strokeWidth="0.5" 
               />
             );
           })}
        </svg>

        {vocations.filter(v => v.min_tier <= 4).map((v, i) => {
          const { x, y } = getPosition(v.id);
          const isSelected = selectedVocation?.id === v.id;

          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i % 20) * 0.05, type: 'spring' }}
              whileHover={{ scale: 1.3, zIndex: 100 }}
              onClick={() => setSelectedVocation(v)}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all group ${
                 v.min_tier === 0 ? 'bg-slate-500/20 border border-slate-400/50' :
                 v.min_tier <= 2 ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-cyan-500/10' :
                 'bg-violet-500/20 border border-violet-400/50 shadow-violet-500/20'
              } ${isSelected ? 'ring-2 ring-white scale-125 z-[101]' : ''}`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                marginLeft: '-24px',
                marginTop: '-24px',
              }}
            >
              <div className={`w-2 h-2 rounded-full blur-[1px] ${
                v.min_tier === 0 ? 'bg-slate-200' : v.min_tier <= 2 ? 'bg-cyan-200' : 'bg-violet-200'
              }`} />
              
              {/* Label on Hover */}
              <div className="absolute opacity-0 group-hover:opacity-100 top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 border border-white/10 px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase backdrop-blur-md pointer-events-none transition-opacity">
                {v.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedVocation && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-8 right-8 bottom-8 w-80 bg-slate-900/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl z-[200] shadow-2xl overflow-y-auto"
          >
            <button 
              onClick={() => setSelectedVocation(null)}
              className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10 ${
              selectedVocation.min_tier === 0 ? 'text-slate-400' : 
              selectedVocation.min_tier <= 2 ? 'text-cyan-400' : 'text-violet-400'
            }`}>
              Tier {selectedVocation.min_tier} Vocation
            </span>

            <h3 className="text-2xl font-bold mt-4 mb-2">{selectedVocation.name}</h3>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {selectedVocation.tags.map(tag => (
                <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 border border-white/5 text-slate-400 uppercase">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mb-8">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Info className="w-3 h-3" /> 8D Motivation Radar
              </h4>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <MotivationRadar 
                  profile={selectedVocation.motivation_profile} 
                  size={240} 
                  color={selectedVocation.min_tier <= 2 ? '#22d3ee' : '#a78bfa'}
                />
              </div>
            </div>

            <div className="space-y-4">
               <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Core Drivers</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This vocation is primarily driven by 
                    <span className="text-white mx-1">
                        {Object.entries(selectedVocation.motivation_profile)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 2)
                          .map(([k]) => k.replace('_', ' '))
                          .join(" and ")}
                    </span>.
                  </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-8 grid grid-cols-3 gap-4 relative z-10">
         <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Known Templates</h4>
            <div className="text-2xl font-mono text-cyan-400 leading-none">{vocations.length}</div>
         </div>
         <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Max Soul Tier</h4>
            <div className="text-2xl font-mono text-blue-400 leading-none">
              {vocations.length > 0 ? Math.max(...vocations.map(v => v.min_tier)) : 0}
            </div>
         </div>
         <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Divergence Index</h4>
            <div className="text-2xl font-mono text-violet-400 leading-none">0.82</div>
         </div>
      </footer>
    </div>
  );
};

export default VocationConstellation;
