"use client";
import { useState } from "react";
import { api } from "@/lib/api";

interface Chapter {
    id: number;
    series_id: number;
    chapter_index: number;
    book_index: number;
    title: string;
    content: string;
    needs_review: boolean;
    canonized_at: string | null;
    tick_start: number;
    tick_end: number;
}

interface ChapterReaderProps {
    chapter: Chapter;
    onCanonized: () => void;
}

export default function ChapterReader({ chapter, onCanonized }: ChapterReaderProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCanonized = !!chapter.canonized_at;

    const handleCanonize = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.ipFactory.canonize(chapter.series_id, chapter.id);
            onCanonized();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Lỗi khi phê duyệt chương.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            Book {chapter.book_index} · Chương {chapter.chapter_index} · Tick {chapter.tick_start}–{chapter.tick_end ?? "?"}
                        </p>
                        <h2 className="text-lg font-semibold leading-snug">
                            {chapter.title ?? `Chương ${chapter.chapter_index}`}
                        </h2>
                    </div>

                    {isCanonized ? (
                        <span className="shrink-0 rounded-full border border-[hsl(var(--right-brain)/0.4)] bg-[hsl(var(--right-brain)/0.1)] px-3 py-1 text-xs font-semibold text-[hsl(var(--right-brain))]">
                            ✦ Đã Canonize
                        </span>
                    ) : (
                        <button
                            onClick={handleCanonize}
                            disabled={loading}
                            className="shrink-0 rounded-[var(--radius)] bg-[hsl(var(--right-brain))] px-4 py-1.5 text-xs font-semibold text-[hsl(var(--void))] glow-right-brain hover:bg-[hsl(var(--right-brain-glow))] transition-colors disabled:opacity-50"
                        >
                            {loading ? "Đang phê duyệt..." : "⚡ Canonize"}
                        </button>
                    )}
                </div>

                {error && (
                    <p className="mt-2 text-xs text-destructive">{error}</p>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                    {chapter.content.split("\n\n").map((para, i) => (
                        <p
                            key={i}
                            className="text-sm leading-7 text-foreground/85 mb-4 font-narrative"
                        >
                            {para}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}
