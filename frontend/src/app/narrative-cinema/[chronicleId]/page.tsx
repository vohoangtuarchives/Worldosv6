'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { useChronicleDetail } from '@/hooks/useChronicleDetail';
import { parseAnimationScript } from '@/lib/vaf/parser';
import CinematicPlayer from '@/components/vaf/CinematicPlayer';

interface PageProps {
    params: Promise<{ chronicleId: string }>;
}

export default function NarrativeCinemaPage(props: PageProps) {
    const { chronicleId: rawId } = use(props.params);
    const chronicleId = Number(rawId);
    const router = useRouter();

    const { chronicle, isLoading } = useChronicleDetail(
        Number.isFinite(chronicleId) ? chronicleId : null,
    );

    // ── Loading state ───────────────────────────
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            </div>
        );
    }

    // ── Parse animation script ──────────────────
    const animation = chronicle?.animation_script
        ? parseAnimationScript(chronicle.animation_script)
        : null;

    // ── Fallback: no animation available ────────
    if (!chronicle || !animation) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
                <div className="absolute left-4 top-4 z-50">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                </div>

                <div className="flex flex-1 items-center justify-center p-8">
                    <div className="max-w-2xl space-y-4 text-center">
                        <h1 className="text-2xl font-black tracking-tight">
                            {chronicle?.title ?? 'Chronicle Not Found'}
                        </h1>
                        <p className="text-sm text-slate-400">
                            No cinematic animation is available for this chronicle.
                        </p>
                        {chronicle?.content && (
                            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-left">
                                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                                    {chronicle.content}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Cinematic player ────────────────────────
    return (
        <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute left-4 top-4 z-50">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                >
                    <ArrowLeft size={16} />
                </button>
            </div>

            <CinematicPlayer
                animationScript={animation}
                chronicleTitle={chronicle.title}
                chronicleContent={chronicle.content}
                onExit={() => router.back()}
            />
        </div>
    );
}
