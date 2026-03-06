"use client";

interface SeriesCardProps {
  series: {
    id: number;
    title: string;
    genre_key: string;
    status: string;
    total_chapters_generated: number;
    current_book_index: number;
    universe?: { id: number; name?: string };
  };
  selected?: boolean;
  onClick: () => void;
}

const GENRE_LABELS: Record<string, string> = {
  wuxia: "Tu tiên",
  xianxia: "Tiên hiệp",
  cyberpunk: "Cyberpunk",
  fantasy: "Fantasy",
  scifi: "Khoa học VT",
  urban: "Đô thị",
  historical: "Lịch sử",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-[hsl(var(--left-brain))] bg-[hsl(var(--left-brain)/0.1)] border-[hsl(var(--left-brain)/0.3)]",
  draft: "text-muted-foreground bg-muted border-border",
  completed: "text-[hsl(var(--right-brain))] bg-[hsl(var(--right-brain)/0.1)] border-[hsl(var(--right-brain)/0.3)]",
};

export default function SeriesCard({ series, selected, onClick }: SeriesCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-[var(--radius)] border p-4 transition-all duration-200 ${
        selected ? "border-[hsl(var(--left-brain)/0.6)] bg-[hsl(var(--left-brain)/0.08)] glow-left-brain" : "border-border bg-card/50 hover:border-[hsl(var(--left-brain)/0.3)] hover:bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{series.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {GENRE_LABELS[series.genre_key] ?? series.genre_key}
            {series.universe?.name && ` · ${series.universe.name}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[series.status] ?? STATUS_COLORS.draft}`}>
          {series.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--cosmos))]" />
          Book {series.current_book_index}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--right-brain))]" />
          {series.total_chapters_generated} chương
        </span>
      </div>
    </button>
  );
}
