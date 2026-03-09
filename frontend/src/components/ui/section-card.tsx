"use client";

import type { ReactNode } from "react";

export interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm ${className}`}
    >
      {title && (
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
