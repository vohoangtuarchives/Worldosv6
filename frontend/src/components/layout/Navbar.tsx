import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Orbit, Zap } from 'lucide-react';


const Navbar = () => {
  const { 
    civilizationEra, 
    currentTick, 
    transition
  } = useSimulationStore();

  return (
    <nav className="fixed top-0 left-[78px] right-0 h-16 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md border-b border-slate-100 z-40 transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-sky-600 uppercase tracking-[0.2em] font-bold">Trạng thái Quan sát</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-xs font-mono font-bold tracking-tight text-slate-800 uppercase">
              Hoạt động
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-50 border border-sky-100">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-sky-600" />
            <span className="text-xs font-mono font-bold text-sky-600 uppercase">{civilizationEra || 'Genesis'}</span>
          </div>
          <div className="w-[1px] h-3 bg-slate-200" />
          <span className="text-[10px] font-mono text-slate-500 tracking-tighter">TIC: {currentTick.toLocaleString()}</span>
        </div>
      </div>


      <div className="flex items-center gap-6">
        {/* Quick Stats Grid */}
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-mono text-slate-500 mr-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-slate-400">Không gian</span>
            <span className="text-slate-700 font-bold uppercase">Vũ trụ</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-slate-400">Chế độ</span>
            <span className="text-slate-700 font-bold uppercase">Người quan sát</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-slate-400">Mô hình</span>
            <span className="text-sky-600 font-bold truncate max-w-[80px] uppercase">{transition?.target || 'Ổn định'}</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 shadow-sm border border-sky-400">
            <Orbit size={16} className="text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
