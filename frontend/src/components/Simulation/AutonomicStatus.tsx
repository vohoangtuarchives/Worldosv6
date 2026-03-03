import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Activity, Cpu, RefreshCcw } from 'lucide-react';

interface AutonomicStatusProps {
    isAutonomic: boolean;
    axioms: Record<string, any>;
}

export const AutonomicStatus: React.FC<AutonomicStatusProps> = ({ isAutonomic, axioms }) => {
    return (
        <Card className="bg-slate-950/60 border-purple-900/30 backdrop-blur-md overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-16 h-16 text-purple-500" />
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-purple-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    HỆ THỐNG TỰ TRỊ (AUTOMIC STATUS)
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">Trạng thái Thiên Đạo:</span>
                    <Badge
                        variant={isAutonomic ? "default" : "secondary"}
                        className={isAutonomic ? "bg-purple-900/50 text-purple-400 border-purple-500/30" : "bg-slate-900 text-slate-500"}
                    >
                        {isAutonomic ? "TỰ VẬN" : "TĨNH LẶNG"}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(axioms).map(([key, value]) => (
                        <div key={key} className="bg-slate-900/50 p-2 rounded border border-slate-800/50">
                            <div className="text-[9px] text-slate-500 uppercase font-bold truncate">{key.replace('_', ' ')}</div>
                            <div className="text-xs font-mono text-purple-300">
                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </div>
                        </div>
                    ))}
                </div>

                {isAutonomic && (
                    <div className="pt-2 flex items-center gap-2 text-[10px] text-purple-500/70 font-mono animate-pulse">
                        <RefreshCcw className="w-3 h-3 animate-spin" />
                        Đang giám sát hằng số đa vũ trụ...
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
