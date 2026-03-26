'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Zap, 
  Activity, 
  Award, 
  Globe, 
  History,
  ChevronRight,
  Info,
  BookOpen
} from 'lucide-react';
import { useObserverActorDetail } from '@/modules/observer/api';
import AutoLinkContent from './AutoLinkContent';
import MultiverseIdentityTracker from './MultiverseIdentityTracker';

// Minimal UI Components
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

export default function ActorWikiDetail({ 
  universeId, 
  actorId 
}: { 
  universeId: string;
  actorId: string;
}) {
  const { data: actor, isLoading } = useObserverActorDetail(actorId, undefined as any);

  if (isLoading) return <div className="animate-pulse h-96 bg-white/5 rounded-2xl" />;
  if (!actor) return <div className="p-8 text-center text-muted-foreground">Không tìm thấy thông tin thực thể này.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {/* Left Column: Avatar & Basic Stats */}
      <div className="space-y-6">
        <Card className="text-center p-8 bg-gradient-to-b from-blue-500/10 to-transparent border-blue-500/20">
          <div className="mx-auto w-32 h-32 rounded-full bg-void border-2 border-blue-500/50 flex items-center justify-center mb-4 relative overflow-hidden">
             <User className="w-16 h-16 text-blue-400/50" />
             <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{actor.name}</h1>
          <Badge className="mt-2 text-blue-400 border-blue-500/30">{actor.role}</Badge>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Influence</div>
              <div className="text-xl font-bold text-white">{(actor.influence * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Alignment</div>
              <div className="text-xl font-bold text-white">{actor.alignment}</div>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
            <Shield className="w-3 h-3 text-blue-400" />
            Biological Stats
          </h3>
          <Card className="p-4 bg-white/[0.02] border-white/5 space-y-4">
            {Object.entries(actor.vitality || {}).map(([key, value]: [string, any]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider">
                   <span className="text-muted-foreground">{key}</span>
                   <span className="text-white">{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-void rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${value * 100}%` }}
                     className="h-full bg-blue-500/40"
                   />
                </div>
              </div>
            ))}
          </Card>
        </section>

        <MultiverseIdentityTracker actorId={actorId} currentUniverseId={universeId} />
      </div>

      {/* Middle Column: Biography & Narrative */}
      <div className="lg:col-span-2 space-y-8 text-white/90">
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
             <BookOpen className="w-5 h-5 text-purple-400" />
             <h2 className="text-xl font-bold tracking-tight">Biography (Hồ sơ thực thể)</h2>
          </div>
          <div className="text-lg leading-relaxed font-serif italic text-white/80 whitespace-pre-wrap">
             <AutoLinkContent content={actor.biography} universeId={universeId} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
             <Zap className="w-5 h-5 text-emerald-400" />
             <h2 className="text-xl font-bold tracking-tight">Capabilities (Năng lực & Thuộc tính)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {Object.entries(actor.traits || {}).map(([key, val]: [string, any]) => (
               <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                 <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Award className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase text-muted-foreground font-mono">{key}</div>
                   <div className="text-sm font-bold">{val}</div>
                 </div>
               </div>
             ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
             <History className="w-5 h-5 text-blue-400" />
             <h2 className="text-xl font-bold tracking-tight">Recent Evolutionary Events</h2>
          </div>
          <div className="space-y-3">
             {actor.recentEvents?.map((event: any) => (
               <div key={event.id} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all">
                  <div className="pt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-blue-400 mb-1">TICK {event.tick}</div>
                    <div className="text-sm text-white/90 font-light leading-relaxed">
                       <AutoLinkContent content={event.summary} universeId={universeId} />
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
