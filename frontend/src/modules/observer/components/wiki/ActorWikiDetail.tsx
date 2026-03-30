'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Zap, 
  Award, 
  History,
  BookOpen
} from 'lucide-react';
import { useObserverActorDetail } from '@/modules/observer/api';
import AutoLinkContent from './AutoLinkContent';
import MultiverseIdentityTracker from './MultiverseIdentityTracker';

interface ActorEventEntry {
  id: string | number;
  tick: number;
  summary: string;
}

// Minimal UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "", variant = "outline" }: { children: React.ReactNode, className?: string, variant?: string }) => (
  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${variant === 'outline' ? 'border border-slate-200 text-slate-500 bg-slate-50/50' : 'bg-sky-50 text-sky-600 border border-sky-100'} ${className}`}>
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
  const { data: actor, isLoading } = useObserverActorDetail(actorId, undefined as never);

  if (isLoading) return <div className="animate-pulse h-96 bg-slate-100/50 rounded-[2.5rem]" />;
  if (!actor) return <div className="p-12 text-center text-slate-400 font-medium">Không tìm thấy thông tin thực thể này.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto font-sans">
      {/* Left Column: Avatar & Basic Stats */}
      <div className="space-y-8">
        <Card className="text-center p-10 bg-gradient-to-b from-sky-50/50 to-white border-sky-100/50 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-sky-500 rounded-b-full opacity-20" />
          
          <div className="mx-auto w-36 h-36 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center mb-6 relative overflow-hidden group">
             <User className="w-20 h-20 text-slate-200 group-hover:text-sky-300 transition-colors" />
             <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{actor.name}</h1>
          <Badge className="mt-4 text-sky-600 border-sky-100 bg-sky-50/50 px-4 py-1.5">{actor.role}</Badge>
          
          <div className="grid grid-cols-2 gap-6 mt-10">
            <div className="text-center p-4 rounded-3xl bg-slate-50/50 border border-slate-100 transition-hover hover:border-sky-100 hover:bg-white hover:shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Tầm ảnh hưởng</div>
              <div className="text-2xl font-black text-slate-900">{(actor.influence * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center p-4 rounded-3xl bg-slate-50/50 border border-slate-100 transition-hover hover:border-sky-100 hover:bg-white hover:shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Định hướng</div>
              <div className="text-2xl font-black text-slate-900 capitalize">{actor.alignment === 'neutral' ? 'Trung lập' : actor.alignment}</div>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase flex items-center gap-3 px-2">
            <Shield className="w-4 h-4 text-sky-400" />
            Thông số Sinh học
          </h3>
          <Card className="p-8 space-y-6">
            {(Object.entries(actor.vitality || {}) as [string, number][]).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                   <span className="text-slate-400">{key === 'health' ? 'Sức mạnh' : key === 'energy' ? 'Năng lượng' : key === 'sanity' ? 'Tâm trí' : key}</span>
                   <span className="text-slate-900">{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${value * 100}%` }}
                     className={`h-full ${key === 'health' ? 'bg-sky-500' : key === 'energy' ? 'bg-amber-400' : 'bg-indigo-500'} opacity-80`}
                   />
                </div>
              </div>
            ))}
          </Card>
        </section>

        <MultiverseIdentityTracker actorId={actorId} currentUniverseId={universeId} />
      </div>

      {/* Middle Column: Biography & Narrative */}
      <div className="lg:col-span-2 space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
             <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500">
               <BookOpen className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Hồ sơ Thực thể</h2>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">BIOGRAPHY DATABASE v2.0</p>
             </div>
          </div>
          <div className="text-xl leading-relaxed text-slate-600 font-medium italic indent-8">
             <AutoLinkContent content={actor.biography} universeId={universeId} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
             <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
               <Zap className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Năng lực & Thuộc tính</h2>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">CAPABILITIES & TRAITS</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {(Object.entries(actor.traits || {}) as [string, string][]).map(([key, val]) => (
               <div key={key} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-hover hover:shadow-md hover:border-amber-100 group">
                 <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <Award className="w-6 h-6" />
                 </div>
                 <div>
                   <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">{key}</div>
                   <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{val}</div>
                 </div>
               </div>
             ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
             <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-sky-500">
               <History className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sự kiện Tiến hóa Gần đây</h2>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">EVOLUTIONARY HISTORY</p>
             </div>
          </div>
          <div className="space-y-4">
             {actor.recentEvents?.map((event: ActorEventEntry) => (
               <div key={event.id} className="flex gap-6 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 group hover:bg-white hover:shadow-md hover:border-sky-100 transition-all">
                  <div className="pt-2">
                    <div className="w-3 h-3 rounded-full bg-sky-500 border-4 border-white shadow-sm shadow-sky-200" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-sky-500 mb-2 uppercase tracking-widest">NHỊP {event.tick}</div>
                    <div className="text-base text-slate-600 font-medium leading-relaxed">
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
