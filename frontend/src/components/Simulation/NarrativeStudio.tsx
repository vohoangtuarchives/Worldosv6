"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpenText,
  FilePenLine,
  History,
  Orbit,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { api } from "@/lib/api";
import { buildNarrativeFacts, buildPresetDraft, type NarrativePreset } from "@/lib/narrative-studio";
import type { NarrativeFact } from "@/types/narrative";
import type { Chronicle, Snapshot, Universe } from "@/types/simulation";

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const records = value as Record<string, unknown>;
    if (Array.isArray(records.data)) return records.data as T[];
  }
  return [];
}

function severityTone(severity: NarrativeFact["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-400/40 bg-red-500/10 text-red-200";
    case "high":
      return "border-amber-400/40 bg-amber-500/10 text-amber-100";
    case "medium":
      return "border-cyan-400/40 bg-cyan-500/10 text-cyan-100";
    default:
      return "border-border bg-card/60 text-foreground/90";
  }
}

type SavedDraft = {
  id: string;
  universeId: number;
  universeName: string;
  preset: NarrativePreset;
  label: string;
  content: string;
  updatedAt: string;
  factCount: number;
};

const STORAGE_KEY = "worldos:narrative-studio:drafts";

const PRESETS: Array<{ id: NarrativePreset; label: string; blurb: string }> = [
  {
    id: "chronicle",
    label: "Biên niên",
    blurb: "Bản draft lịch sử cân bằng, bám theo cửa sổ mô phỏng.",
  },
  {
    id: "story",
    label: "Truyện",
    blurb: "Chuyển cùng các fact thành cảnh, xung đột và nhịp chương.",
  },
  {
    id: "beats",
    label: "Beats chương",
    blurb: "Bảng beat sản xuất để phác cảnh và cấu trúc biên tập.",
  },
];

function loadStoredDrafts() {
  if (typeof window === "undefined") return [] as SavedDraft[];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [] as SavedDraft[];
    const parsed = JSON.parse(raw) as SavedDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as SavedDraft[];
  }
}

function saveStoredDrafts(drafts: SavedDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

function buildVersionLabel(universeName: string, preset: NarrativePreset, count: number) {
  const stamp = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${universeName} ${preset} v${count} · ${stamp}`;
}

export default function NarrativeStudio() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<number | null>(null);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [activePreset, setActivePreset] = useState<NarrativePreset>("chronicle");
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [epicChronicleContent, setEpicChronicleContent] = useState("");
  const [epicChronicleLoading, setEpicChronicleLoading] = useState(false);
  const [epicChronicleError, setEpicChronicleError] = useState<string | null>(null);
  const [epicFromTick, setEpicFromTick] = useState<number | null>(null);
  const [epicToTick, setEpicToTick] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .universes()
      .then((result) => {
        if (!active) return;
        const nextUniverses = normalizeList<Universe>(result);
        setUniverses(nextUniverses);
        setSelectedUniverseId((current) => current ?? nextUniverses[0]?.id ?? null);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Không tải được danh sách Universe.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUniverseId) return;

    let active = true;

    const load = async () => {
      setRefreshing(true);
      setError(null);
      setAiStatus(null);
      try {
        const [universe, snapshotResult, chronicleResult] = await Promise.all([
          api.universe(selectedUniverseId),
          api.snapshots(selectedUniverseId, 12),
          api.chronicle(selectedUniverseId, 1, 8),
        ]);
        if (!active) return;

        setSelectedUniverse(universe as Universe);
        setSnapshots(normalizeList<Snapshot>(snapshotResult));
        const rawChronicles = normalizeList<Chronicle>((chronicleResult as { data?: Chronicle[] })?.data ?? chronicleResult);
        setChronicles(
          rawChronicles.map((c) => ({
            ...c,
            description: (c as { content?: string }).content ?? c.description ?? "",
            tick: (c as { to_tick?: number }).to_tick ?? c.tick ?? 0,
          }))
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu narrative.");
      } finally {
        if (active) setRefreshing(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [selectedUniverseId, reloadToken]);

  useEffect(() => {
    if (!selectedUniverseId) return;
    setEpicChronicleContent("");
    setEpicChronicleError(null);
    setEpicFromTick(null);
    setEpicToTick(null);
  }, [selectedUniverseId]);

  useEffect(() => {
    const allDrafts = loadStoredDrafts();
    const scopedDrafts = selectedUniverseId
      ? allDrafts.filter((draft) => draft.universeId === selectedUniverseId)
      : [];

    setSavedDrafts(
      scopedDrafts.sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )
    );
    setActiveVersionId(null);
  }, [selectedUniverseId]);

  const facts = useMemo(
    () => buildNarrativeFacts({ universe: selectedUniverse, snapshots, chronicles }),
    [selectedUniverse, snapshots, chronicles]
  );

  const generatedDraft = useMemo(
    () => buildPresetDraft(activePreset, selectedUniverse, facts),
    [activePreset, selectedUniverse, facts]
  );

  useEffect(() => {
    setDraftText(generatedDraft);
    setActiveVersionId(null);
  }, [generatedDraft]);

  useEffect(() => {
    if (!facts.length) {
      setSelectedFactId(null);
      return;
    }
    setSelectedFactId((current) =>
      current && facts.some((fact) => fact.id === current) ? current : facts[0].id
    );
  }, [facts]);

  const selectedFact = facts.find((fact) => fact.id === selectedFactId) ?? null;
  const hasUnsavedChanges = draftText !== generatedDraft && activeVersionId === null;

  const handleSaveVersion = () => {
    if (!selectedUniverseId || !selectedUniverse || !draftText.trim()) return;

    const allDrafts = loadStoredDrafts();
    const versionCount = allDrafts.filter(
      (draft) => draft.universeId === selectedUniverseId && draft.preset === activePreset
    ).length + 1;

    const nextDraft: SavedDraft = {
      id: `${selectedUniverseId}-${activePreset}-${Date.now()}`,
      universeId: selectedUniverseId,
      universeName: selectedUniverse.name || `Universe #${selectedUniverseId}`,
      preset: activePreset,
      label: buildVersionLabel(
        selectedUniverse.name || `Universe #${selectedUniverseId}`,
        activePreset,
        versionCount
      ),
      content: draftText,
      updatedAt: new Date().toISOString(),
      factCount: facts.length,
    };

    const nextDrafts = [nextDraft, ...allDrafts].slice(0, 24);
    saveStoredDrafts(nextDrafts);

    const scopedDrafts = nextDrafts
      .filter((draft) => draft.universeId === selectedUniverseId)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

    setSavedDrafts(scopedDrafts);
    setActiveVersionId(nextDraft.id);
    setAiStatus("Đã lưu phiên bản draft cục bộ cho Universe này.");
  };

  const handleRestoreVersion = (draft: SavedDraft) => {
    setActivePreset(draft.preset);
    setDraftText(draft.content);
    setActiveVersionId(draft.id);
    setAiStatus(`Đã khôi phục ${draft.label}.`);
  };

  const handleResetDraft = () => {
    setDraftText(generatedDraft);
    setActiveVersionId(null);
    setAiStatus("Đã đặt lại về output preset hiện tại.");
  };

  const handleGenerateEpicChronicle = async () => {
    if (!selectedUniverseId || !snapshots.length) return;
    const sorted = [...snapshots].sort((a, b) => a.tick - b.tick);
    const fromTick = sorted[0]?.tick ?? 0;
    const toTick = sorted[sorted.length - 1]?.tick ?? fromTick;
    setEpicChronicleLoading(true);
    setEpicChronicleError(null);
    try {
      const data = await api.generateEpicChronicle(selectedUniverseId, fromTick, toTick);
      setEpicChronicleContent(data.content);
      setEpicFromTick(data.from_tick);
      setEpicToTick(data.to_tick);
    } catch (err) {
      setEpicChronicleError(err instanceof Error ? err.message : "Không thể sinh sử thi.");
    } finally {
      setEpicChronicleLoading(false);
    }
  };

  const handleAiRewrite = async () => {
    if (!selectedUniverseId || !facts.length) return;

    setAiGenerating(true);
    setError(null);
    setAiStatus(`Đang tạo bản viết lại ${activePreset} từ Fact WorldOS...`);

    try {
      const response = (await api.narrativeStudio.generate({
        universe_id: selectedUniverseId,
        preset: activePreset,
        facts,
        current_draft: draftText,
        epic_chronicle: epicChronicleContent || undefined,
      })) as { data?: { content?: string; fact_count?: number } };

      const content = response?.data?.content?.trim();
      if (!content) {
        throw new Error("Narrative studio trả về draft rỗng.");
      }

      setDraftText(content);
      setActiveVersionId(null);
      setAiStatus(
        `Đã hoàn thành viết lại AI từ ${response.data?.fact_count ?? facts.length} narrative fact.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không tạo được bản viết lại AI.";
      setError(message);
      setAiStatus(null);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--left-brain)/0.18),transparent_35%),radial-gradient(circle_at_82%_18%,hsl(var(--right-brain)/0.14),transparent_30%),radial-gradient(circle_at_50%_80%,hsl(var(--cosmos)/0.16),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-6">
        <header className="flex flex-col gap-5 rounded-[calc(var(--radius)+10px)] border border-border bg-card/55 p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground">
              <Orbit className="h-3.5 w-3.5 text-primary" />
              <span>WorldOS Narrative Studio</span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-gradient-cosmos md:text-5xl">
                Từ Universe đến Fact rồi Draft
              </h1>
              <p className="mt-3 max-w-3xl font-narrative text-lg leading-8 text-muted-foreground">
                Chọn một Universe, suy ra narrative fact từ snapshot và chronicle, rồi tạo nhiều phiên bản biên tập từ cùng một chân lý mô phỏng.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="h-11 rounded-[var(--radius)] border border-border bg-background/70 px-4 text-sm text-foreground outline-none transition focus:border-primary"
              value={selectedUniverseId ?? ""}
              onChange={(event) =>
                setSelectedUniverseId(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Chọn Universe</option>
              {universes.map((universe) => (
                <option key={universe.id} value={universe.id}>
                  {universe.name || `Universe #${universe.id}`}
                </option>
              ))}
            </select>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
              onClick={() => setReloadToken((value) => value + 1)}
              disabled={!selectedUniverseId || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Đang tải..." : "Làm mới Fact"}
            </button>

            <Link
              href="/timeline"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-[hsl(var(--left-brain-glow))]"
            >
              <ScrollText className="h-4 w-4" />
              Timeline
            </Link>
            {selectedUniverse?.world_id && (
              <Link
                href={`/world/${selectedUniverse.world_id}/ip`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <BookOpenText className="h-4 w-4" />
                Xem IP của World này
              </Link>
            )}
          </div>
        </header>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-[var(--radius)] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <main className="mt-6 grid flex-1 gap-6 xl:grid-cols-[1fr_1fr_1.15fr]">
          <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[hsl(var(--left-brain)/0.18)] p-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Dữ liệu WorldOS</h2>
                <p className="text-sm text-muted-foreground">Dữ liệu raw từ mô phỏng: snapshot và biên niên.</p>
              </div>
            </div>

            <div className="space-y-3">
              {loading || refreshing ? (
                <div className="rounded-[var(--radius)] border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                  Đang xây lớp narrative từ snapshot và chronicle...
                </div>
              ) : facts.length ? (
                facts.map((fact) => (
                  <button
                    key={fact.id}
                    onClick={() => setSelectedFactId(fact.id)}
                    className={`w-full rounded-[var(--radius)] border p-4 text-left transition ${severityTone(fact.severity)} ${selectedFactId === fact.id ? "ring-1 ring-primary" : "hover:border-primary/40"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Tick {fact.tick}
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-widest">{fact.kind}</div>
                    </div>
                    <div className="mt-2 text-base font-semibold">{fact.title}</div>
                    <p className="mt-2 text-sm leading-6 text-foreground/80">{fact.summary}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[var(--radius)] border border-dashed border-border bg-background/35 p-5 text-sm text-muted-foreground">
                  Chưa có fact. Seed hoặc advance một Universe trước để studio có nguyên liệu tạo draft.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5 backdrop-blur-xl flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[hsl(var(--cosmos)/0.18)] p-2 text-[hsl(var(--accent))]">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sử thi – Sử gia mù</h2>
                <p className="text-sm text-muted-foreground">Biên niên sinh từ raw, làm chất liệu cho Studio.</p>
              </div>
            </div>
            <div className="mb-3">
              <button
                type="button"
                onClick={handleGenerateEpicChronicle}
                disabled={!selectedUniverseId || !snapshots.length || epicChronicleLoading}
                className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WandSparkles className={`h-4 w-4 ${epicChronicleLoading ? "animate-pulse" : ""}`} />
                {epicChronicleLoading ? "Đang sinh sử thi..." : "Sinh sử thi"}
              </button>
              {epicFromTick != null && epicToTick != null && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Tick {epicFromTick} → {epicToTick}
                </span>
              )}
            </div>
            {epicChronicleError && (
              <div className="mb-3 rounded-[var(--radius)] border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-200">
                {epicChronicleError}
              </div>
            )}
            <div className="flex-1 min-h-[200px] rounded-[var(--radius)] border border-border bg-background/40 p-4 overflow-y-auto">
              {epicChronicleContent ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 font-narrative">
                  {epicChronicleContent}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có sử thi. Bấm &quot;Sinh sử thi&quot; để tạo từ khoảng tick hiện tại.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5 backdrop-blur-xl flex flex-col min-h-0">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[hsl(var(--cosmos)/0.18)] p-2 text-[hsl(var(--accent-foreground))]">
                  <FilePenLine className="h-5 w-5 text-[hsl(var(--accent))]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Studio</h2>
                  <p className="text-sm text-muted-foreground">Draft sản xuất từ raw + sử thi, sẵn sàng chỉnh biên tập.</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                <WandSparkles className="h-3.5 w-3.5 text-primary" />
                <span>Thao tác Preset</span>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setActivePreset(preset.id)}
                  className={`rounded-[var(--radius)] border p-3 text-left transition ${
                    activePreset === preset.id
                      ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary"
                      : "border-border bg-background/45 text-foreground/85 hover:border-primary/40"
                  }`}
                >
                  <div className="text-sm font-semibold">{preset.label}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{preset.blurb}</div>
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-background/35 p-3 text-xs text-muted-foreground">
              <button
                onClick={handleAiRewrite}
                disabled={!selectedUniverseId || !facts.length || aiGenerating}
                className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-[hsl(var(--left-brain-glow))] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WandSparkles className={`h-4 w-4 ${aiGenerating ? "animate-pulse" : ""}`} />
                {aiGenerating ? `Đang tạo ${PRESETS.find((p) => p.id === activePreset)?.label ?? activePreset}` : `AI viết lại ${PRESETS.find((p) => p.id === activePreset)?.label ?? activePreset}`}
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={!draftText.trim() || !selectedUniverseId}
                className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Lưu phiên bản
              </button>
              <button
                onClick={handleResetDraft}
                disabled={draftText === generatedDraft && activeVersionId === null}
                className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                Đặt lại Preset
              </button>
              <span>
                {aiStatus ||
                  (activeVersionId
                    ? "Đang xem phiên bản biên tập đã lưu."
                    : hasUnsavedChanges
                      ? "Draft đã chỉnh so với output preset hiện tại."
                      : "Draft khớp với output preset hiện tại.")}
              </span>
            </div>

            <textarea
              value={draftText}
              onChange={(event) => {
                setDraftText(event.target.value);
                setActiveVersionId(null);
                setAiStatus(null);
              }}
              className="min-h-[64dvh] w-full rounded-[var(--radius)] border border-border bg-background/55 p-4 font-narrative text-[17px] leading-8 text-foreground outline-none transition focus:border-primary"
              placeholder="Nội dung draft sẽ hiển thị tại đây..."
            />
          </section>

          <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[hsl(var(--right-brain)/0.18)] p-2 text-secondary">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Chi tiết fact</h2>
                <p className="text-sm text-muted-foreground">Bằng chứng nguồn và góc narrative cho từng fact.</p>
              </div>
            </div>

            {selectedFact ? (
              <div className="space-y-5">
                <div className={`rounded-[var(--radius)] border p-4 ${severityTone(selectedFact.severity)}`}>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {selectedFact.kind}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold">{selectedFact.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/85">{selectedFact.summary}</p>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Góc gợi ý
                  </div>
                  <p className="mt-2 rounded-[var(--radius)] border border-border bg-background/45 p-4 text-sm leading-7 text-foreground/85">
                    {selectedFact.angle}
                  </p>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Bằng chứng</div>
                  <div className="mt-2 space-y-2">
                    {selectedFact.evidence.map((item) => (
                      <div
                        key={`${selectedFact.id}-${item.label}`}
                        className="rounded-[var(--radius)] border border-border bg-background/40 p-3"
                      >
                        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {item.label}
                        </div>
                        <div className="mt-1 font-mono text-sm text-foreground/90">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[var(--radius)] border border-dashed border-border bg-background/35 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <History className="h-3.5 w-3.5" />
                    Phiên bản đã lưu
                  </div>
                  <div className="mt-3 space-y-2">
                    {savedDrafts.length ? (
                      savedDrafts.map((draft) => (
                        <button
                          key={draft.id}
                          onClick={() => handleRestoreVersion(draft)}
                          className={`w-full rounded-[var(--radius)] border p-3 text-left transition ${
                            activeVersionId === draft.id
                              ? "border-primary bg-primary/15 ring-1 ring-primary"
                              : "border-border bg-background/35 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-foreground">{draft.label}</div>
                            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                              {draft.preset}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {draft.factCount} fact đã lưu
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm leading-7 text-muted-foreground">
                        Chưa có phiên bản đã lưu. Lưu draft sau khi chỉnh output preset để tạo lịch sử biên tập theo Universe.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-border bg-background/35 p-5 text-sm text-muted-foreground">
                Chọn một fact ở cột trái để xem bằng chứng và góc narrative.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
