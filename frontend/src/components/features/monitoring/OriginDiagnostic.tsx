"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dna, Sunrise, Moon, TreePine, Info } from 'lucide-react';

interface OriginDiagnosticProps {
    origin: string;
    description?: string;
}

export function OriginDiagnostic({ origin, description }: OriginDiagnosticProps) {
    const getOriginConfig = (origin: string) => {
        const o = origin.toLowerCase();
        if (o === 'void-born') return {
            icon: <Moon className="w-5 h-5 text-purple-400" />,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/30',
            label: 'Hư Vô Khởi Nguyên',
            traits: ['Entropy High', 'Dark Energy', 'Spiritual Resonance']
        };
        if (o === 'solar') return {
            icon: <Sunrise className="w-5 h-5 text-amber-400" />,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            label: 'Thái Dương Khởi Nguyên',
            traits: ['Energy Peak', 'Order Bias', 'Rapid Tech Evolution']
        };
        if (o === 'primeval') return {
            icon: <TreePine className="w-5 h-5 text-emerald-400" />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            label: 'Nguyên Thủy Khởi Nguyên',
            traits: ['Biological Stability', 'Organic Growth', 'Resource Rich']
        };
        return {
            icon: <Dna className="w-5 h-5 text-blue-400" />,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            label: 'Di Sản Văn Minh',
            traits: ['Heritage Balanced', 'Cultural Density', 'Stable Seed']
        };
    };

    const config = getOriginConfig(origin);

    return (
        <Card className={`bg-slate-900/60 backdrop-blur-md border-white/5 overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Dna className="w-4 h-4 text-cyan-500" />
                    Seed Analysis (DNA Khởi Nguyên)
                </CardTitle>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />
                    <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={`flex items-center gap-4 p-3 rounded-lg ${config.bg} ${config.border} border`}>
                    <div className={`p-2 rounded-full bg-black/30`}>
                        {config.icon}
                    </div>
                    <div>
                        <div className={`text-sm font-bold ${config.color} tracking-tight`}>{config.label}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">{origin} Architecture</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Đặc tính di truyền
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {config.traits.map(trait => (
                            <Badge key={trait} variant="secondary" className="bg-slate-800 text-slate-300 text-[9px] font-mono py-0 border-white/5">
                                {trait}
                            </Badge>
                        ))}
                    </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-3">
                    {description || "Dữ liệu khởi nguyên này xác định các tham số vật lý và tâm linh nền tảng cho sự tiến hóa của toàn bộ các nhánh trong đa vũ trụ này."}
                </p>
            </CardContent>
        </Card>
    );
}
