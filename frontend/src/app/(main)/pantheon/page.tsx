"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PantheonPage() {
  const [celebrities, setCelebrities] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would use a Centrifugo socket or fetch from an API
    setCelebrities([
      { id: 1, name: "Thales The Observer", vocation: "Architect of Thought", fame: 0.95, biography: "Kẻ soi sáng bầu trời đêm bằng tri thức nguyên thủy.", imageUrl: null },
      { id: 2, name: "Valkyron Điên Loạn", vocation: "Supreme Ruler", fame: 0.85, biography: "Sinh ra từ tro tàn của một cuộc thánh chiến khốc liệt.", imageUrl: null }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-black/90 text-white p-10 font-mono">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-600 mb-8">
          Pantheon — Hall of Figures
        </h1>
        <p className="text-gray-400 mb-12">Những cá thể vượt qua ranh giới entropy để để lại dấu ấn trên mạch thời gian.</p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {celebrities.map((vip, i) => (
              <motion.div 
                key={vip.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-amber-500/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              >
              <div className="absolute top-0 right-0 p-4 opacity-10">✦</div>
              
              {/* Holographic Portrait Container */}
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-white/5 bg-black/50 group">
                {vip.imageUrl ? (
                  <img src={vip.imageUrl} alt={vip.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 filter contrast-125" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-900/20 to-black">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500/30 animate-[spin_10s_linear_infinite]" />
                    <span className="text-[10px] text-amber-500/50 mt-2 uppercase tracking-widest">Rendering Intel...</span>
                  </div>
                )}
                {/* Scanline overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none mix-blend-overlay" />
              </div>

              <h2 className="text-2xl font-semibold text-amber-400">{vip.name}</h2>
              <div className="text-xs text-amber-200/60 uppercase mt-1 mb-4 flex items-center justify-between">
                <span>{vip.vocation}</span>
                <span>Fame {Math.round(vip.fame * 100)}%</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                "{vip.biography}"
              </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
