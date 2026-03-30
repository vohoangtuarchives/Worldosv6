'use client';

import React, { useEffect, useState } from 'react';

import { Atom, TrendingUp, Info, AlertTriangle, Zap } from 'lucide-react';
import Link from 'next/link';
import { fetchClientJson } from '@/shared/api/observer-http';
import { HUDCard, HUDBadge } from '@/modules/observer/components/ui/hud-primitives';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';


interface AxiomDetail {
  axiom: {
    id: string;
    name: string;
    description: string;
    default_value: number | string | boolean;
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
        const data = await fetchClientJson<AxiomDetail>(`/api/wiki/${universeId}/axiom/${axiomId}`);
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [universeId, axiomId]);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100/50 rounded-[2rem]" />;
  if (!data) return <div className="p-8 text-center text-slate-400">Không tìm thấy dữ liệu hằng số.</div>;

  const defaultVal = typeof data.axiom.default_value === 'number' ? data.axiom.default_value : undefined;

  return (
    <div className="space-y-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-500">
               <Atom className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">{data.axiom.name}</h1>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">AXIOMATIC ARCHIVE v3.1</p>
            </div>
          </div>
          <p className="text-lg leading-relaxed text-slate-500 font-medium italic max-w-3xl">
            &ldquo;{data.axiom.description}&rdquo;
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <HUDBadge color="primary" className="text-sm px-6 py-2 rounded-2xl font-black">
            BẬC {data.axiom.tier}
          </HUDBadge>
          <Link 
            href={`/universes/${universeId}/omen-weaver`}
            className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 flex items-center gap-2 group tracking-widest uppercase transition-colors"
          >
            <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" /> TÁI CẤU TRÚC THỰC TẠI
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <HUDCard title="Thông tin Cơ bản" icon={Info} className="bg-white border-slate-100 shadow-sm">
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Định danh (ID)</span>
              <span className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">{data.axiom.id}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chiều không gian</span>
              <HUDBadge color="neutral" className="px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border-slate-100">{data.axiom.dimension}</HUDBadge>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá trị Mặc định</span>
              <span className="text-base font-black text-emerald-600">{data.axiom.default_value}</span>
            </div>
          </div>
        </HUDCard>

        <HUDCard title="Lịch sử Biến động (Drift Logs)" icon={TrendingUp} className="md:col-span-2 bg-white border-slate-100 shadow-sm">
          <div className="h-[250px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.drift_logs}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="tick" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#059669', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#64748b' }}
                />
                {defaultVal !== undefined && (
                  <ReferenceLine y={defaultVal} stroke="#e2e8f0" strokeDasharray="5 5" label={{ value: 'MẶC ĐỊNH', position: 'right', fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                )}
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </HUDCard>
      </div>

      <HUDCard title="Vùng ảnh hưởng Hệ thống (Engine Impacts)" icon={AlertTriangle} className="bg-white border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-3 mt-6">
          {data.axiom.impact.map((field) => (
            <HUDBadge key={field} color="neutral" className="px-5 py-2 rounded-xl bg-slate-50 text-slate-600 border-slate-100 font-black uppercase text-[10px] tracking-widest">
              {field}
            </HUDBadge>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <Info className="w-4 h-4 text-amber-500" />
          <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest leading-relaxed">
            Sự thay đổi của hằng số này sẽ ảnh hưởng trực tiếp đến các tham số hệ thống phía trên.
          </p>
        </div>
      </HUDCard>
    </div>
  );
}

