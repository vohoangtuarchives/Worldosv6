"use client";
import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface CreateSeriesModalProps {
    universeId: number;
    onCreated: () => void;
    onClose: () => void;
}

const GENRE_OPTIONS = [
    { value: "wuxia", label: "Tu tiên (Wuxia)" },
    { value: "xianxia", label: "Tiên hiệp (Xianxia)" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "fantasy", label: "Fantasy" },
    { value: "scifi", label: "Khoa học viễn tưởng" },
    { value: "urban", label: "Đô thị" },
    { value: "historical", label: "Lịch sử" },
];

export default function CreateSeriesModal({
    universeId,
    onCreated,
    onClose,
}: CreateSeriesModalProps) {
    const [title, setTitle] = useState("");
    const [genre, setGenre] = useState("wuxia");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = useCallback(async () => {
        if (!title.trim()) {
            setError("Tên bộ truyện không được để trống.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.ipFactory.createSeries({
                universe_id: universeId,
                title: title.trim(),
                genre_key: genre,
            });
            onCreated();
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    }, [title, genre, universeId, onCreated, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-[var(--radius)] border border-border bg-card shadow-2xl p-6">
                {/* Glow accent */}
                <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[hsl(var(--cosmos)/0.25)] blur-2xl" />

                <h2 className="text-lg font-semibold text-gradient-cosmos mb-4">
                    ✦ Tạo Bộ Truyện Mới
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                            Tên bộ truyện
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-[hsl(var(--left-brain))] transition-colors"
                            placeholder="Ví dụ: Thiên Mệnh Kiếm Tông..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                            Thể loại (Genre)
                        </label>
                        <select
                            className="w-full rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-[hsl(var(--left-brain))] transition-colors"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                        >
                            {GENRE_OPTIONS.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="rounded-[var(--radius)] bg-destructive/15 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                            {error}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-[var(--radius)] border border-border bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-card transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-left-brain transition-colors hover:bg-[hsl(var(--left-brain-glow))] disabled:opacity-50"
                    >
                        {loading ? "Đang tạo..." : "Tạo bộ truyện"}
                    </button>
                </div>
            </div>
        </div>
    );
}
