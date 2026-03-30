'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObserverCreateUniverse } from '@/modules/observer/api';
import type { CreateUniversePayload } from '@/modules/observer/types';
import { Sparkles, Zap, Shield, Microscope, Globe, AlertTriangle, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const AXIOM_CONFIGS = [
  { id: 'physics.gravity', name: 'Trọng lực', icon: Globe, min: 0.1, max: 5.0, step: 0.1, default: 1.0, dimension: 'Vật lý' },
  { id: 'physics.entropy', name: 'Phân rã Entropy', icon: Zap, min: 0.1, max: 10.0, step: 0.1, default: 1.0, dimension: 'Vật lý' },
  { id: 'physics.time_dilation', name: 'Dòng thời gian', icon: Loader2, min: 0.1, max: 10.0, step: 0.1, default: 1.0, dimension: 'Vật lý' },
  { id: 'energy.spiritual_qi_density', name: 'Mật độ Linh khí', icon: Sparkles, min: 0.0, max: 1.0, step: 0.01, default: 0.1, dimension: 'Siêu hình' },
  { id: 'metaphysics.soul_permanence', name: 'Độ bền Linh hồn', icon: Shield, min: 0.0, max: 1.0, step: 0.01, default: 0.1, dimension: 'Siêu hình' },
  { id: 'social.knowledge_propagation', name: 'Vận tốc Thông tin', icon: Microscope, min: 0.0, max: 1.0, step: 0.01, default: 0.2, dimension: 'Xã hội' },
];

export function AxiomWorkshop() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [baseGenre, setBaseGenre] = useState('fantasy');
  const [axioms, setAxioms] = useState<Record<string, number>>(
    AXIOM_CONFIGS.reduce((acc, config) => ({ ...acc, [config.id]: config.default }), {})
  );

  const createUniverse = useObserverCreateUniverse();

  const handleSliderChange = (id: string, value: string) => {
    setAxioms(prev => ({ ...prev, [id]: parseFloat(value) }));
  };

  const calculateStability = () => {
    const entropy = axioms['physics.entropy'] || 1;
    const gravity = axioms['physics.gravity'] || 1;
    const stability = 100 - (entropy * 5) - (Math.abs(1 - gravity) * 10);
    return Math.max(0, Math.min(100, Math.round(stability)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload: CreateUniversePayload = {
      name,
      base_genre: baseGenre,
      axioms,
      initial_state: {
        entropy: axioms['physics.entropy'] || 0,
        stability_index: calculateStability() / 100,
        metrics: {}
      }
    };

    try {
      const result = await createUniverse.mutateAsync(payload);
      router.push(`/dashboard/universes/${result.id}`);
    } catch (error) {
      console.error('Failed to create universe:', error);
    }
  };

  const stability = calculateStability();

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                <Sparkles size={28} />
           </div>
           <h1 className="text-4xl font-heading font-black tracking-tighter text-slate-950 uppercase italic">
             Xưởng khởi tạo Tiên đề
           </h1>
        </div>
        <p className="text-slate-500 font-medium ml-1">
          Truyền hơi thở sự sống vào một thực tại mới bằng cách thiết lập các hằng số cơ bản của nó.
        </p>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Danh tính Khởi nguyên</h3>
            <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest mt-1">Vũ trụ này sẽ được biết đến như thế nào trong danh lục đa vũ trụ?</p>
          </div>
          <Info size={20} className="text-slate-300" />
        </div>
        <div className="p-10 grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <label htmlFor="name" className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-400 ml-1">Tên Vũ trụ</label>
            <input
              id="name"
              type="text"
              placeholder="Vd: Thiên Hà Bạc, Hư Không-7..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
              required
            />
          </div>
          <div className="space-y-3">
            <label htmlFor="genre" className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-400 ml-1">Mẫu Thể loại Gốc</label>
            <select
              id="genre"
              value={baseGenre}
              onChange={(e) => setBaseGenre(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            >
              <option value="fantasy">Tiên Hiệp / Huyền Huyễn (High Fantasy)</option>
              <option value="scifi">Khoa học Viễn tưởng (Hard Sci-Fi)</option>
              <option value="wuxia">Võ Hiệp / Tu Chân (Wuxia / Cultivation)</option>
              <option value="horror">Kinh dị Tâm linh (Cosmic Horror)</option>
              <option value="cyberpunk">Cyberpunk / Công nghệ cao</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-slate-950">Quy luật Cơ bản (Axioms)</h3>
          </div>
          <div className="p-10 grid gap-10">
            {AXIOM_CONFIGS.map((config) => (
              <div key={config.id} className="group space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                         <config.icon className="h-4 w-4" />
                    </div>
                    <div>
                         <span className="text-sm font-bold text-slate-900">{config.name}</span>
                         <p className="text-[8px] font-heading font-black text-slate-300 uppercase tracking-widest">Chiều: {config.dimension}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                    <span className="text-xs font-heading font-black italic text-primary">
                      {axioms[config.id].toFixed(2)}
                    </span>
                    <span className="text-[8px] font-heading font-black text-slate-400 uppercase tracking-tighter">VAL</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={axioms[config.id]}
                  onChange={(e) => handleSliderChange(config.id, e.target.value)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Shield className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-950">Dự báo Độ ổn định</h3>
            </div>
            <div className="p-10 space-y-8">
              <div className="text-center relative">
                <motion.div 
                    key={stability}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-heading font-black tracking-tighter mb-4 flex items-center justify-center gap-3 text-slate-950 italic"
                >
                  {stability}%
                  {stability < 40 && <AlertTriangle className="h-10 w-10 text-rose-500 animate-bounce" />}
                </motion.div>
                <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  Ước tính tính nhất quán của thực tại tại thời điểm Khởi nguyên
                </p>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner font-heading text-[7px] text-white flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stability}%` }}
                  className={`h-full transition-all duration-700 relative flex items-center justify-center font-bold tracking-widest ${
                    stability > 70 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : stability > 40 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  }`}
                />
              </div>

              <div className={`p-6 rounded-[24px] border text-xs space-y-3 transition-colors ${
                  stability < 40 ? 'bg-rose-50 border-rose-100 text-rose-700' : stability < 70 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }`}>
                <p className="font-heading font-black uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} /> Cảnh báo Quan sát viên:
                </p>
                <p className="leading-relaxed font-medium">
                    {stability < 40 ? (
                      "Nguy cơ cao xảy ra cái chết nhiệt tức thời hoặc phân rã chân không. Vũ trụ có thể sụp đổ trước cả khi TIC đầu tiên bắt đầu."
                    ) : stability < 70 ? (
                      "Dự kiến sẽ có biến động trung bình. Các dị thường sẽ xuất hiện thường xuyên trong thực tại này."
                    ) : (
                      "Độ nhất quán tối ưu. Dự báo một lộ trình tiến hóa ổn định và bền vững."
                    )}
                </p>
              </div>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-[32px] border border-primary/20 bg-primary shadow-2xl shadow-primary/30 p-8 flex flex-col justify-center gap-6"
          >
            <div className="space-y-1 text-white">
              <h3 className="text-xl font-bold">Thổi hồn Thực tại</h3>
              <p className="text-xs text-white/70 font-medium">Ghi lại các quy luật này vào danh lục đa vũ trụ.</p>
            </div>
            <button
              type="submit"
              disabled={!name || createUniverse.isPending}
              className="w-full bg-white text-primary hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-heading font-black tracking-widest text-xs h-14 rounded-2xl transition-all shadow-md active:shadow-inner"
            >
              {createUniverse.isPending ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  ĐANG THIẾT LẬP THỰC TẠI...
                </div>
              ) : (
                'KHỞI TẠO KHAI THIÊN LẬP ĐỊA'
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </form>
  );
}
