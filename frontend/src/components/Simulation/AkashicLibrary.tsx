'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { BookOpen, Layers, Zap, Info, ChevronRight, Binary, Sparkles } from 'lucide-react';

interface Tier {
  level: number;
  name: string;
  label: string;
  status: string;
  axioms: any[];
  rulesets: any[];
}

interface Combination {
  ruleset_a: string;
  ruleset_b: string;
  result_vocation: string;
  description: string;
}

const AkashicLibrary: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<number | null>(0);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const response: any = await api.library.rulesets();
        if (response.success) {
          setTiers(response.data.tiers);
          setCombinations(response.data.combinations);
          if (response.data.tiers.length > 0) {
            setSelectedTier(response.data.tiers[0].level);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Akashic Library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  const currentTierData = tiers.find(t => t.level === selectedTier);

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-slate-400 animate-pulse italic">Synchronizing with the Great Dao...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white font-sans selection:bg-violet-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400"
            >
              The Akashic Library
            </motion.h1>
            <p className="text-slate-400 mt-2 text-lg font-medium flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-500" />
              Reality Tier Archives & RuleSet Evolution Control
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Known Combinations</div>
                <div className="text-xl font-mono text-cyan-400">{combinations.length}</div>
             </div>
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Max Reality Tier</div>
                <div className="text-xl font-mono text-violet-400">T-0{tiers.length > 0 ? tiers[tiers.length-1].level : 0}</div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.level}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => setSelectedTier(tier.level)}
              className={`relative p-6 rounded-3xl border transition-all cursor-pointer group overflow-hidden ${
                tier.level === selectedTier
                  ? 'bg-violet-600/20 border-violet-400 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] ring-1 ring-violet-400/50'
                  : tier.status === 'Active'
                    ? 'bg-slate-900/40 border-slate-800 hover:border-violet-500/50'
                    : 'bg-black/40 border-white/5 opacity-40 grayscale pointer-events-none'
              } backdrop-blur-xl`}
            >
              <div className="absolute -right-4 -top-4 text-8xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                {tier.level}
              </div>
              
              <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-2xl ${tier.level === selectedTier ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Layers className="w-6 h-6" />
                 </div>
                 {tier.status === 'Active' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/20 rounded-full">
                      Accessible
                    </span>
                 )}
              </div>
              
              <h3 className="text-2xl font-bold">{tier.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{tier.label}</p>
              
              <div className="mt-8 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {tier.rulesets.slice(0, 3).map((rs, i) => (
                     <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                        {rs.name.charAt(0)}
                     </div>
                   ))}
                   {tier.rulesets.length > 3 && (
                     <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-500">
                        +{tier.rulesets.length - 3}
                     </div>
                   )}
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${tier.level === selectedTier ? 'translate-x-1 text-violet-400' : 'text-slate-700'}`} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Axioms & RuleSets Detail */}
           <div className="lg:col-span-2 space-y-8">
              <AnimatePresence mode="wait">
                {currentTierData && (
                  <motion.div
                    key={selectedTier}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Axioms */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                       <h4 className="text-sm uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                          <Binary className="w-4 h-4" /> Fundamental Axioms
                       </h4>
                       <div className="space-y-4">
                          {currentTierData.axioms.map((axiom: any) => (
                            <div key={axiom.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-violet-300">{axiom.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">Lv.{axiom.max_tier}</span>
                               </div>
                               <p className="text-xs text-slate-500 leading-relaxed capitalize">
                                  {axiom.description || "Tư duy căn bản định hình thực tại."}
                               </p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* RuleSets */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                       <h4 className="text-sm uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Available RuleSets
                       </h4>
                       <div className="space-y-4">
                          {currentTierData.rulesets.map((rs: any) => (
                            <div key={rs.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-violet-500/5 hover:border-violet-500/20 transition-all group">
                               <span className="font-bold block mb-2">{rs.name}</span>
                               <div className="flex flex-wrap gap-2">
                                  {rs.tags?.map((tag: string) => (
                                    <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 border border-white/5 text-slate-500 uppercase">
                                       {tag}
                                    </span>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* Combinations Sidebar */}
           <div className="space-y-6">
              <div className="bg-gradient-to-br from-violet-900/20 to-cyan-900/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                 <h4 className="text-sm uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> Synthesis Protocols
                 </h4>
                 <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {combinations.map((comb, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono text-slate-400">{comb.ruleset_a}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            <span className="text-[10px] font-mono text-slate-400">{comb.ruleset_b}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-cyan-400 text-sm">{comb.result_vocation}</span>
                         </div>
                         <p className="text-[10px] text-slate-500 mt-2 italic leading-tight">
                            {comb.description}
                         </p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="mt-8 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-xs text-violet-300 leading-relaxed">
                       <Info className="w-4 h-4 inline mr-2 mb-1" />
                       Combination rules emerge when multiple RuleSets reach 100% saturation in a single causality layer.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AkashicLibrary;
