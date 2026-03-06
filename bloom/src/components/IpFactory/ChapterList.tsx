"use client";

interface Chapter {
    id: number;
    series_id: number;
    book_index: number;
    chapter_index: number;
    title: string;
    content: string;
    needs_review: boolean;
    canonized_at: string | null;
    tick_start: number;
    tick_end: number;
}

interface ChapterListProps {
    chapters: Chapter[];
    selectedId?: number;
    onSelect: (chapter: Chapter) => void;
}

export default function ChapterList({ chapters, selectedId, onSelect }: ChapterListProps) {
    if (chapters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="mb-3 text-3xl opacity-40">📜</div>
                <p className="text-sm">Chưa có chương nào.</p>
                <p className="text-xs mt-1 opacity-70">Nhấn "Sinh Chương Mới" để bắt đầu.</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {chapters.map((ch) => {
                const isCanonized = !!ch.canonized_at;
                const isSelected = ch.id === selectedId;

                return (
                    <button
                        key={ch.id}
                        onClick={() => onSelect(ch)}
                        className={`w-full text-left px-3 py-2.5 rounded-[var(--radius)] transition-all duration-150 flex items-center gap-3 ${isSelected
                            ? "bg-[hsl(var(--cosmos)/0.15)] border border-[hsl(var(--cosmos)/0.4)]"
                            : "hover:bg-muted border border-transparent"
                            }`}
                    >
                        {/* Status dot */}
                        <span
                            className={`shrink-0 h-2 w-2 rounded-full ${isCanonized
                                ? "bg-[hsl(var(--right-brain))]"
                                : "bg-[hsl(var(--left-brain))] animate-pulse"
                                }`}
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">
                                {ch.title ?? `Chương ${ch.chapter_index}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Tick {ch.tick_start}–{ch.tick_end ?? "?"}
                            </p>
                        </div>

                        <span
                            className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border ${isCanonized
                                ? "text-[hsl(var(--right-brain))] border-[hsl(var(--right-brain)/0.3)]"
                                : "text-[hsl(var(--left-brain))] border-[hsl(var(--left-brain)/0.3)]"
                                }`}
                        >
                            {isCanonized ? "Canon" : "Chờ duyệt"}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
