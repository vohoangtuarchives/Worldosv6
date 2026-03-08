"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface SeriesInfo {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  genre_key: string;
  published_at: string;
}

interface ChapterItem {
  id: number;
  series_id: number;
  title: string;
  book_index: number;
  chapter_index: number;
}

interface ChapterContent extends ChapterItem {
  content: string;
}

interface Bible {
  characters: Array<{ name: string; archetype?: string; description?: string }>;
  locations: Array<{ name: string; description?: string }>;
  lore: Array<{ key: string; description?: string }>;
}

const GENRE_LABELS: Record<string, string> = {
  wuxia: "Tu tiên",
  xianxia: "Tiên hiệp",
  cyberpunk: "Cyberpunk",
  fantasy: "Fantasy",
  scifi: "Khoa học viễn tưởng",
  urban: "Đô thị",
  historical: "Lịch sử",
};

export default function ReadSeriesPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterContent | null>(null);
  const [bible, setBible] = useState<Bible | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "bible">("chapters");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const [s, ch] = await Promise.all([
        api.publicSeries.show(slug),
        api.publicSeries.chapters(slug),
      ]);
      setSeries(s);
      setChapters(ch);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tìm thấy bộ truyện.");
      setSeries(null);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const loadChapter = useCallback(async (chapterId: number) => {
    if (!slug) return;
    try {
      const ch = await api.publicSeries.chapter(slug, chapterId);
      setSelectedChapter(ch);
    } catch {
      setSelectedChapter(null);
    }
  }, [slug]);

  const loadBible = useCallback(async () => {
    if (!slug) return;
    try {
      const b = await api.publicSeries.bible(slug);
      setBible(b);
    } catch {
      setBible(null);
    }
  }, [slug]);

  useEffect(() => {
    if (activeTab === "bible" && slug && !bible) loadBible();
  }, [activeTab, slug, bible, loadBible]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Đang tải...</div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-dvh bg-[hsl(var(--background))] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">{error ?? "Không tìm thấy bộ truyện."}</p>
        <Link href="/ip-factory" className="text-sm text-[hsl(var(--left-brain))] hover:underline">
          Về IP Factory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] flex flex-col">
      <header className="border-b border-border/60 px-6 py-4 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/ip-factory" className="text-xs text-muted-foreground hover:text-foreground">
            ← IP Factory
          </Link>
        </div>
        <h1 className="text-xl font-semibold">{series.title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {GENRE_LABELS[series.genre_key] ?? series.genre_key}
        </p>
        {series.description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{series.description}</p>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-border/60 flex flex-col bg-card/20">
          <div className="flex border-b border-border/60">
            <button
              onClick={() => setActiveTab("chapters")}
              className={`flex-1 py-2.5 text-xs font-semibold ${activeTab === "chapters"
                ? "text-[hsl(var(--left-brain))] border-b-2 border-[hsl(var(--left-brain))]"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Chương
            </button>
            <button
              onClick={() => setActiveTab("bible")}
              className={`flex-1 py-2.5 text-xs font-semibold ${activeTab === "bible"
                ? "text-[hsl(var(--left-brain))] border-b-2 border-[hsl(var(--left-brain))]"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Story Bible
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === "chapters" ? (
              <ul className="space-y-1">
                {chapters.map((ch) => (
                  <li key={ch.id}>
                    <button
                      onClick={() => loadChapter(ch.id)}
                      className={`w-full text-left rounded-[var(--radius)] px-3 py-2 text-xs transition-colors ${selectedChapter?.id === ch.id
                        ? "bg-[hsl(var(--left-brain)/0.15)] text-[hsl(var(--left-brain))]"
                        : "hover:bg-muted"
                        }`}
                    >
                      <span className="font-medium">Ch. {ch.chapter_index}</span>
                      <span className="block truncate text-muted-foreground mt-0.5">{ch.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs space-y-4">
                {bible ? (
                  <>
                    {bible.characters?.length > 0 && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-2">Nhân vật</p>
                        <ul className="space-y-1">
                          {bible.characters.map((c, i) => (
                            <li key={i}>{c.name}{c.archetype ? ` · ${c.archetype}` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {bible.locations?.length > 0 && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-2">Địa điểm</p>
                        <ul className="space-y-1">
                          {bible.locations.map((l, i) => (
                            <li key={i}>{l.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {bible.lore?.length > 0 && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-2">Lore</p>
                        <ul className="space-y-1">
                          {bible.lore.map((l, i) => (
                            <li key={i}>{l.key}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!bible.characters?.length && !bible.locations?.length && !bible.lore?.length && (
                      <p className="text-muted-foreground">Chưa có nội dung Story Bible.</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Đang tải...</p>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "chapters" && selectedChapter ? (
            <article className="max-w-2xl mx-auto">
              <p className="text-xs text-muted-foreground mb-1">
                Tập {selectedChapter.book_index} · Chương {selectedChapter.chapter_index}
              </p>
              <h2 className="text-lg font-semibold mb-4">{selectedChapter.title}</h2>
              <div
                className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground"
              >
                {selectedChapter.content}
              </div>
            </article>
          ) : activeTab === "chapters" ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm">
              <p>Chọn một chương để đọc.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {bible?.characters?.length ? (
                <section>
                  <h3 className="text-sm font-semibold mb-3">Nhân vật</h3>
                  <ul className="space-y-3">
                    {bible.characters.map((c, i) => (
                      <li key={i} className="border-b border-border/60 pb-3">
                        <p className="font-medium">{c.name}</p>
                        {c.archetype && <p className="text-xs text-muted-foreground">{c.archetype}</p>}
                        {c.description && <p className="text-sm mt-1">{c.description}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {bible?.locations?.length ? (
                <section>
                  <h3 className="text-sm font-semibold mb-3">Địa điểm</h3>
                  <ul className="space-y-3">
                    {bible.locations.map((l, i) => (
                      <li key={i} className="border-b border-border/60 pb-3">
                        <p className="font-medium">{l.name}</p>
                        {l.description && <p className="text-sm text-muted-foreground mt-1">{l.description}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {bible?.lore?.length ? (
                <section>
                  <h3 className="text-sm font-semibold mb-3">Lore</h3>
                  <ul className="space-y-3">
                    {bible.lore.map((l, i) => (
                      <li key={i} className="border-b border-border/60 pb-3">
                        <p className="font-medium">{l.key}</p>
                        {l.description && <p className="text-sm text-muted-foreground mt-1">{l.description}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {bible && !bible.characters?.length && !bible.locations?.length && !bible.lore?.length && (
                <p className="text-muted-foreground text-sm">Chưa có nội dung Story Bible.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
