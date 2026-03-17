'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, Activity, ShieldAlert } from 'lucide-react';

interface ObservationMonitorProps {
    observationLoad: number;
}

const ObservationMonitor: React.FC<ObservationMonitorProps> = ({ observationLoad }) => {
    // observationLoad thường dao động từ 0 đến 10+
    const saturationLevel = Math.min(100, (observationLoad / 10) * 100);

    const getStatusLabel = () => {
        if (observationLoad > 8) return 'Bão hòa Thực tại (Saturation)';
        if (observationLoad > 5) return 'Nhiễu xạ Cao (High Interference)';
        if (observationLoad > 2) return 'Sụp đổ Hàm sóng (Wavefunction Collapse)';
        if (observationLoad > 0) return 'Tương tác Lượng tử (Quantum Interaction)';
        return 'Thực tại Tự nhiên (Natural State)';
    };

    const getStatusColor = () => {
        if (observationLoad > 8) return 'text-rose-400';
        if (observationLoad > 5) return 'text-amber-400';
        if (observationLoad > 2) return 'text-cyan-400';
        return 'text-emerald-400';
    };

    return (
        <Card className="bg-slate-950/80 border-cyan-900/50 backdrop-blur-md">
            <CardHeader className="py-2 px-4 border-b border-cyan-900/30">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-cyan-400 uppercase tracking-widest">
                    <Eye className="w-4 h-4" />
                    Giám sát Nhiễu xạ Quan sát
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Trạng thái Thực tại</span>
                            <div className={`text-xs font-bold ${getStatusColor()}`}>
                                {getStatusLabel()}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Áp lực (Φ)</span>
                            <div className="text-sm font-mono font-bold text-white">
                                {observationLoad.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                            <span>Mức độ Bão hòa</span>
                            <span>{saturationLevel.toFixed(1)}%</span>
                        </div>
                        <Progress
                            value={saturationLevel}
                            className={`h-1.5 bg-slate-900 ${observationLoad > 8 ? 'animate-pulse' : ''}`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                            <Activity className="w-3 h-3" />
                            <span>Biến thiên</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">
                            {observationLoad > 5 ? 'Nén chặt' : 'Tự do'}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Rủi ro Stasis</span>
                        </div>
                        <div className={`text-[11px] font-bold ${observationLoad > 7 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {observationLoad > 7 ? 'NGUY CẤP' : 'THẤP'}
                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-slate-500 italic leading-relaxed text-center px-2">
                    "Điểm nhìn không chỉ quan sát, nó định hình ranh giới của cái khả hữu."
                </p>
            </CardContent>
        </Card>
    );
};

export default ObservationMonitor;
