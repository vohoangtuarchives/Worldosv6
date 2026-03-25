'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Search, MapPin, Clock, ChevronRight } from 'lucide-react';

const NarrativeArchive = () => {
  const { chronicles } = useSimulationStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChronicles = useMemo(() => {
    return chronicles.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chronicles, searchQuery]);

  return (
    <div className="w-full h-full bg-void/40 backdrop-blur-3xl rounded-[var(--radius)] border border-cosmos/20 flex flex-col overflow-hidden shadow-2xl">
      {/* Terminal Header */}
      <div className="p-4 border-b border-cosmos/20 bg-void/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cosmos" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Narrative_Archive // v1.0</h3>
        </div>
        <div className="text-[10px] font-mono text-cosmos/60">RECORDS: {chronicles.length}</div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-void/10 border-b border-cosmos/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input 
            type="text"
            placeholder="Search temporal records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cosmos/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* Record List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredChronicles.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                const regionId = ['north_peaks', 'central_basin', 'southern_isles', 'eastern_void'][i % 4];
                window.dispatchEvent(new CustomEvent('map-locate', { detail: { regionId } }));
              }}
              className="group p-3 bg-white/5 border border-white/5 rounded-sm hover:bg-cosmos/10 hover:border-cosmos/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[8px] font-mono text-cosmos/80">TICK_{record.tick?.toString().padStart(6, '0')}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-cosmos/20 rounded-sm hover:bg-cosmos/40">
                  <MapPin className="w-3 h-3 text-cosmos" />
                </button>
              </div>
              <h4 className="text-[11px] font-bold text-white/90 mb-1 group-hover:text-cosmos transition-colors uppercase">{record.title}</h4>
              <p className="text-[9px] text-white/50 leading-tight line-clamp-2 italic font-serif">"{record.content}"</p>
              
              {/* Scanline Effect on Hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredChronicles.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
            <Search className="w-8 h-8 mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-widest">No_Records_Found</p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-3 bg-void/30 border-t border-cosmos/10 flex justify-between items-center">
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Temporal_Mapping_Active</div>
        <ChevronRight className="w-3 h-3 text-white/20" />
      </div>
    </div>
  );
};

export default NarrativeArchive;
