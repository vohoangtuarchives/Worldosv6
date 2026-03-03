import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Share2, Zap, AlertTriangle } from 'lucide-react';

interface Interaction {
    id: number;
    universe_a_id: number;
    universe_b_id: number;
    interaction_type: string;
    payload: any;
    created_at: string;
    universe_a?: { name: string };
    universe_b?: { name: string };
}

export const ConvergenceView: React.FC<{ universeId: number }> = ({ universeId }) => {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInteractions = async () => {
            try {
                const data = await api.interactions(universeId);
                setInteractions(data);
            } catch (error) {
                console.error("Failed to fetch interactions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInteractions();
        const interval = setInterval(fetchInteractions, 10000);
        return () => clearInterval(interval);
    }, [universeId]);

    if (loading) return <div className="animate-pulse text-cyan-500 font-mono">Đang quét tần số đa vũ trụ...</div>;

    return (
        <Card className="bg-slate-900/80 border-cyan-900/50 backdrop-blur-md">
            <CardHeader className="border-b border-cyan-900/30">
                <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    GIAO THOA ĐA VŨ TRỤ (MULTIVERSE RESONANCE)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    <div className="p-4 space-y-4">
                        {interactions.length === 0 ? (
                            <div className="text-slate-500 italic font-mono text-center py-8">
                                Chưa phát hiện sự cộng hưởng đáng kể.
                            </div>
                        ) : (
                            interactions.map((ix) => (
                                <div key={ix.id} className="border border-cyan-900/20 bg-slate-950/50 p-3 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 group-hover:bg-cyan-400 transition-colors" />

                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="border-cyan-500 text-cyan-400 font-mono">
                                                {ix.interaction_type.toUpperCase()}
                                            </Badge>
                                            <span className="text-xs text-slate-500 font-mono">
                                                {new Date(ix.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-sm font-mono text-slate-300">
                                        {ix.interaction_type === 'convergence_initiated' ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-amber-400">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>KHỞI CHẠY HỘI TỤ</span>
                                                </div>
                                                <p>Dòng thời gian đang hợp nhất với <span className="text-cyan-300">#{ix.universe_b_id} {ix.universe_b?.name}</span></p>
                                            </div>
                                        ) : (
                                            <p>Phát hiện kết nối với <span className="text-cyan-300">#{ix.universe_b_id}</span></p>
                                        )}
                                    </div>

                                    {ix.payload?.tick && (
                                        <div className="mt-2 text-[10px] text-cyan-900 font-bold uppercase flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            Mốc thời gian: {ix.payload.tick}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
