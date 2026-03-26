'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Search, 
  Atom, 
  BookOpen, 
  Users, 
  Zap, 
  Info,
  ChevronRight,
  Sparkles,
  History,
  Map,
  Lightbulb,
  Activity,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useObserverUniverseSummaries } from '@/modules/observer/api';
import AutoLinkContent from './wiki/AutoLinkContent';

// Custom Minimal UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "", variant = "outline" }: { children: React.ReactNode, className?: string, variant?: string }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${variant === 'outline' ? 'border border-white/20 text-white/70' : 'bg-primary/20 text-primary border border-primary/30'} ${className}`}>
    {children}
  </span>
);

interface WikiSearchResult {
  actors: any[];
  chronicles: any[];
  axioms: any[];
}

export default function WikiPortalClient({ universeId }: { universeId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiSearchResult | null>(null);
  const [activeAxioms, setActiveAxioms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAxioms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wiki/axioms`);
        const data = await res.json();
        setActiveAxioms(data.data || []);
      } catch (e) {
        console.error("Failed to fetch axioms", e);
      }
    };
    fetchAxioms();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wiki/${universeId}/search?q=${val}`);
      const data = await res.json();
      setResults(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'axioms', name: 'Axiomatic Archives', icon: <Atom className="w-4 h-4" />, description: 'Quy luật & Hằng số vật lý' },
    { id: 'entities', name: 'Universal Entities', icon: <Users className="w-4 h-4" />, description: 'Nhân vật, Chủng tộc & Tổ chức' },
    { id: 'chronicles', name: 'The Great Chronicles', icon: <History className="w-4 h-4" />, description: 'Biên niên sử & Chuỗi nhân quả' },
    { id: 'geography', name: 'Cosmic Geography', icon: <Map className="w-4 h-4" />, description: 'Địa lý đa vũ trụ & Vùng không gian' },
    { id: 'metaphysics', name: 'Meta-physics', icon: <Lightbulb className="w-4 h-4" />, description: 'Khoa học, Đổi mới & Siêu hình' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block p-3 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2"
        >
          <BookOpen className="w-8 h-8 text-blue-400" />
        </motion.div>
        <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
          THE WIKI: MULTIVERSE ENCYCLOPEDIA
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          "Lưu trữ vĩnh cửu các quy luật, thực thể và biến cố của đa vũ trụ WorldOS."
        </p>
      </header>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <input 
          className="w-full h-14 pl-12 pr-4 bg-black/40 border border-white/10 rounded-2xl text-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-light italic text-white placeholder:text-white/20"
          placeholder="Tìm kiếm quy luật, nhân vật, sự kiện..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Activity className="w-4 h-4 text-blue-400 opacity-50" />
            </motion.div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all cursor-pointer group">
              <div className="p-4 flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-white/5 text-muted-foreground group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">{cat.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{cat.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Actors Results */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="py-3 px-4 border-b border-white/5 flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-white/60">
                <Users className="w-4 h-4 text-blue-400" /> Inhabitants
              </div>
              <div className="p-2 space-y-1">
                {results.actors.map((actor: any) => (
                  <Link 
                    key={actor.id} 
                    href={`/universes/${universeId}/wiki/actor/${actor.id}`}
                    className="p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{actor.name}</div>
                      <div className="text-xs text-muted-foreground">{actor.role}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </Card>

            {/* Chronicles Results */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="py-3 px-4 border-b border-white/5 flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-white/60">
                <History className="w-4 h-4 text-purple-400" /> Great Chronicles
              </div>
              <div className="p-2 space-y-1">
                {results.chronicles.map((ch: any) => (
                  <div key={ch.id} className="p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group cursor-help">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-white truncate group-hover:text-purple-400 transition-colors uppercase tracking-tight">{ch.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">Tick {ch.tick}</Badge>
                        {ch.impact_score > 70 && <Badge className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20">Critical</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-white/40 font-mono">IMPACT</div>
                       <div className="text-xs font-bold text-purple-400">{ch.impact_score}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Axioms Results */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="py-3 px-4 border-b border-white/5 flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-white/60">
                <Atom className="w-4 h-4 text-emerald-400" /> Axioms
              </div>
              <div className="p-2 space-y-1">
                {results.axioms.map((ax: any) => (
                  <Link 
                    key={ax.id} 
                    href={`/universes/${universeId}/wiki/axiom/${ax.id}`}
                    className="p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{ax.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/40 font-mono italic truncate max-w-[120px]">{ax.id}</span>
                        {ax.drift_summary?.status === 'shifting' && (
                          <span className="flex items-center gap-1 text-[9px] text-orange-400 animate-pulse">
                            <Zap className="w-2 h-2" /> Drifted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                       <Badge className="text-[9px] uppercase">{ax.dimension}</Badge>
                       {ax.drift_summary && (
                         <div className={`text-[10px] font-mono ${ax.drift_summary.drift > 0 ? 'text-emerald-400' : ax.drift_summary.drift < 0 ? 'text-red-400' : 'text-white/20'}`}>
                           {ax.drift_summary.drift > 0 ? '+' : ''}{ax.drift_summary.drift.toFixed(2)}
                         </div>
                       )}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Featured Axioms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeAxioms.filter(a => a.tier === 0).slice(0, 4).map((ax) => (
              <Card key={ax.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.05] transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Atom className="w-12 h-12 text-white" />
                </div>
                <div className="p-4 space-y-2">
                  <Badge className="text-[9px] uppercase tracking-tighter border-blue-500/30 text-blue-400">
                    Tier {ax.tier} | {ax.dimension}
                  </Badge>
                  <h3 className="font-bold text-sm text-white">{ax.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 italic">"{ax.description}"</p>
                  <div className="pt-2 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-muted-foreground uppercase">Default:</span>
                    <span className="text-blue-400">{ax.default_value}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-purple-400" />
            Quick Access
          </h2>
          <div className="grid grid-cols-1 gap-3">
             <Link href={`/universes/${universeId}/metrics`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
               <div className="flex items-center gap-3">
                 <div className="text-muted-foreground group-hover:text-purple-400 transition-colors">
                   <Zap size={18} />
                 </div>
                 <span className="text-sm font-medium text-white">Dữ liệu Hằng số (Z-Metrics)</span>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link href={`/universes/${universeId}/timeline`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
               <div className="flex items-center gap-3">
                 <div className="text-muted-foreground group-hover:text-purple-400 transition-colors">
                   <History size={18} />
                 </div>
                 <span className="text-sm font-medium text-white">Hồ sơ Biên niên sử</span>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
