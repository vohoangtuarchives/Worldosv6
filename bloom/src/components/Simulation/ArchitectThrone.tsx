import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, ShieldAlert, Sparkles, Flame, History } from 'lucide-react';
import { toast } from 'sonner';

interface Edict {
    id: string;
    name: string;
    target: string;
    multiplier: number;
    flavor: string;
}

export interface ActiveEdict {
    id: string;
    name: string;
    decreed_by: string;
    expires_at: number;
    target: string;
}

export const ArchitectThrone: React.FC<{ universeId: number; currentTick: number; activeEdicts: Record<string, ActiveEdict> }> = ({ universeId, currentTick, activeEdicts }) => {
    const [edicts, setEdicts] = useState<Record<string, Edict>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEdicts = async () => {
            try {
                const data = await api.edicts();
                setEdicts(data);
            } catch (error) {
                console.error("Failed to fetch edicts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEdicts();
    }, []);

    const handleDecree = async (edictId: string) => {
        try {
            await api.decree(universeId, edictId);
            toast.success("Sắc lệnh đã được ban hành!");
        } catch (error: any) {
            toast.error(`Thất bại: ${error.message}`);
        }
    };

    const getEdictIcon = (id: string) => {
        if (id?.includes('tribulation')) return <Flame className="w-4 h-4 text-red-500" />;
        if (id?.includes('revival')) return <Sparkles className="w-4 h-4 text-green-500" />;
        if (id?.includes('chaos')) return <ShieldAlert className="w-4 h-4 text-amber-500" />;
        return <Zap className="w-4 h-4 text-cyan-500" />;
    };

    if (loading) return null;

    const activeEdictList = Object.values(activeEdicts);

    return (
        <Card className="bg-slate-900/90 border-purple-900/50 border-t-2 border-t-purple-500/50 shadow-2xl">
            <CardHeader className="border-b border-purple-900/30">
                <CardTitle className="text-purple-400 font-mono flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 fill-purple-500" />
                    NGAI VÀNG KIẾN TRÚC SƯ (ARCHITECT'S THRONE)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Available Edicts */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        BAN HÀNH SẮC LỆNH
                    </h3>
                    <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-3">
                            {Object.values(edicts).map((edict) => (
                                <div key={edict.id} className="bg-slate-950/50 border border-purple-900/20 p-3 rounded-md hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-mono text-sm text-purple-300 flex items-center gap-2">
                                            {getEdictIcon(edict.id)}
                                            {edict.name}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs border-purple-900 hover:bg-purple-950 hover:text-purple-400"
                                            onClick={() => handleDecree(edict.id)}
                                            disabled={!!activeEdicts[edict.id]}
                                        >
                                            {activeEdicts[edict.id] ? "Đang hiệu lực" : "BAN HÀNH"}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mb-2 leading-tight">
                                        {edict.flavor}
                                    </p>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="bg-slate-900 text-[9px] text-slate-400">
                                            Mục tiêu: {edict.target.toUpperCase()}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-slate-900 text-[9px] text-purple-400">
                                            Hệ số: x{edict.multiplier}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right: Active Governance */}
                <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3 h-3" />
                        SẮC LỆNH ĐANG THỰC THI
                    </h3>
                    <div className="flex-1 bg-slate-950/80 border border-purple-900/40 rounded-md p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

                        {activeEdictList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-center">
                                <Zap className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs">Chưa có đạo luật nào được thực thi.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeEdictList.map((ae) => (
                                    <div key={ae.id} className="relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-purple-400"># {ae.name}</span>
                                            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                                CÒN LẠI: {Math.max(0, ae.expires_at - currentTick)} TICKS
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                            <div
                                                className="bg-purple-500 h-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (Math.max(0, ae.expires_at - currentTick) / 10) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 text-[9px] text-slate-500 flex justify-between">
                                            <span>Người ban hành: {ae.decreed_by}</span>
                                            <span>Ảnh hưởng: {ae.target.toUpperCase()} x?</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
