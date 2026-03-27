'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Atom, 
  Users, 
  ScrollText, 
  Globe, 
  Zap, 
  Database,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';
import { fetchClientJson } from '@/shared/api/observer-http';
import { HUDCard, HUDBadge, HUDProgress, DataValue } from '@/modules/observer/components/ui/hud-primitives';


interface RealityState {
  universe_id: number;
  tick: number;
  layers: {
    physical: any;
    life: any;
    social: any;
    narrative: any;
  };
  materials: any[];
  civilization: {
    complexity: number;
    knowledge_nodes: number;
    settlements: any[];
  };
}

export default function UniverseRealityStateClient({ 
  universeId 
}: { 
  universeId: string 
}) {
  const [state, setState] = useState<RealityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'physical' | 'social' | 'narrative'>('physical');

  useEffect(() => {
    const fetchState = async () => {
      try {
        const data = await fetchClientJson<RealityState>(`/api/worldos/universes/${universeId}/reality-state`);
        setState(data);
      } catch (err) {
        console.error('Failed to fetch reality state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [universeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Atom className="w-12 h-12 text-sky-500 opacity-50" />
        </motion.div>
      </div>
    );
  }

  const layerLabels: Record<string, string> = {
    physical: 'VẬT LÝ',
    social: 'XÃ HỘI',
    narrative: 'TỰ SỰ'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* HUD Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-sky-500 pl-6 py-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Atom className="w-10 h-10 text-sky-600" />
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              Người quan sát <span className="text-sky-500/50">v6.1</span>
            </h1>
          </div>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
            ĐỊNH DANH VŨ TRỤ: <span className="text-sky-600">#{universeId}</span> | TRẠNG THÁI: <span className="text-emerald-500 animate-pulse">ĐÃ ĐỒNG BỘ</span>
          </p>
        </div>
        <div className="flex gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <DataValue label="Tick Hiện tại" value={state?.tick ?? 0} unit="τ" />
          <div className="w-px h-10 bg-slate-200" />
          <DataValue label="Độ trễ Thực tại" value={14.2} unit="ms" />
          <div className="w-px h-10 bg-slate-200" />
          <DataValue label="Độ phức tạp" value={state?.civilization?.complexity ?? 0} unit="Ω" />
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* Topology Viewer (Large Centerpiece) */}
        <HUDCard 
          title="Bản đồ Hình học Đa vũ trụ" 
          icon={Layers} 
          className="md:col-span-2 lg:col-span-3 lg:row-span-2 h-[550px]"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-[85%] h-[85%] border-2 border-sky-500/20 rounded-full animate-[spin_25s_linear_infinite]" />
            <div className="absolute w-[65%] h-[65%] border-2 border-indigo-500/20 rounded-full animate-[spin_18s_linear_infinite_reverse]" />
          </div>

          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
            {(['narrative', 'social', 'physical'] as const).map((layer, idx) => (
              <motion.button
                key={layer}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setActiveLayer(layer)}
                className={`relative w-full max-w-lg p-6 rounded-2xl border transition-all duration-500 overflow-hidden ${
                  activeLayer === layer 
                  ? 'bg-sky-50 border-sky-300 shadow-md' 
                  : 'bg-white border-slate-100 hover:border-sky-200'
                }`}
              >
                {activeLayer === layer && (
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-xl shadow-inner ${
                      layer === 'physical' ? 'bg-emerald-50 text-emerald-600' :
                      layer === 'social' ? 'bg-sky-50 text-sky-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {layer === 'physical' ? <Globe className="w-7 h-7" /> :
                       layer === 'social' ? <Users className="w-7 h-7" /> :
                       <ScrollText className="w-7 h-7" />}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-lg uppercase tracking-wider text-slate-800">CHIỀU KÍCH {layerLabels[layer]}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {layer === 'physical' ? 'Trạng thái Vật chất & Entropy' :
                         layer === 'social' ? 'Độ phức tạp Cấu trúc & Tập hợp' :
                         'Bản ghi Nhân quả Tự sự'}
                      </div>
                    </div>
                  </div>
                  {activeLayer === layer && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-sky-500 animate-pulse">QUÉT HOẠT ĐỘNG</span>
                      <ChevronRight className="w-5 h-5 text-sky-500" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </HUDCard>

        {/* Vital Signs */}
        <HUDCard title="Chỉ số Văn minh" icon={Zap}>
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-3">
                <span className="text-slate-400 uppercase tracking-widest">Véc-tơ Độ phức tạp</span>
                <span className="text-sky-600 italic">{(state?.civilization?.complexity ?? 0).toFixed(4)}</span>
              </div>
              <HUDProgress value={Math.min(100, (state?.civilization?.complexity ?? 0) * 10)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">NÚT</div>
                <div className="text-2xl font-black text-slate-900">{state?.civilization?.knowledge_nodes ?? 0}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ĐIỂM</div>
                <div className="text-2xl font-black text-slate-900">{state?.civilization?.settlements?.length ?? 0}</div>
              </div>
            </div>

            <div className="pt-4">
               <div className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Phân bổ Nguồn lực</div>
               <div className="flex gap-1.5 h-3">
                  <div className="w-[40%] bg-sky-500/40 rounded-full" />
                  <div className="w-[25%] bg-indigo-500/40 rounded-full" />
                  <div className="w-[15%] bg-emerald-500/40 rounded-full" />
                  <div className="w-[20%] bg-slate-200 rounded-full" />
               </div>
            </div>
          </div>
        </HUDCard>

        {/* Materials List */}
        <HUDCard title="Bản thể học Vật chất" icon={Database}>
          <div className="p-0 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-5">
              {state?.materials.map((cat: any) => (
                <div key={cat.ontology} className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-600/70 flex justify-between items-center bg-sky-50 px-3 py-1 rounded-lg">
                    <span>{cat.ontology}</span>
                    <span className="text-[9px] bg-sky-500 text-white px-2 py-0.5 rounded-full">{cat.count} ĐƠN VỊ</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {cat.items.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="text-xs p-3 bg-slate-50 hover:bg-sky-50 rounded-xl flex justify-between items-center transition-all border border-slate-100 group">
                        <span className="text-slate-700 font-black group-hover:text-sky-700">{item.name}</span>
                        <span className="font-black text-sky-600 bg-white px-2 py-0.5 rounded shadow-sm text-[10px]">{(item.current_value ?? 0).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </HUDCard>

        {/* Layer Analysis Detail (Bottom Wide) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLayer}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="md:col-span-3 lg:col-span-4"
          >
            <HUDCard title={`Chẩn đoán Thực tại: ${layerLabels[activeLayer]}`} icon={Activity}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 py-4">
                {(Object.entries(state?.layers[activeLayer] || {})).map(([key, value]: [string, any], idx) => (
                  <motion.div 
                    key={key} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: idx * 0.05 }}
                    className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner"
                  >
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xl font-black text-slate-900 flex items-baseline gap-2">
                       {typeof value === 'number' ? value.toFixed(3) : 
                        Array.isArray(value) ? value.length : 
                        'ỔN ĐỊNH'}
                      <span className="text-[9px] text-sky-500/50 font-black uppercase tracking-widest">VAL</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {activeLayer === 'social' && (
                <div className="mt-8 space-y-6 border-t-2 border-slate-50 pt-8">
                  <h4 className="text-xs font-black tracking-widest text-slate-400 mb-6 uppercase flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    Các Tập hợp Xã hội được phát hiện (Khu dân cư)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {state?.civilization.settlements.map((s: any, i: number) => (
                      <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-sky-300 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sky-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-100 transition-colors" />
                        <div className="relative">
                          <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{s.name}</span>
                            <HUDBadge color="primary">{s.population} DÂN</HUDBadge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ ổn định</div>
                               <HUDProgress value={(s.stability || 0.5) * 100} />
                            </div>
                            <span className="text-sm font-black text-sky-600">{(s.stability || 0.5).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </HUDCard>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
