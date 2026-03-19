"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { 
  Search, Filter, BookOpen, Sparkles, Zap, 
  Info, X, ChevronRight, Binary, ArrowUpRight,
  Shield, Sword, ShieldCheck, FlaskConical, ScrollText,
  Activity, AlertTriangle,
  Flame, Droplets, Mountain, Leaf, Hammer, Moon, Sun,
  Link as LinkIcon, Dna, Atom, Heart, Fingerprint, Ghost, Star, Code
} from "lucide-react";
import { MotivationRadar } from "./MotivationRadar";

interface Vocation {
  id: string;
  name: string;
  min_tier: number;
  tags: string[];
  description?: string;
  base_stats?: Record<string, number>;
  requirements?: Record<string, number>;
  evolves_to?: string[];
  skills?: Array<{
    id: string;
    name: string;
    type: 'ACTIVE' | 'PASSIVE' | 'ULTIMATE';
    element?: 'FIRE' | 'WATER' | 'METAL' | 'WOOD' | 'EARTH' | 'YIN' | 'YANG';
    energy_nature?: string;
    resonance_rate?: number;
    required_lineage?: string;
    bloodline_scaling?: number;
    fate_resonance?: Record<string, number>;
    physique_affinity?: Record<string, number>;
    rule?: string;
    description: string;
    lore?: string;
    cost?: Record<string, number>;
    cooldown?: number;
    range?: string;
    scaling?: Record<string, number>;
    mastery_level?: number;
    effects?: Record<string, number>;
    backfire_risk?: number;
    env_resonance?: Record<string, number>;
    catalyst_req?: string;
    mutations?: Array<{
      id: string;
      name: string;
      trigger_stat: string;
      trigger_value: number;
      description: string;
      enhanced_effects: Record<string, number>;
    }>;
    awakening_mutation?: {
      id: string;
      name: string;
      description: string;
      enhanced_effects: Record<string, number>;
    };
  }>;
  combos?: Array<{
    id: string;
    name: string;
    sequence: string[];
    description: string;
    bonus_effects: Record<string, number>;
  }>;
  synthesis_recipes?: Array<{
    id: string;
    result_name: string;
    ingredients: string[];
    discovery_chance: number;
    description: string;
  }>;
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

export function VocationLibrary() {
  const [vocations, setVocations] = useState<Vocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    vocations.forEach(v => v.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [vocations]);

  const filteredVocations = useMemo(() => {
    return vocations.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (v.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = selectedTier === "all" || v.min_tier === selectedTier;
      const matchesTag = selectedTag === "all" || v.tags.includes(selectedTag);
      return matchesSearch && matchesTier && matchesTag;
    });
  }, [vocations, searchQuery, selectedTier, selectedTag]);

  const getTierColor = (tier: number) => {
    if (tier === 0) return "text-slate-400 border-slate-700 bg-slate-800/50";
    if (tier <= 2) return "text-cyan-400 border-cyan-800 bg-cyan-900/20";
    if (tier <= 4) return "text-violet-400 border-violet-800 bg-violet-900/20";
    return "text-amber-400 border-amber-800 bg-amber-900/20";
  };

  const getElementInfo = (element?: string) => {
    switch (element) {
      case 'FIRE': return { icon: <Flame className="w-3 h-3" />, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
      case 'WATER': return { icon: <Droplets className="w-3 h-3" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
      case 'METAL': return { icon: <Hammer className="w-3 h-3" />, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" };
      case 'WOOD': return { icon: <Leaf className="w-3 h-3" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case 'EARTH': return { icon: <Mountain className="w-3 h-3" />, color: "text-amber-600", bg: "bg-amber-700/10", border: "border-amber-700/20" };
      case 'YIN': return { icon: <Moon className="w-3 h-3" />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
      case 'YANG': return { icon: <Sun className="w-3 h-3" />, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Accessing Akashic Records...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/20 rounded-2xl border border-slate-800/50 overflow-hidden backdrop-blur-md relative">
      {/* Header / Search Controls */}
      <div className="p-6 border-b border-slate-800/50 bg-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-violet-500" />
              Thư viện Chức nghiệp (Vocation Registry)
            </h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">
              Tra cứu {vocations.length} mẫu hình linh hồn đã được giải mã
            </p>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <div className="px-3 py-1 bg-slate-950/50 border border-slate-800 rounded-md">
              <span className="text-slate-500">TOTAL:</span> {vocations.length}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm danh xưng, định mệnh..."
              className="w-full h-10 pl-10 pr-4 bg-slate-950/80 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              className="h-10 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500/50"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">Tất cả Tier</option>
              {[0, 1, 2, 3, 4, 5].map(t => (
                <option key={t} value={t}>Tier {t}</option>
              ))}
            </select>

            <select 
              className="h-10 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500/50"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="all">Tất cả nhãn (Tags)</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredVocations.map((v, idx) => (
              <motion.div
                key={v.id}
                layoutId={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (idx % 20) * 0.03 }}
                onClick={() => setSelectedVocation(v)}
                className="group relative p-5 rounded-2xl bg-slate-900/20 border border-slate-800/50 hover:border-violet-500/40 hover:bg-slate-800/30 transition-all cursor-pointer overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <Binary className="w-24 h-24 rotate-12" />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${getTierColor(v.min_tier)}`}>
                      Tier {v.min_tier}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-violet-500 transition-colors" />
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition-colors">
                    {v.name}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {v.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-950/50 text-[9px] text-slate-500 border border-slate-800/50 rounded uppercase tracking-tighter">
                        {tag}
                      </span>
                    ))}
                    {v.tags.length > 3 && (
                      <span className="text-[9px] text-slate-600">+{v.tags.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredVocations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Search className="w-16 h-16 mb-4" />
            <p className="text-sm font-mono uppercase tracking-[0.2em]">Không tìm thấy bản ghi phù hợp</p>
          </div>
        )}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedVocation && (
          <div className="absolute inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVocation(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              layoutId={selectedVocation.id}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#0c1425] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-white/5 bg-slate-900/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-violet-500/10 border border-violet-500/20`}>
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">Chi tiết Chức nghiệp</h3>
                </div>
                <button 
                  onClick={() => setSelectedVocation(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Title Section */}
                <section>
                  <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border mb-4 ${getTierColor(selectedVocation.min_tier)}`}>
                    Reality Tier {selectedVocation.min_tier} Template
                  </div>
                  <h1 className="text-4xl font-black text-white leading-none">
                    {selectedVocation.name}
                  </h1>
                  <p className="text-slate-400 mt-4 leading-relaxed italic text-sm border-l-2 border-violet-500/30 pl-4">
                    {selectedVocation.description || `Bản ghi Akashic cho ${selectedVocation.name} vẫn đang được giải mã từ luồng nghiệp lực...`}
                  </p>
                </section>

                {/* Motivation Radar */}
                <section>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> 8D Dynamic Motivation Profile
                  </h4>
                  <div className="p-4 bg-slate-900/60 rounded-3xl border border-white/5 flex justify-center shadow-inner scale-110">
                    <MotivationRadar 
                      profile={selectedVocation.motivation_profile} 
                      size={280}
                      color={selectedVocation.min_tier <= 2 ? "#22d3ee" : "#a78bfa"}
                    />
                  </div>
                </section>

                {/* Stats Modifiers Section */}
                {selectedVocation.base_stats && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ArrowUpRight className="w-4 h-4 text-green-500" /> Chỉ số thăng hoa (Stats Modifiers)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                       {Object.entries(selectedVocation.base_stats).map(([stat, value]) => (
                         <div key={stat} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group/stat hover:bg-white/10 transition-all">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{stat}</span>
                            <span className={`text-sm font-mono font-bold ${value >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                               {value > 1 ? `+${Math.round((value - 1) * 100)}%` : `${Math.round((value - 1) * 100)}%`}
                            </span>
                         </div>
                       ))}
                    </div>
                  </section>
                )}

                {/* Requirements Section */}
                {selectedVocation.requirements && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Shield className="w-4 h-4 text-cyan-500" /> Yêu cầu linh hồn (Prerequisites)
                    </h4>
                    <div className="space-y-2">
                       {Object.entries(selectedVocation.requirements).map(([req, value]) => (
                         <div key={req} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                            <div className="flex items-center gap-3">
                               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                               <span className="text-xs text-slate-300 capitalize">{req.replace('_', ' ')}</span>
                            </div>
                            <span className="text-xs font-mono text-white">≥ {value}</span>
                         </div>
                       ))}
                    </div>
                  </section>
                )}

                {/* Evolution Paths Section */}
                {selectedVocation.evolves_to && selectedVocation.evolves_to.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Binary className="w-4 h-4 text-violet-500" /> Khả năng thăng hoa (Next Evolutions)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {selectedVocation.evolves_to.map(nextId => (
                         <button 
                            key={nextId}
                            onClick={() => {
                              const found = vocations.find(v => v.id === nextId);
                              if (found) setSelectedVocation(found);
                            }}
                            className="px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest hover:bg-violet-500/20 hover:border-violet-500/40 transition-all flex items-center gap-2 group"
                         >
                            {nextId.replace('_', ' ')}
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                         </button>
                       ))}
                    </div>
                  </section>
                )}

                {/* Skills & Masteries Section */}
                {selectedVocation.skills && selectedVocation.skills.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-amber-500" /> Kỹ năng & Pháp môn (Skill Set)
                    </h4>
                    <div className="space-y-4">
                      {selectedVocation.skills.map(skill => (
                        <div key={skill.id} className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 group/skill hover:border-amber-500/30 transition-all space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                skill.type === 'ULTIMATE' ? 'bg-amber-500/20 text-amber-400' :
                                skill.type === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                              }`}>
                                {skill.type === 'ULTIMATE' ? <Zap className="w-4 h-4" /> : 
                                 skill.type === 'ACTIVE' ? <Sword className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-white group-hover/skill:text-amber-400 transition-colors">{skill.name}</h5>
                                  {skill.element && (() => {
                                    const el = getElementInfo(skill.element);
                                    return el && (
                                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${el.bg} ${el.color} ${el.border} border`}>
                                        {el.icon}
                                        {skill.element}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">{skill.type}</span>
                              </div>
                            </div>
                            
                            {skill.mastery_level !== undefined && (
                              <div className="text-right">
                                <div className="text-[10px] font-mono text-slate-500 uppercase">Mastery</div>
                                <div className="text-sm font-black text-amber-500/80">{skill.mastery_level}%</div>
                              </div>
                            )}
                          </div>

                          {/* Energy Nature & Resonance */}
                          {(skill.energy_nature || skill.resonance_rate !== undefined) && (
                            <div className="flex items-center justify-between py-2 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <Atom className="w-3 h-3 text-violet-400" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Energy:</span>
                                <span className="text-[10px] text-violet-300 font-mono">{skill.energy_nature || 'Standard'}</span>
                              </div>
                              {skill.resonance_rate !== undefined && (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
                                      style={{ width: `${skill.resonance_rate * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-mono text-violet-400">{Math.round(skill.resonance_rate * 100)}%</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bloodline Requirement */}
                          {skill.required_lineage && (
                            <div className="flex items-center justify-between py-2 border-t border-white/5 bg-red-500/5 px-2 -mx-2">
                              <div className="flex items-center gap-2">
                                <Heart className="w-3 h-3 text-red-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Bloodline:</span>
                                <span className="text-[10px] text-white font-bold">{skill.required_lineage.replace('_', ' ')}</span>
                              </div>
                              {skill.bloodline_scaling && (
                                <div className="text-[9px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                  Scale: x{skill.bloodline_scaling}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fate & Physique Affinity */}
                          {(skill.fate_resonance || skill.physique_affinity) && (
                            <div className="flex flex-col gap-1.5 py-2 border-t border-white/5 bg-slate-900/40 px-2 -mx-2">
                              {skill.fate_resonance && Object.entries(skill.fate_resonance).map(([fate, mult]) => (
                                <div key={fate} className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Ghost className="w-3 h-3 text-violet-400" />
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Fate: {fate.replace('_', ' ')}</span>
                                  </div>
                                  <span className={`text-[9px] font-mono font-bold ${mult >= 1 ? 'text-violet-400' : 'text-red-400'}`}>x{mult}</span>
                                </div>
                              ))}
                              {skill.physique_affinity && Object.entries(skill.physique_affinity).map(([phys, mult]) => (
                                <div key={phys} className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Activity className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Body: {phys.replace('_', ' ')}</span>
                                  </div>
                                  <span className={`text-[9px] font-mono font-bold ${mult >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>x{mult}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Technical Stats Row */}
                          <div className="flex flex-wrap gap-y-2 gap-x-4 text-[10px] font-mono py-2 border-y border-white/5">
                            {skill.cost && Object.entries(skill.cost).length > 0 && (
                              <div className="flex gap-2 text-blue-400">
                                <span className="text-slate-500">COST:</span>
                                {Object.entries(skill.cost).map(([stat, val]) => (
                                  <span key={stat} className="font-bold">{stat.toUpperCase()} {val}</span>
                                ))}
                              </div>
                            )}
                            {skill.cooldown !== undefined && (
                              <div className="flex gap-2 text-amber-400">
                                <span className="text-slate-500">CD:</span>
                                <span>{skill.cooldown}ticks</span>
                              </div>
                            )}
                          </div>

                          {/* Logic Engine (Rust DSL) Section */}
                          {skill.rule && (
                            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-blue-500/20 shadow-inner group/logic">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Code className="w-3 h-3 text-blue-400" />
                                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Logic Engine (Rust DSL)</span>
                                </div>
                                <div className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[8px] font-mono text-blue-400/60 uppercase">
                                  Compiled
                                </div>
                              </div>
                              <pre className="text-[10px] text-blue-100/80 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                                {skill.rule}
                              </pre>
                            </div>
                          )}

                          {/* Catalyst & Environment Row */}
                          {(skill.catalyst_req || skill.env_resonance) && (
                            <div className="space-y-3">
                              {skill.catalyst_req && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                                  <ScrollText className="w-3 h-3 text-emerald-400" />
                                  <span className="text-slate-500 uppercase font-bold tracking-tighter">Catalyst:</span>
                                  <span className="text-emerald-200">{skill.catalyst_req}</span>
                                </div>
                              )}
                              
                              {skill.env_resonance && (
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(skill.env_resonance).map(([env, mult]) => (
                                    <div key={env} className={`flex items-center justify-between px-2 py-1 rounded bg-slate-900/50 border ${mult >= 1 ? 'border-blue-500/20' : 'border-red-500/20'}`}>
                                      <span className="text-[9px] text-slate-500 uppercase truncate max-w-[60px]">{env.replace('_', ' ')}</span>
                                      <span className={`text-[10px] font-bold ${mult >= 1 ? 'text-blue-400' : 'text-red-400'}`}>x{mult}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lore & Description */}
                          <div>
                            <p className="text-xs text-slate-300 leading-relaxed">{skill.description}</p>
                            {skill.lore && (
                              <p className="text-[10px] text-slate-500 italic mt-2 p-2 bg-black/20 rounded-lg border-l border-slate-700">
                                "{skill.lore}"
                              </p>
                            )}
                          </div>

                          {/* Scaling & Effects */}
                          <div className="flex flex-wrap gap-2 pt-2">
                             {skill.scaling && Object.entries(skill.scaling).map(([stat, val]) => (
                               <div key={stat} className="px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-[9px] text-violet-300 flex items-center gap-1">
                                 <span className="opacity-50 uppercase">{stat.slice(0, 3)}</span>
                                 <span className="font-bold">x{val}</span>
                               </div>
                             ))}
                             {skill.effects && Object.entries(skill.effects).map(([eff, val]) => (
                               <div key={eff} className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-300 flex items-center gap-1">
                                 <span className="opacity-50 uppercase">{eff.replace('_', ' ')}</span>
                                 <span className="font-bold">+{val}</span>
                               </div>
                             ))}
                          </div>

                          {/* Progress toward Mastery (Visual) */}
                          {skill.mastery_level !== undefined && (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                                <span>Mastery Progress</span>
                                <span>{skill.mastery_level}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${skill.mastery_level}%` }}
                                  className={`h-full bg-gradient-to-r ${skill.mastery_level === 100 ? 'from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'from-blue-600 to-blue-400'}`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Expert Mutations Section */}
                          {skill.mastery_level === 100 && skill.mutations && skill.mutations.length > 0 && (
                            <div className="pt-4 mt-2 border-t border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-700">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Biến thể Chuyên gia (Expert Variants)</span>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {skill.mutations.map(mut => (
                                  <div key={mut.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all group/mut relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-1.5 relative z-10">
                                      <h6 className="text-[11px] font-bold text-amber-200">{mut.name}</h6>
                                      <div className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-amber-500/30 text-[8px] font-mono text-amber-500 uppercase">
                                        Req: {mut.trigger_stat} {mut.trigger_value}+
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight mb-2 relative z-10">{mut.description}</p>
                                    <div className="flex flex-wrap gap-1.5 relative z-10">
                                      {Object.entries(mut.enhanced_effects).map(([eff, val]) => (
                                        <span key={eff} className="text-[8px] font-mono text-amber-400/70">
                                          +{eff.replace('_', ' ')}: <span className="text-amber-400 font-bold">{val > 1 ? `x${val}` : `${val * 100}%`}</span>
                                        </span>
                                      ))}
                                    </div>
                                    {/* Mutation Accent */}
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 blur-xl opacity-0 group-hover/mut:opacity-100 transition-opacity" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Awakening Mutation Section */}
                          {skill.awakening_mutation && (
                            <div className="pt-4 mt-2 border-t border-red-500/30 bg-red-500/5 p-3 rounded-xl border border-red-500/20 relative overflow-hidden group/awake">
                              <div className="flex items-center gap-2 mb-2 relative z-10">
                                <Star className="w-4 h-4 text-red-500 animate-spin-slow" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] shadow-red-500/50">Thức tỉnh Huyết mạch (Awakening)</span>
                              </div>
                              <h6 className="text-sm font-black text-white mb-1 relative z-10">{skill.awakening_mutation.name}</h6>
                              <p className="text-[10px] text-red-200/70 leading-relaxed mb-2 relative z-10">{skill.awakening_mutation.description}</p>
                              <div className="flex flex-wrap gap-2 relative z-10">
                                {Object.entries(skill.awakening_mutation.enhanced_effects).map(([eff, val]) => (
                                  <div key={eff} className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[8px] font-bold text-red-200">
                                    {eff.replace('_', ' ')}: +{val > 1 ? `x${val}` : `${val * 100}%`}
                                  </div>
                                ))}
                              </div>
                              {/* Glowing Background Animation */}
                              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-50 group-hover/awake:opacity-100 transition-opacity" />
                              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-red-500/20 blur-3xl rounded-full group-hover/awake:scale-150 transition-transform duration-1000" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Combo Chains Section */}
                {selectedVocation.combos && selectedVocation.combos.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <LinkIcon className="w-4 h-4 text-violet-500" /> Chuỗi Combo thăng hoa (Skill Chains)
                    </h4>
                    <div className="space-y-3">
                      {selectedVocation.combos.map(combo => (
                        <div key={combo.id} className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10 hover:border-violet-500/30 transition-all">
                          <h6 className="text-sm font-bold text-violet-300 mb-2 flex items-center gap-2">
                             <Zap className="w-3 h-3 text-amber-500" /> {combo.name}
                          </h6>
                          <div className="flex items-center gap-2 mb-3">
                            {combo.sequence.map((sid, i) => (
                              <React.Fragment key={sid}>
                                <div className="px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[9px] text-slate-400 font-mono">
                                  {sid.replace('_', ' ')}
                                </div>
                                {i < combo.sequence.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700" />}
                              </React.Fragment>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed mb-3">{combo.description}</p>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                            {Object.entries(combo.bonus_effects).map(([eff, val]) => (
                               <div key={eff} className="px-2 py-1 rounded bg-violet-500/10 text-[8px] text-violet-400 flex items-center gap-1">
                                  <span className="uppercase text-violet-500/70">{eff.replace('_', ' ')}:</span>
                                  <span className="font-bold">+{val > 1 ? `x${val}` : `${val * 100}%`}</span>
                               </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Skill Synthesis Section */}
                {selectedVocation.synthesis_recipes && selectedVocation.synthesis_recipes.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Dna className="w-4 h-4 text-emerald-500" /> Lò đúc Kỹ năng (Skill Forge)
                    </h4>
                    <div className="space-y-3">
                      {selectedVocation.synthesis_recipes.map(recipe => (
                        <div key={recipe.id} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="text-sm font-bold text-emerald-300">{recipe.result_name}</h6>
                            <div className="px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-[8px] font-mono text-emerald-500 uppercase">
                               Discovery: {Math.round(recipe.discovery_chance * 100)}%
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {recipe.ingredients.map((ing, i) => (
                              <React.Fragment key={ing}>
                                <div className="px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[9px] text-slate-400 font-mono">
                                  {ing}
                                </div>
                                {i < recipe.ingredients.length - 1 && <span className="text-slate-700 text-xs">+</span>}
                              </React.Fragment>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed italic border-l border-emerald-500/20 pl-3">{recipe.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-white/5 bg-slate-900/60 text-center">
                 <button className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-violet-900/20 active:scale-95">
                    Ghi danh (Witness Simulation)
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
