"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import SeriesCard from "@/components/IpFactory/SeriesCard";
import ChapterList from "@/components/IpFactory/ChapterList";
import ChapterReader from "@/components/IpFactory/ChapterReader";
import StoryBiblePanel from "@/components/IpFactory/StoryBiblePanel";
import CreateSeriesModal from "@/components/IpFactory/CreateSeriesModal";

interface Series {
  id: number;
  title: string;
  genre_key: string;
  status: string;
  total_chapters_generated: number;
  current_book_index: number;
  universe_id: number;
  universe?: { id: number; name?: string };
}

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

interface StoryBible {
  id: number;
  series_id: number;
  characters: Array<{ name: string; archetype?: string; description?: string }> | null;
  locations: Array<{ name: string; description?: string }> | null;
  lore: Array<{ key: string; description?: string }> | null;
}

export default function IpFactoryPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [bibleLoading, setBibleLoading] = useState(false);

  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"chapters" | "bible">("chapters");
  const [universes, setUniverses] = useState<Array<{ id: number; name?: string }>>([]);
  const [genError, setGenError] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    setLoadingSeries(true);
    try {
      const data = await api.ipFactory.series();
      setSeriesList(data.data ?? data);
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  useEffect(() => {
    loadSeries();
    api.universes()
      .then((d: { id: number; name?: string }[]) => setUniverses(d))
      .catch(() => {});
  }, [loadSeries]);

  const loadChapters = useCallback(async (series: Series) => {
    setLoadingChapters(true);
    setSelectedChapter(null);
    setChapters([]);
    try {
      const data = await api.ipFactory.chapters(series.id);
      setChapters(data);
    } finally {
      setLoadingChapters(false);
    }
  }, []);

  const loadBible = useCallback(async (seriesId: number) => {
    setBibleLoading(true);
    try {
      const data = await api.ipFactory.bible(seriesId);
      setBible(data);
    } finally {
      setBibleLoading(false);
    }
  }, []);

  const handleSelectSeries = (series: Series) => {
    setSelectedSeries(series);
    loadChapters(series);
    setActiveTab("chapters");
    setBible(null);
  };

  const handleTabChange = (tab: "chapters" | "bible") => {
    setActiveTab(tab);
    if (tab === "bible" && selectedSeries && !bible) {
      loadBible(selectedSeries.id);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSeries) return;
    setGeneratingChapter(true);
    setGenError(null);
    try {
      await api.ipFactory.generateChapter(selectedSeries.id, true);
      await loadChapters(selectedSeries);
      await loadSeries();
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Lỗi sinh chapter");
    } finally {
      setGeneratingChapter(false);
    }
  };

  const handleCanonized = () => {
    if (selectedSeries) {
      loadChapters(selectedSeries);
      if (activeTab === "bible") loadBible(selectedSeries.id);
    }
  };

  const firstUniverseId = universes[0]?.id ?? 0;

  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] flex flex-col">
      <header className="border-b border-border/60 px-6 py-4 flex items-center justify-between bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-[var(--radius)] bg-[linear-gradient(135deg,hsl(var(--left-brain)),hsl(var(--cosmos)))] glow-cosmos" />
          <div>
            <span className="text-sm font-semibold text-gradient-cosmos">IP Factory</span>
            <p className="text-xs text-muted-foreground">Simulation → Narrative → Canon</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!firstUniverseId}
          className="rounded-[var(--radius)] bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground glow-left-brain hover:bg-[hsl(var(--left-brain-glow))] transition-colors disabled:opacity-40"
        >
          + Tạo Bộ Truyện
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-border/60 overflow-y-auto bg-card/20">
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Bộ Truyện ({seriesList.length})
            </p>
            {loadingSeries ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-[var(--radius)] bg-muted animate-pulse" />
                ))}
              </div>
            ) : seriesList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                <p className="text-2xl mb-2 opacity-40">📖</p>
                <p>Chưa có bộ truyện.</p>
                <p className="mt-1 opacity-70">Nhấn "+ Tạo Bộ Truyện" để bắt đầu.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {seriesList.map((s) => (
                  <SeriesCard
                    key={s.id}
                    series={s}
                    selected={selectedSeries?.id === s.id}
                    onClick={() => handleSelectSeries(s)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="w-64 shrink-0 border-r border-border/60 flex flex-col overflow-hidden bg-card/10">
          {selectedSeries ? (
            <>
              <div className="flex border-b border-border/60">
                {(["chapters", "bible"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                      activeTab === tab
                        ? "text-[hsl(var(--left-brain))] border-b-2 border-[hsl(var(--left-brain))]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "chapters" ? "Chương" : "Story Bible"}
                  </button>
                ))}
              </div>

              {activeTab === "chapters" && (
                <div className="p-3 border-b border-border/40">
                  <button
                    onClick={handleGenerate}
                    disabled={generatingChapter}
                    className="w-full rounded-[var(--radius)] border border-[hsl(var(--cosmos)/0.4)] bg-[hsl(var(--cosmos)/0.1)] py-2 text-xs font-semibold text-[hsl(var(--cosmos))] hover:bg-[hsl(var(--cosmos)/0.2)] transition-colors disabled:opacity-50"
                  >
                    {generatingChapter ? "⏳ Đang sinh chương..." : "✦ Sinh Chương Mới"}
                  </button>
                  {genError && <p className="mt-1.5 text-[10px] text-destructive">{genError}</p>}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3">
                {activeTab === "chapters" ? (
                  loadingChapters ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-[var(--radius)] bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ChapterList chapters={chapters} selectedId={selectedChapter?.id} onSelect={(ch) => setSelectedChapter(ch)} />
                  )
                ) : (
                  <StoryBiblePanel bible={bible} loading={bibleLoading} />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs text-center px-4">
              <p>← Chọn một bộ truyện để xem chương</p>
            </div>
          )}
        </section>

        <main className="flex-1 overflow-y-auto p-6">
          {selectedChapter ? (
            <ChapterReader chapter={selectedChapter} onCanonized={handleCanonized} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
              <div className="pointer-events-none absolute -inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--cosmos)/0.08),transparent_70%)]" />
              <div className="text-5xl opacity-20">📜</div>
              <div>
                <p className="text-sm font-medium">IP Factory Dashboard</p>
                <p className="text-xs mt-1 opacity-70">Chọn một bộ truyện và sinh chương để bắt đầu hành trình.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && firstUniverseId > 0 && (
        <CreateSeriesModal universeId={firstUniverseId} onCreated={loadSeries} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
