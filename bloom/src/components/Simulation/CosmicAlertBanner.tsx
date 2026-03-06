import { AlertCircle, ShieldAlert, Cpu, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export interface Crisis {
    type: string;
    started_at: number;
    intensity: number;
}

export function CosmicAlertBanner({ activeCrises }: { activeCrises: Record<string, Crisis> }) {
    if (!activeCrises || Object.keys(activeCrises).length === 0) return null;

    return (
        <div className="space-y-2 mb-6">
            {Object.entries(activeCrises).map(([key, crisis]) => (
                <div key={key} className="relative p-4 rounded-lg bg-red-950/40 border border-red-500/50 text-red-100 backdrop-blur-md animate-pulse">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                CẢNH BÁO BỘ LỌC VĨ ĐẠI: {key.replace('_', ' ')}
                                <Badge variant="destructive" className="text-[9px] h-4 bg-red-500 px-1 border-none font-bold">CRITICAL</Badge>
                            </div>
                            <div className="text-[10px] opacity-90 font-mono leading-relaxed">
                                {getCrisisMessage(key)}
                                <span className="ml-2 bg-red-500/30 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap">Bắt đầu từ Tick #{crisis.started_at}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getCrisisMessage(type: string) {
    switch (type) {
        case 'singularity_collapse': return "NGHỊCH LÝ ĐIỂM KỲ DỊ: Công nghệ đột phá vượt xa tầm kiểm soát. Cấu trúc thực tại đang rạn nứt.";
        case 'institutional_stagnation': return "SỰ ĐÌNH TRỆ ĐẠI HỆ THỐNG: Truyền thống hủ lậu bóp nghẹt mọi mầm mống đổi mới. Nền văn minh đang tự thối rữa.";
        case 'void_breach': return "CÁNH CỬA HƯ VÔ: Entropy cực hạn. Ranh giới giữa hiện hữu và hư vô đang tan biến.";
        default: return "Hệ thống đang đối mặt với một thử thách vĩ mô đe dọa sự tồn vong.";
    }
}
