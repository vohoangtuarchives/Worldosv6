"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageContainer } from "@/components/ui/page-container";
import { BookOpen, ScrollText, Users, Library } from "lucide-react";

type WorldIpData = Awaited<ReturnType<typeof api.worldIp>>;

export default function WorldIpPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;
  const [data, setData] = useState<WorldIpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id == null || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .worldIp(id)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được IP."))
      .finally(() => setLoading(false));
  }, [id]);

  if (id == null || Number.isNaN(id)) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">Thiếu ID World.</p>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">Đang tải IP của World...</p>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <p className="text-red-500">{error ?? "Không có dữ liệu."}</p>
      </PageContainer>
    );
  }

  const { world, universes, aggregated_bibles } = data;
  const allChronicles = universes.flatMap((u) => u.chronicles.map((c) => ({ ...c, universeName: u.name })));
  const allSeries = universes.flatMap((u) => u.series.map((s) => ({ ...s, universeName: u.name })));

  return (
    <PageContainer>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-gradient-cosmos">
            IP: {world.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tổng quan lịch sử, truyện và nhân vật của World này.
          </p>
        </header>

        <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5">
          <div className="mb-4 flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Lịch sử (Biên niên)</h2>
          </div>
          {allChronicles.length > 0 ? (
            <ul className="space-y-3 max-h-[320px] overflow-y-auto">
              {allChronicles.slice(0, 30).map((c) => (
                <li
                  key={`${c.universeName}-${c.id}`}
                  className="rounded-[var(--radius)] border border-border bg-background/40 p-3 text-sm"
                >
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{c.universeName}</span>
                    <span>Tick {c.from_tick} → {c.to_tick}</span>
                  </div>
                  <p className="line-clamp-3 text-foreground/90">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chưa có biên niên nào.</p>
          )}
        </section>

        <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Truyện / Tác phẩm</h2>
          </div>
          {allSeries.length > 0 ? (
            <ul className="space-y-3">
              {allSeries.map((s) => (
                <li key={s.id} className="rounded-[var(--radius)] border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{s.universeName}</span>
                  </div>
                  {s.chapters && s.chapters.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.chapters.length} chương
                      <Link
                        href={`/ip-factory?series=${s.id}`}
                        className="ml-2 text-primary hover:underline"
                      >
                        Mở trong IP Factory
                      </Link>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chưa có series nào.</p>
          )}
        </section>

        <section className="rounded-[calc(var(--radius)+8px)] border border-border bg-card/55 p-5">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Nhân vật & Văn hóa</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Nhân vật
              </h3>
              {aggregated_bibles.characters.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {(aggregated_bibles.characters as Array<{ name?: string; archetype?: string }>).slice(0, 20).map((c, i) => (
                    <li key={i}>{c.name}{c.archetype ? ` · ${c.archetype}` : ""}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Chưa có nhân vật.</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Library className="h-4 w-4" /> Lore
              </h3>
              {aggregated_bibles.lore.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {(aggregated_bibles.lore as Array<{ text?: string; key?: string; description?: string }>).slice(0, 10).map((l, i) => (
                    <li key={i}>{l.text ?? l.key ?? l.description ?? ""}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Chưa có lore.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
