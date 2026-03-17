"use client";

import React from "react";
import { Sparkles, Swords, BookOpen, Shield, Coins, Palette } from "lucide-react";
import Link from "next/link";

export interface HeroCardEntity {
  id: number;
  name: string;
  entity_type: string;
  domain: string;
  description: string;
  power_level: number;
  ascended_at_tick?: number;
  status?: string;
}

interface HeroCardProps {
  entity: HeroCardEntity;
  universeId: number | null;
}

function getHeroIcon(entityType: string) {
  const key = entityType.toUpperCase().replace(/^GREAT_PERSON_/, "");
  switch (key) {
    case "PROPHET":
      return <Sparkles className="w-8 h-8 text-amber-400" />;
    case "GENERAL":
      return <Swords className="w-8 h-8 text-red-400" />;
    case "SCIENTIST":
      return <BookOpen className="w-8 h-8 text-emerald-400" />;
    case "RULER":
      return <Shield className="w-8 h-8 text-cyan-400" />;
    case "MERCHANT":
      return <Coins className="w-8 h-8 text-yellow-400" />;
    case "ARTIST":
      return <Palette className="w-8 h-8 text-pink-400" />;
    default:
      return <span className="text-4xl font-bold text-muted-foreground">{key.charAt(0)}</span>;
  }
}

function getTypeLabel(entityType: string): string {
  const key = entityType.toUpperCase().replace(/^GREAT_PERSON_/, "");
  const labels: Record<string, string> = {
    PROPHET: "Thánh Nhân",
    GENERAL: "Đại Tướng Quân",
    SCIENTIST: "Học Giả Vĩ Đại",
    RULER: "Minh Quân",
    MERCHANT: "Đại Phú Hộ",
    ARTIST: "Đại Nghệ Sĩ",
  };
  return labels[key] ?? entityType;
}

export function HeroCard({ entity, universeId }: HeroCardProps) {
  const typeLabel = getTypeLabel(entity.entity_type);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card/40 text-foreground shadow-sm transition-all hover:shadow-amber-900/20 hover:border-amber-500/30 hover:scale-[1.02]"
      data-hero-id={entity.id}
    >
      <div className="aspect-video w-full bg-card/50 relative border-b border-border flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center">
          {getHeroIcon(entity.entity_type)}
        </div>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-card/80 backdrop-blur border border-border text-foreground">
          {entity.domain || typeLabel}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-foreground leading-tight tracking-tight line-clamp-1" title={entity.name}>
            {entity.name}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono tracking-wider shrink-0">
            {typeLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {entity.description || "Vĩ nhân xuất hiện trong biên niên sử."}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">PWR: {(entity.power_level ?? 0).toFixed(2)}</span>
          {entity.ascended_at_tick != null && (
            <span className="font-mono">Tick #{entity.ascended_at_tick}</span>
          )}
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-border mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            Đã ghi vào biên niên sử
          </span>
          {universeId != null && (
            <Link
              href={`/dashboard/cosmologic?universe=${universeId}#chronicle`}
              className="text-[10px] font-semibold tracking-widest text-amber-500/90 hover:text-amber-400 transition-colors uppercase"
            >
              Xem sử
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
