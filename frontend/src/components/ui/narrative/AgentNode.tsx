import React from 'react';
import { motion } from 'framer-motion';

interface AgentNodeProps {
  id: string;
  provider: string;
  model: string;
  role: string;
  isActive: boolean;
}

export default function AgentNode({ id, provider, model, role, isActive }: AgentNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-4 rounded-xl border backdrop-blur-md transition-all duration-500
      ${isActive 
        ? 'bg-violet-900/40 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
        : 'bg-black/40 border-white/10'}`}
    >
      {/* Pulse effect if active */}
      {isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
        </span>
      )}

      <div className="flex justify-between items-start mb-2">
        <h3 className="text-md font-bold text-white uppercase tracking-wider">{id.replace('_', ' ')}</h3>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${isActive ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-800 text-gray-400'}`}>
          {provider}
        </span>
      </div>
      
      <p className="text-xs text-gray-400 mb-4 h-8">{role}</p>
      
      <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-500 border-t border-white/5 pt-2">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {model}
      </div>
    </motion.div>
  );
}
