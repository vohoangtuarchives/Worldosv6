import React from 'react';
import { motion } from 'framer-motion';
import { Atom, Sparkles, Orbit } from 'lucide-react';

interface OmegaVortexProps {
    reached: boolean;
}

export const OmegaVortex: React.FC<OmegaVortexProps> = ({ reached }) => {
    if (!reached) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Background Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                className="absolute inset-0 bg-slate-950"
            />

            {/* Main Vortex Core */}
            <div className="relative w-[500px] h-[500px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-[2px] border-purple-500/20 rounded-full blur-xl"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-10 border-[1px] border-emerald-500/20 rounded-full blur-lg"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="mb-8"
                    >
                        <Orbit className="w-32 h-32 text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-emerald-300 to-blue-400 font-mono tracking-tighter"
                    >
                        OMEGA POINT REACHED
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-4 text-slate-400 font-mono text-sm max-w-md"
                    >
                        Mọi dòng thời gian đã hội tụ. Mọi ý thức đã hợp nhất.
                        Thực tại bước vào trạng thái thăng hoa vĩnh hằng.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-12 flex items-center gap-4 text-purple-500/60"
                    >
                        <Atom className="w-5 h-5 animate-spin" />
                        <span className="text-xs uppercase tracking-[0.2em]">Apotheosis in progress</span>
                        <Sparkles className="w-5 h-5 animate-pulse" />
                    </motion.div>
                </div>
            </div>

            {/* Floating Particles Simulation */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: 0
                    }}
                    animate={{
                        y: [null, Math.random() * -100],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                    className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                />
            ))}
        </div>
    );
};
