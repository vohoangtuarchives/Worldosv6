'use client';

import React from 'react';
import AkashicLibrary from '@/components/Simulation/AkashicLibrary';
import VocationConstellation from '@/components/Simulation/VocationConstellation';
import { motion } from 'framer-motion';

export default function WorldLibraryPage() {
  return (
    <div className="bg-slate-950 min-h-screen pb-20">
      <AkashicLibrary />
      
      <div className="max-w-6xl mx-auto px-8 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <VocationConstellation />
        </motion.div>
        
        <footer className="mt-20 pt-8 border-t border-white/5 text-center text-slate-600 text-sm">
          <p>© 2026 WorldOS Simulation Ethics Committee. All reality modifications are logged.</p>
        </footer>
      </div>
    </div>
  );
}
