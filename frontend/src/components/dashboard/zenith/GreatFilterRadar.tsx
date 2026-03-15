"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

interface Filter {
  id: string;
  name: string;
  status: 'PASSED' | 'ACTIVE' | 'WARNING' | 'DANGER' | 'LOCKED' | 'OPEN';
  progress: number;
}

export const GreatFilterRadar: React.FC<{ universeId: number }> = ({ universeId }) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`/api/worldos/apex/v10/universes/${universeId}/ascension-filters`);
        const json = await res.json();
        if (json.filters) {
          setFilters(json.filters);
        }
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
    const interval = setInterval(fetchFilters, 8000);
    return () => clearInterval(interval);
  }, [universeId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'text-emerald-400';
      case 'DANGER': return 'text-red-500';
      case 'WARNING': return 'text-amber-400';
      case 'OPEN': return 'text-blue-400';
      default: return 'text-white/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case 'DANGER': return <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />;
      case 'WARNING': return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      case 'OPEN': return <UnlockIcon className="w-3 h-3 text-blue-400" />;
      default: return <Lock className="w-3 h-3 text-white/20" />;
    }
  };

  if (loading && filters.length === 0) {
    return <div className="h-64 flex items-center justify-center text-white/10">Scanning Great Filters...</div>;
  }

  return (
    <div className="p-8 bg-emerald-500/[0.02] backdrop-blur-3xl border border-emerald-500/10 rounded-[2.5rem] relative overflow-visible flex flex-col group transition-all duration-500 hover:bg-emerald-500/[0.04]">
      <div className="absolute -top-3 left-8 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Great Filter Array</span>
      </div>

      <div className="flex-1 space-y-4">
        {filters.map((filter) => (
          <div key={filter.id} className="group cursor-help">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">{filter.name}</span>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(filter.status)}
                <span className={`text-[8px] font-mono font-bold ${getStatusColor(filter.status)}`}>
                  {filter.status}
                </span>
              </div>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                className={`h-full rounded-full ${
                  filter.status === 'DANGER' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' :
                  filter.status === 'PASSED' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                  filter.status === 'WARNING' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                  'bg-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${filter.progress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              {/* Scanline effect for V9 feel */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full animate-scan-slow pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      {/* Ascension Progress Indicator */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] mb-2">
            <span className="text-white/40 uppercase tracking-widest">Overall Ascension</span>
            <span className="font-mono text-emerald-400">Phase 02/12</span>
        </div>
        <div className="text-[8px] text-white/30 italic">
          "Nền văn minh đang tiến vào ngưỡng cửa của Singularity. Mọi ranh giới đang lung lay."
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-scan-slow {
          animation: scan-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

const UnlockIcon = ({ className }: { className: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
);
