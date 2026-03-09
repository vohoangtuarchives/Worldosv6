import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Info, AlertOctagon, Sun, CloudRain } from 'lucide-react';
import { toast } from 'sonner';

interface Scenario {
    name: string;
    description: string;
    edict?: string;
    material_spawn?: string;
    narrative_focus: string;
}

export const ScenarioSelector: React.FC<{ universeId: number }> = ({ universeId }) => {
    const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const data = await api.scenarios();
                setScenarios(data);
            } catch (error) {
                console.error("Failed to fetch scenarios", error);
            } finally {
                setLoading(false);
            }
        };
        fetchScenarios();
    }, []);

    const handleLaunch = async (scenarioId: string) => {
        if (!confirm(`Bạn có chắc chắn muốn khởi động kịch bản "${scenarios[scenarioId].name}"? Điều này sẽ thay đổi vận mệnh của vũ trụ.`)) return;

        try {
            await api.launchScenario(universeId, scenarioId);
            toast.success(`Kịch bản "${scenarios[scenarioId].name}" đã được khởi động!`);
        } catch (error: any) {
            toast.error(`Thất bại: ${error.message}`);
        }
    };

    const getScenarioIcon = (id: string) => {
        if (id === 'great_flood') return <CloudRain className="w-5 h-5 text-blue-400" />;
        if (id === 'golden_age') return <Sun className="w-5 h-5 text-yellow-400" />;
        if (id === 'age_of_chaos') return <AlertOctagon className="w-5 h-5 text-red-500" />;
        return <Play className="w-5 h-5 text-cyan-500" />;
    };

    if (loading) return null;

    return (
        <Card className="bg-card/80 border-cyan-900/30">
            <CardHeader className="pb-2 border-b border-cyan-900/20">
                <CardTitle className="text-sm font-mono text-cyan-400 flex items-center gap-2">
                    <Play className="w-4 h-4 fill-cyan-500" />
                    CHỌN KỊCH BẢN (SCENARIO SELECTOR)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                    <div className="p-4 grid grid-cols-1 gap-3">
                        {Object.entries(scenarios).map(([id, scenario]) => (
                            <div key={id} className="bg-card/40 border border-cyan-900/10 rounded-lg p-3 hover:bg-card/60 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {getScenarioIcon(id)}
                                        <span className="font-bold text-foreground text-sm">{scenario.name}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs text-cyan-500 hover:text-cyan-400 hover:bg-cyan-950/30"
                                        onClick={() => handleLaunch(id)}
                                    >
                                        KHỞI CHẠY
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal mb-2">
                                    {scenario.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {scenario.edict && (
                                        <Badge variant="outline" className="text-[9px] border-amber-900/50 text-amber-500 font-mono">
                                            EDICT: {scenario.edict.toUpperCase()}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[9px] border-purple-900/50 text-purple-400 font-mono">
                                        NARRATIVE: {scenario.narrative_focus.split(' ')[0]}...
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
