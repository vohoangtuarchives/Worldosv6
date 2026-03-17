'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, AlertCircle, TrendingDown } from 'lucide-react';

interface SupremeEntity {
    id: number;
    name: string;
    power_level: number;
    karma: number; // Nợ nhân quả
}

interface IntegrityMonitorProps {
    entities: SupremeEntity[];
}

const IntegrityMonitor: React.FC<IntegrityMonitorProps> = ({ entities }) => {
    return (
        <Card className="bg-card/80 border-emerald-900/50 backdrop-blur-md">
            <CardHeader className="py-2 px-4 border-b border-emerald-900/30">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-emerald-400 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Giám sát Tính toàn vẹn Hệ thống
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {entities.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground italic text-center py-2">
                        Hệ thống đang ở trạng thái cân bằng tuyệt đối...
                    </div>
                ) : (
                    entities.map((entity) => {
                        const debt = Math.abs(entity.karma);
                        const debtLevel = Math.min(100, (debt / 100) * 100);
                        const isCritical = debt > 80;

                        return (
                            <div key={entity.id} className="space-y-2">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-foreground">{entity.name}</span>
                                    <span className={`text-[10px] ${isCritical ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                                        {isCritical ? 'DƯ CHẤN CAO' : 'CÂN BẰNG'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase">
                                        <span>Nợ Nhân Quả (Causal Debt)</span>
                                        <span className={isCritical ? 'text-rose-400' : 'text-muted-foreground'}>
                                            {debt.toFixed(1)} / 100 [Φ]
                                        </span>
                                    </div>
                                    <Progress
                                        value={debtLevel}
                                        className={`h-1 bg-muted ${isCritical ? 'bg-rose-900/40' : ''}`}
                                    />
                                </div>

                                <div className="flex items-center gap-3 text-[9px]">
                                    <div className="flex items-center gap-1 text-muted-foreground font-bold uppercase">
                                        <TrendingDown className="w-3 h-3" />
                                        <span>Quyền năng: {entity.power_level.toFixed(0)}</span>
                                    </div>
                                    {isCritical && (
                                        <div className="flex items-center gap-1 text-rose-500 font-bold uppercase">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>Rủi ro Tái cấu trúc</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <p className="text-[9px] text-muted-foreground text-center italic pt-2 border-t border-border">
                    "Mọi sai lệch đều tìm về sự cân bằng của Đạo."
                </p>
            </CardContent>
        </Card>
    );
};

export default IntegrityMonitor;
