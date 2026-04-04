"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompendiumPage() {
  const [artifacts, setArtifacts] = useState<any[]>([]);

  useEffect(() => {
    setArtifacts([
      { id: 1, name: "Phiến đá Rosetta Kép", mass: 2.5, knowledge: 0.88, lore: "Chứa đựng ngôn ngữ của hai nền văn minh đã sụp đổ.", imageUrl: null },
      { id: 2, name: "Ngọc Lõi Entropy", mass: 0.5, knowledge: 0.99, lore: "Vật phẩm tự phát sáng, bóp méo không thời gian xung quanh nó với mật độ tri thức dày đặc.", imageUrl: null }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-black/90 text-white p-10 font-mono">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-600 mb-8">
          Matter Compendium
        </h1>
        <p className="text-gray-400 mb-12">Kho tàng tạo tác và cổ vật được rèn từ lửa của Engine.</p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {artifacts.map((art, i) => (
              <motion.div 
                key={art.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.02, boxShadow: "0px 0px 20px rgba(20,184,166,0.4)", borderColor: "rgba(20,184,166,0.6)" }}
                className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-900/10 to-black p-6 transition-all"
              >
              
              {/* Holographic Blueprint Container */}
              <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-white/5 bg-black/60 group">
                {art.imageUrl ? (
                  <img src={art.imageUrl} alt={art.name} className="w-full h-full object-cover mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-teal-900/30 to-black">
                    <div className="w-10 h-10 border border-teal-500/50 bg-teal-500/10 animate-pulse rotate-45" />
                    <span className="text-[10px] text-teal-500/40 mt-3 uppercase tracking-widest font-mono">Synthesizing Blueprint...</span>
                  </div>
                )}
                {/* Cyberpunk grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none mix-blend-overlay" />
              </div>

              <h2 className="text-2xl font-semibold text-teal-300 mb-1">{art.name}</h2>
              <div className="flex gap-4 text-xs text-teal-100/50 mb-4">
                <span>Mass: {art.mass}</span>
                <span>Knowledge: {art.knowledge}</span>
              </div>
              <p className="text-gray-300 italic">
                {art.lore}
              </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
