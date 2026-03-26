'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, GitBranch, Globe, ExternalLink, Activity } from 'lucide-react';

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wiki/resolve-identity/${actorId}`);
        const json = await res.json();
        setIdentities(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIdentities();
  }, [actorId]);

  if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-xl" />;
  if (identities.length === 0) return null;

  return (
    <Card className="bg-blue-500/5 border-blue-500/20">
      <div className="p-4 border-b border-white/5 uppercase text-[10px] font-bold tracking-widest text-blue-400 flex items-center gap-2">
        <GitBranch className="w-3 h-3" /> Multiverse Resonance (Dấu vết Đa vũ trụ)
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[11px] text-muted-foreground italic leading-tight">
          Phát hiện các biến thể của thực thể này tại các nhánh vũ trụ song song:
        </p>
        <div className="space-y-2">
          {identities.filter(i => i.universe_id !== currentUniverseId).map((identity) => (
            <div key={identity.universe_id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-2">
                 <Globe className="w-3 h-3 text-blue-400/50" />
                 <div>
                   <div className="text-xs font-bold text-white/90">{identity.name}</div>
                   <div className="text-[9px] text-muted-foreground uppercase">Universe {identity.universe_id}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="text-[8px] bg-blue-500/10 border-blue-500/20">{(identity.similarity_score * 100).toFixed(0)}% Match</Badge>
                 <Link2 className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
