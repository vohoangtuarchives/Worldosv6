'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Activity, 
  Database, 
  Cpu, 
  ChevronRight, 
  Zap,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { useObserverUniverseSummaries } from '@/modules/observer/api';
import { ObserverLoadingState } from '@/modules/observer/components/ObserverLoadingState';
import { ObserverErrorState } from '@/modules/observer/components/ObserverErrorState';

const DashboardClient = () => {
  const { data: universes, isLoading, isError, refetch } = useObserverUniverseSummaries();

  if (isLoading) return <ObserverLoadingState lines={8} />;
  
  if (isError) {
    return (
      <ObserverErrorState 
        title="Multiverse Hub Offline" 
        description="Could not synchronize with the WorldOS Kernel. Metaphysical telemetry is obscured."
        onRetry={() => void refetch()} 
      />
    );
  }

  if (!universes) return null;

  // Aggregate Stats (Mock or calculated from universes)
  const totalMass = universes.reduce((acc, u) => acc + (u.informationalMass ?? 0), 0);
  const avgEntropy = universes.length 
    ? (universes.reduce((acc, u) => acc + (u.entropy ?? 0), 0) / universes.length)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-void/40 p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
              <Zap size={12} />
              Kernel Active // Multi-link
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-black tracking-tight text-white leading-[1.1]">
              Multiverse <span className="text-primary italic">Observation</span> Hub
            </h1>
            <p className="text-muted-foreground leading-relaxed text-balance">
              Theo dõi và điều phối tất cả các thực tại hiện có từ trung tâm điều khiển này. WorldOS V6 cung cấp cái nhìn toàn cảnh về Entropy, Informational Mass và sự ổn định của đa vũ trụ.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:min-w-[400px]">
            <QuickStat icon={Database} label="Total Mass" value={`${(totalMass / 1000).toFixed(1)}k`} />
            <QuickStat icon={Activity} label="Avg Entropy" value={avgEntropy.toFixed(2)} color="text-amber-400" />
            <QuickStat icon={Globe} label="Universes" value={String(universes?.length ?? 0)} />
          </div>
        </div>
      </section>

      {/* Universe Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            Active Reality Branches
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{universes?.length} ENTITIES DETECTED</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {universes?.map((universe) => (
            <UniverseCard key={universe.id} universe={universe} />
          ))}

          {/* New Universe Placeholder */}
          <Link 
            href="/dashboard/universes/create"
            className="group flex flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 transition hover:border-primary/50 hover:bg-white/10"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-muted-foreground group-hover:text-primary transition">
              <Zap size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-white/80 group-hover:text-white transition">Spawn New Reality</h3>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Initialize Axiom Configuration</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Status Row */}
      <div className="grid gap-6 md:grid-cols-2">
         <Link href="/dashboard/ai-config" className="group rounded-[24px] border border-white/10 bg-card/30 p-6 flex items-center justify-between hover:border-primary/30 transition">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Cpu size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-white">AI Orchestrator</h3>
                  <p className="text-xs text-muted-foreground">Manage neural drivers and model configs</p>
               </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition">
               <ChevronRight size={16} />
            </div>
         </Link>

         <Link href="/dashboard/metrics" className="group rounded-[24px] border border-white/10 bg-card/30 p-6 flex items-center justify-between hover:border-cosmos/30 transition">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-cosmos/10 border border-cosmos/20 flex items-center justify-center text-cosmos">
                  <Activity size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-white">Multiverse Analytics</h3>
                  <p className="text-xs text-muted-foreground">Deep diagnostics of Z-Metrics & Stability</p>
               </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cosmos/20 transition">
               <ChevronRight size={16} />
            </div>
         </Link>
      </div>
    </div>
  );
};

const QuickStat = ({ icon: Icon, label, value, color = "text-primary" }: { icon: any, label: string, value: string, color?: string }) => (
  <div className="bg-void/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-center gap-1 backdrop-blur-md">
    <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
      <Icon size={10} />
      {label}
    </div>
    <div className={`text-xl font-black italic tracking-tight ${color}`}>{value}</div>
  </div>
);

const UniverseCard = ({ universe }: { universe: any }) => (
  <Link href={`/universes/${universe.id}`} className="group relative rounded-[24px] border border-white/10 bg-card/30 p-6 transition hover:border-primary/50 hover:bg-card/40 overflow-hidden shadow-xl">
    {/* Status Line */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${universe.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{universe.status}</span>
      </div>
      <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary font-bold">
        TICK {universe.currentTick}
      </div>
    </div>

    <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition">{universe.name}</h3>
    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
      {universe.description || 'No reality description provided for this branch.'}
    </p>

    {/* Metrics Minimal */}
    <div className="mt-6 flex items-center justify-between gap-4 py-4 border-t border-white/5">
       <div className="flex flex-col gap-1">
          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Entropy</span>
          <span className="text-xs font-bold text-amber-400">{(universe.entropy ?? 0).toFixed(2)}</span>
       </div>
       <div className="flex flex-col gap-1 items-end">
          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest text-right">Mass</span>
          <span className="text-xs font-bold text-sky-400">{(universe.informationalMass ?? 0).toFixed(1)}kg</span>
       </div>
    </div>

    <div className="mt-4 flex items-center justify-end">
       <div className="flex items-center gap-1 text-[10px] font-bold text-primary group-hover:translate-x-1 transition uppercase tracking-widest">
          Enter Space <ChevronRight size={14} />
       </div>
    </div>
  </Link>
);

export default DashboardClient;
