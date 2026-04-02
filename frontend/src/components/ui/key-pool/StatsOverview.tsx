'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, 
    ShieldCheck, 
    Clock, 
    HardDrive 
} from 'lucide-react';
import { AiKey } from '@/hooks/useKeyPool';

interface StatsProps {
    keys: AiKey[];
}

const StatCard = ({ label, value, icon: Icon, color, shadowColor }: any) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="p-6 rounded-3xl bg-[#111116] border border-slate-800/50 relative overflow-hidden group"
    >
        <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500 shadow-[0_0_15px_${shadowColor}]`} />
        
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-3xl font-black text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
            </div>
        </div>
    </motion.div>
);

export default function StatsOverview({ keys }: StatsProps) {
    const total = keys.length;
    const active = keys.filter(k => k.status === 'active').length;
    const cooldown = keys.filter(k => k.status === 'cooldown').length;
    const premium = keys.filter(k => k.tier === 'premium').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
                label="Total Keys" 
                value={total} 
                icon={HardDrive} 
                color="slate" 
                shadowColor="rgba(100,116,139,0.3)" 
            />
            <StatCard 
                label="Active Now" 
                value={active} 
                icon={Zap} 
                color="emerald" 
                shadowColor="rgba(16,185,129,0.3)" 
            />
            <StatCard 
                label="In Cooldown" 
                value={cooldown} 
                icon={Clock} 
                color="amber" 
                shadowColor="rgba(245,158,11,0.3)" 
            />
            <StatCard 
                label="Premium Assets" 
                value={premium} 
                icon={ShieldCheck} 
                color="cyan" 
                shadowColor="rgba(34,211,238,0.3)" 
            />
        </div>
    );
}
