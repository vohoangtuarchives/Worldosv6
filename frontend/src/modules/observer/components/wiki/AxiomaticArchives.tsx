'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Atom, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

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

interface AxiomDetail {
  axiom: {
    id: string;
    name: string;
    description: string;
    default_value: any;
    dimension: string;
    tier: number;
    impact: string[];
  };
  drift_logs: { tick: number; value: number }[];
}

export default function AxiomaticArchives({ 
  universeId, 
  axiomId 
}: { 
  universeId: string;
  axiomId: string;
}) {
  const [data, setData] = useState<AxiomDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wiki/${universeId}/axiom/${axiomId}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [universeId, axiomId]);

  if (loading) return <div className="animate-pulse h-64 bg-white/5 rounded-xl" />;
  if (!data) return <div>Không tìm thấy dữ liệu hằng số.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Atom className="w-6 h-6 text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight text-white">{data.axiom.name}</h1>
          </div>
          <p className="text-muted-foreground italic font-light max-w-2xl">
            "{data.axiom.description}"
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1 border-blue-500/30 text-blue-400 bg-blue-500/5">
          Tier {data.axiom.tier}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/40 border-white/5">
          <div className="p-4 border-b border-white/5 uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
            <Info className="w-3 h-3" /> Metadata
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-muted-foreground">ID</span>
              <span className="text-xs font-mono text-white">{data.axiom.id}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-muted-foreground">Dimension</span>
              <Badge variant="secondary" className="text-[10px] uppercase text-white">{data.axiom.dimension}</Badge>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-muted-foreground">Default Value</span>
              <span className="text-sm font-bold text-blue-400">{data.axiom.default_value}</span>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 bg-black/40 border-white/5">
          <div className="p-4 border-b border-white/5 uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Drift Logs (Lịch sử Biến động)
          </div>
          <div className="p-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.drift_logs}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="tick" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/5">
        <div className="p-4 border-b border-white/5 uppercase text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-yellow-500" /> Vùng Ảnh Hưởng (Engine Impacts)
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {data.axiom.impact.map((field) => (
              <Badge key={field} variant="outline" className="bg-white/5 border-white/10 text-white/70">
                {field}
              </Badge>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 italic">
            * Sự thay đổi của hằng số này sẽ ảnh hưởng trực tiếp đến các tham số engine Rust phía trên.
          </p>
        </div>
      </Card>
    </div>
  );
}
