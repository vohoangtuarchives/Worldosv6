"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scroll, Sparkles, Ghost, Library, History, Compass } from 'lucide-react';

interface Relic {
    id: number;
    name: string;
    rarity: string;
    description: string;
    power_vector: Record<string, number>;
    metadata: any;
    origin_universe?: {
        name: string;
    };
}

export function VoidArchive({ universeId }: { universeId: number }) {
    const [relics, setRelics] = useState<Relic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelics = async () => {
            try {
                const res = await api.universe(universeId);
                const world = res.data?.world;
                if (world && world.relics) {
                    setRelics(world.relics);
                }
            } catch (err) {
                console.error("Failed to fetch Ancient Echoes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRelics();
        const interval = setInterval(fetchRelics, 15000);
        return () => clearInterval(interval);
    }, [universeId]);

    const getRarityStyles = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'mythic': return 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
            case 'legendary': return 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            case 'epic': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            case 'rare': return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
            default: return 'text-slate-400 border-slate-500/50 bg-slate-500/10';
        }
    };

    return (
        <Card className="bg-slate-950/95 border-amber-900/40 backdrop-blur-3xl border-r-2 relative overflow-hidden group">
            {/* Parchment Background Texture Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.03] pointer-events-none" />

            <CardHeader className="pb-2 border-b border-amber-900/20">
                <CardTitle className="text-[10px] font-black flex items-center justify-between text-amber-600 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                        <Library className="w-3 h-3 text-amber-500" />
                        Thánh Đường Dư Âm Cổ Xưa
                    </div>
                    {relics.length > 0 && (
                        <span className="text-[9px] font-mono text-amber-900/60 ">{relics.length} CHƯƠNG HỒI</span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
                {relics.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-800 gap-4">
                        <div className="relative">
                            <Compass className="w-12 h-12 opacity-10 animate-[spin_10s_linear_infinite]" />
                            <Ghost className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-600">Những trang giấy trắng</p>
                            <p className="text-[8px] text-slate-700 mt-2 max-w-[180px] leading-relaxed italic">
                                "Lịch sử của Hư Không chưa được viết lời nào. Hãy để thực tại rạn nứt để tìm thấy dư âm."
                            </p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-6">
                            {relics.map(relic => (
                                <div key={relic.id} className="relative pl-4 border-l-2 border-amber-900/20 hover:border-amber-500/40 transition-all group/item">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-900/40 group-hover/item:bg-amber-500 transition-colors" />

                                    <div className="flex justify-between items-center mb-1">
                                        <Badge variant="outline" className={`text-[8px] font-serif italic px-2 py-0 h-4 uppercase tracking-tighter ${getRarityStyles(relic.rarity)}`}>
                                            {relic.rarity}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-[8px] text-amber-900/50 uppercase font-mono">
                                            <History className="w-2 h-2" />
                                            TICK {relic.metadata?.manifested_at_tick || '??'}
                                        </div>
                                    </div>

                                    <h4 className="text-[13px] font-serif font-bold text-amber-100/90 mb-2 tracking-tight group-hover/item:text-amber-400 transition-colors">
                                        {relic.name}
                                    </h4>

                                    <div className="bg-amber-500/5 rounded-lg p-3 mb-3 border border-amber-500/10 italic">
                                        <p className="text-[10px] text-amber-200/60 leading-relaxed font-serif">
                                            "{relic.description}"
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                                            <Sparkles className="w-2 h-2 text-amber-500" />
                                            Dư chấn thực tại
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(relic.power_vector).map(([key, val]) => (
                                                <div key={key} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5">
                                                    <span className="text-[8px] text-slate-400 font-mono">{key}</span>
                                                    <span className="text-[9px] text-amber-500 font-black font-mono">+{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {relic.origin_universe && (
                                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-600 italic">
                                            <span>Khởi nguồn từ: {relic.origin_universe.name}</span>
                                            <Scroll className="w-2 h-2 opacity-30" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

            {/* Artistic Border Decals */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-900/5 blur-3xl pointer-events-none rounded-full" />
        </Card>
    );
}
