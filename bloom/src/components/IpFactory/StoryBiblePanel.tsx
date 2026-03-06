"use client";

interface StoryBible {
    id: number;
    series_id: number;
    characters: Array<{ name: string; archetype?: string; description?: string }> | null;
    locations: Array<{ name: string; description?: string }> | null;
    lore: Array<{ key: string; description?: string }> | null;
}

interface StoryBiblePanelProps {
    bible: StoryBible | null;
    loading?: boolean;
}

export default function StoryBiblePanel({ bible, loading }: StoryBiblePanelProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-[var(--radius)] bg-muted animate-pulse" />
                ))}
            </div>
        );
    }

    if (!bible) {
        return (
            <div className="text-center py-8 text-muted-foreground text-xs">
                StoryBible sẽ được cập nhật sau khi canonize chương đầu tiên.
            </div>
        );
    }

    const characters = bible.characters ?? [];
    const locations = bible.locations ?? [];

    return (
        <div className="space-y-6 text-sm">
            {/* Characters */}
            <section>
                <h4 className="mb-2 text-xs font-semibold text-gradient-cosmos tracking-wider uppercase">
                    Nhân Vật ({characters.length})
                </h4>
                {characters.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có nhân vật nào được ghi nhận.</p>
                ) : (
                    <div className="space-y-2">
                        {characters.map((char, i) => (
                            <div
                                key={i}
                                className="rounded-[var(--radius)] border border-border bg-card/50 px-3 py-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm">{char.name}</span>
                                    {char.archetype && (
                                        <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">
                                            {char.archetype}
                                        </span>
                                    )}
                                </div>
                                {char.description && (
                                    <p className="text-xs text-muted-foreground mt-1 leading-5">
                                        {char.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Locations */}
            <section>
                <h4 className="mb-2 text-xs font-semibold text-gradient-right tracking-wider uppercase">
                    Địa Điểm ({locations.length})
                </h4>
                {locations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có địa điểm nào được ghi nhận.</p>
                ) : (
                    <div className="space-y-2">
                        {locations.map((loc, i) => (
                            <div
                                key={i}
                                className="rounded-[var(--radius)] border border-border bg-card/50 px-3 py-2"
                            >
                                <span className="font-medium text-sm">{loc.name}</span>
                                {loc.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{loc.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
