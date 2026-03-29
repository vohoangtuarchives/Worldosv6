'use client';

import React, { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { fetchClientJson } from '@/shared/api/observer-http';
import { HUDCard, HUDBadge, HUDProgress, DataValue } from '@/modules/observer/components/ui/hud-primitives';
import { useObserverUniverseRealtime } from '@/modules/observer/useObserverUniverseRealtime';
import { HUD_TOKENS } from '@/modules/observer/components/ui/design-tokens';
import { RealityCore, VfxConfig } from '@/modules/observer/components/RealityCore';
import type { UniverseDetail } from '@/modules/observer/types';

interface RealityState {
  universe_id: number;
  tick: number;
  era: string;
  pulse: {
    entropy: number;
    stability_index: number;
    entropy_threshold: number;
    collapse_probability: number;
  };
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
  vfx_config: VfxConfig;
}

export default function UniverseRealityStateClient({ 
  universeId 
}: { 
  universeId: string 
}) {
  const [activeLayer, setActiveLayer] = useState<'physical' | 'social' | 'narrative'>('physical');
  
  // Tích hợp Real-time: Lắng nghe sự kiện từ Centrifugo để tự động Invalidate Cache
  const { connectionState } = useObserverUniverseRealtime(universeId);

  // Chuyển sang React Query: Quản lý cache và trạng thái đồng bộ hoàn hảo
  const { data: state, isLoading, isError } = useQuery({
    queryKey: ['observer', 'universe', universeId, 'reality-state'],
    queryFn: () => fetchClientJson<RealityState>(`/api/worldos/universes/${universeId}/reality-state`),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
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

  if (isError || !state) {
    return (
      <div className="p-12 text-center rounded-[2.5rem] border-2 border-dashed border-rose-200 bg-rose-50/30">
        <Activity className="w-12 h-12 text-rose-300 mx-auto mb-4" />
        <p className={HUD_TOKENS.text_hud_label}>Mất liên kết thực tại lượng tử</p>
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
      <header className={HUD_TOKENS.section_header}>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Atom className="w-10 h-10 text-sky-600" />
            <h1 className={HUD_TOKENS.text_hud_title}>
              Người quan sát <span className="text-sky-500/50">v6.2</span>
            </h1>
          </div>
          <p className={HUD_TOKENS.text_hud_label}>
            ID: <span className="text-sky-600">#{universeId}</span> | 
            LINK: <span className={connectionState === 'connected' ? "text-emerald-500 animate-pulse" : "text-amber-500"}>
              {connectionState.toUpperCase()}
            </span>
          </p>
        </div>
        <div className="flex gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <DataValue label="Tick" value={state.tick} unit="τ" />
          <div className="w-px h-10 bg-slate-200" />
          <DataValue label="Độ phức tạp" value={state.civilization.complexity} unit="Ω" />
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className={HUD_TOKENS.bento_grid}>
        
        {/* Reality Core 3D Viewer (VFX Đa Kỷ nguyên) */}
        <div className="md:col-span-2 lg:col-span-3 lg:row-span-2 space-y-6">
          <RealityCore 
            pulse={{
              universeId,
              tick: state.tick,
              entropy: state.pulse.entropy,
              entropyThreshold: state.pulse.entropy_threshold,
              stabilityIndex: state.pulse.stability_index,
              collapseProbability: state.pulse.collapse_probability,
              informationDensity: 1.0, 
              informationalMass: 1.0,
              singularityRisk: 'none',
              activeAttractor: 'none',
              lastMutationVector: null,
              mutationHistorySize: 0
            }} 
            era={state.era} 
            vfxConfig={state.vfx_config}
          />
          
          <HUDCard 
            title="Sơ đồ Lớp thực tại" 
            icon={Layers} 
            className="flex-1"
          >
            <div className="flex flex-col gap-4">
              {(['narrative', 'social', 'physical'] as const).map((layer, idx) => (
                <motion.button
                  key={layer}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveLayer(layer)}
                  className={`relative w-full p-4 rounded-xl border transition-all duration-300 ${
                    activeLayer === layer 
                    ? 'bg-sky-50 border-sky-300 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        layer === 'physical' ? 'bg-emerald-50 text-emerald-600' :
                        layer === 'social' ? 'bg-sky-50 text-sky-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {layer === 'physical' ? <Globe className="w-5 h-5" /> :
                         layer === 'social' ? <Users className="w-5 h-5" /> :
                         <ScrollText className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-sm uppercase tracking-wider text-slate-800">{layerLabels[layer]}</span>
                    </div>
                    {activeLayer === layer && <ChevronRight className="w-4 h-4 text-sky-500" />}
                  </div>
                </motion.button>
              ))}
            </div>
          </HUDCard>
        </div>

        {/* Vital Signs */}
        <HUDCard title="Chỉ số Văn minh" icon={Zap}>
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={HUD_TOKENS.text_hud_label}>Độ phức tạp</span>
                <span className="text-sky-600 font-black italic">{state.civilization.complexity.toFixed(4)}</span>
              </div>
              <HUDProgress value={Math.min(100, state.civilization.complexity * 10)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className={HUD_TOKENS.metric_box}>
                <span className={HUD_TOKENS.text_hud_label}>NÚT TRÍ TUỆ</span>
                <span className={HUD_TOKENS.text_hud_value}>{state.civilization.knowledge_nodes}</span>
              </div>
              <div className={HUD_TOKENS.metric_box}>
                <span className={HUD_TOKENS.text_hud_label}>ĐIỂM TỤ TẬP</span>
                <span className={HUD_TOKENS.text_hud_value}>{state.civilization.settlements.length}</span>
              </div>
            </div>
          </div>
        </HUDCard>

        {/* Materials List */}
        <HUDCard title="Bản thể học Vật chất" icon={Database}>
          <div className="p-0 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar space-y-5">
            {state.materials.map((cat: any) => (
              <div key={cat.ontology} className="space-y-3">
                <div className="flex justify-between items-center bg-sky-50 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-sky-700">{cat.ontology}</span>
                  <span className="text-[9px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-black">{cat.count} UNIT</span>
                </div>
                <div className="grid gap-2">
                  {cat.items.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="text-xs p-3 bg-slate-50 hover:bg-sky-50 rounded-xl flex justify-between items-center border border-slate-100 group transition-all">
                      <span className="text-slate-700 font-black">{item.name}</span>
                      <span className="font-black text-sky-600 bg-white px-2 py-0.5 rounded shadow-sm">{(item.current_value ?? 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </HUDCard>

        {/* Layer Analysis Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLayer}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="md:col-span-3 lg:col-span-4"
          >
            <HUDCard title={`Chẩn đoán Thực tại: ${layerLabels[activeLayer]}`} icon={Activity}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 py-4">
                {(Object.entries(state.layers[activeLayer] || {})).map(([key, value]: [string, any], idx) => (
                  <motion.div 
                    key={key} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: idx * 0.05 }}
                    className={HUD_TOKENS.metric_box}
                  >
                    <span className={HUD_TOKENS.text_hud_label}>{key.replace(/_/g, ' ')}</span>
                    <span className={HUD_TOKENS.text_hud_value}>
                       {typeof value === 'number' ? value.toFixed(2) : Array.isArray(value) ? value.length : 'OK'}
                    </span>
                  </motion.div>
                ))}
              </div>

              {activeLayer === 'social' && (
                <div className="mt-8 space-y-6 border-t-2 border-slate-50 pt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <h4 className={HUD_TOKENS.text_hud_label}>Tập hợp Xã hội phát hiện</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {state.civilization.settlements.map((s: any, i: number) => (
                      <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-sky-300 hover:shadow-md transition-all group overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-black text-slate-900 text-sm">{s.name}</span>
                          <HUDBadge color="primary">{s.population} POP</HUDBadge>
                        </div>
                        <HUDProgress value={(s.stability || 0.5) * 100} />
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
