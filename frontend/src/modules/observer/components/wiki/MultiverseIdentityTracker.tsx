'use client';

import React, { useEffect, useState } from 'react';
import { Link2, GitBranch, Globe } from 'lucide-react';
import { fetchClientJson } from '@/shared/api/observer-http';

// Minimal UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "", variant = "outline" }: { children: React.ReactNode, className?: string, variant?: string }) => (
  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${variant === 'outline' ? 'border border-slate-200 text-slate-400 bg-slate-50/50' : 'bg-sky-50 text-sky-600 border border-sky-100'} ${className}`}>
    {children}
  </span>
);

interface ResolvedIdentity {
  universe_id: string;
  actor_id: string;
  name: string;
  role: string;
  similarity_score: number;
  status: string;
}

export default function MultiverseIdentityTracker({ 
  actorId, 
  currentUniverseId 
}: { 
  actorId: string;
  currentUniverseId: string;
}) {
  const [identities, setIdentities] = useState<ResolvedIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdentities = async () => {
      try {
        const json = await fetchClientJson<{ data: ResolvedIdentity[] }>(`/api/wiki/resolve-identity/${actorId}`);
        setIdentities(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIdentities();
  }, [actorId]);

  if (loading) return <div className="animate-pulse h-32 bg-slate-100/50 rounded-[2rem]" />;
  if (identities.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-white to-sky-50/30 border-sky-100/50">
      <div className="p-6 border-b border-slate-100 uppercase text-[10px] font-black tracking-[0.25em] text-sky-600 flex items-center gap-3">
        <GitBranch className="w-4 h-4" /> Cộng hưởng Đa vũ trụ
      </div>
      <div className="p-6 space-y-5">
        <p className="text-xs font-medium text-slate-400 italic leading-relaxed">
          Phát hiện các biến thể của thực thể này tại các nhánh vũ trụ song song:
        </p>
        <div className="space-y-3">
          {identities.filter(i => i.universe_id !== currentUniverseId).map((identity) => (
            <div key={identity.universe_id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-sky-300 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-sky-50 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500" />
                 </div>
                 <div>
                   <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{identity.name}</div>
                   <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Vũ trụ {identity.universe_id}</div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <Badge variant="outline" className="text-[8px] bg-sky-50/50 border-sky-100 text-sky-600">{(identity.similarity_score * 100).toFixed(0)}% Tương đồng</Badge>
                 <Link2 className="w-3.5 h-3.5 text-slate-200 group-hover:text-sky-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
