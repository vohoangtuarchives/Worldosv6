"use client";

import React, { useState, useEffect } from 'react';
import { useWorldStream } from '@/hooks/useWorldStream';

export default function GreatFilterAlert({ universeId }: { universeId: number | null }) {
    const { latestSnapshot } = useWorldStream(universeId);
    const [activeCrisis, setActiveCrisis] = useState<string | null>(null);

    useEffect(() => {
        if (!latestSnapshot?.state_vector) return;

        const stateVec = typeof latestSnapshot.state_vector === 'string'
            ? JSON.parse(latestSnapshot.state_vector)
            : latestSnapshot.state_vector;

        const crises = stateVec.active_crises || {};
        const activeKeys = Object.keys(crises);

        if (activeKeys.length > 0) {
            // Pick one to display, e.g., the most recent or critical
            setActiveCrisis(activeKeys[activeKeys.length - 1]);
        } else {
            setActiveCrisis(null);
        }
    }, [latestSnapshot]);

    if (!activeCrisis) return null;

    const crisisMeta = getCrisisMeta(activeCrisis);

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-center justify-center p-8">
            {/* Background Glitch Layer */}
            <div className={`absolute inset-0 bg-red-950/20 backdrop-blur-sm animate-pulse ${crisisMeta.glitchClass}`} />

            <div className="relative max-w-2xl bg-black/80 border-2 border-red-500/50 p-8 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.3)] pointer-events-auto animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />

                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-red-500/20 rounded border border-red-500/50">
                        <svg className="w-8 h-8 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-red-500 font-black text-2xl uppercase tracking-tighter leading-none">
                            System Critical: Great Filter Detected
                        </h2>
                        <div className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] mt-1">
                            {activeCrisis.replace(/_/g, ' ')} // Entropy: {((latestSnapshot?.entropy ?? 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>

                <p className="text-white/80 font-serif italic text-lg leading-relaxed mb-6 border-l-2 border-red-500/30 pl-4">
                    "{crisisMeta.description}"
                </p>

                <div className="flex flex-col gap-2">
                    <div className="h-1 bg-red-500/20 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 animate-[progress_5s_ease-in-out_infinite]" style={{ width: '40%' }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-red-400/70 uppercase">
                        <span>Structural Coherence Failing</span>
                        <span>Level: Omega</span>
                    </div>
                </div>

                {/* Cyberpunk Glitch Text Overlay */}
                <div className="absolute -top-4 -right-4 text-[40px] font-black text-red-500/10 select-none pointer-events-none rotate-12">
                    CRITICAL
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 100%; }
                    100% { width: 0%; }
                }
                .glitch-heavy {
                    animation: glitch 1s infinite;
                }
                @keyframes glitch {
                    0% { clip-path: inset(80% 0 0 0); transform: translate(-5px, 5px); }
                    10% { clip-path: inset(10% 0 85% 0); transform: translate(5px, -5px); }
                    20% { clip-path: inset(80% 0 0 0); transform: translate(-5px, 5px); }
                }
            `}</style>
        </div>
    );
}

function getCrisisMeta(type: string) {
    switch (type) {
        case 'singularity_collapse':
            return {
                description: "Công nghệ đột phá vượt xa tầm kiểm soát của đạo đức và niềm tin xã hội. Cấu trúc thực tại bắt đầu rạn nứt.",
                glitchClass: "glitch-heavy"
            };
        case 'institutional_stagnation':
            return {
                description: "Truyền thống hủ lậu và bộ máy cồng kềnh đã bóp nghẹt mọi mầm mống đổi mới. Nền văn minh đang tự thối rữa từ bên trong.",
                glitchClass: "opacity-50"
            };
        case 'void_breach':
            return {
                description: "Entropy đạt mức cực hạn. Ranh giới giữa hiện hữu và hư vô đang tan biến. Hư âm vang lên từ vực thẳm.",
                glitchClass: "bg-purple-900/40"
            };
        default:
            return {
                description: "Một thử thách vĩ mô đang đe dọa sự tồn vong của toàn bộ vũ trụ.",
                glitchClass: ""
            };
    }
}
