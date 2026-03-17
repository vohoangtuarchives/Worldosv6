"use client";

import type { ReactNode } from "react";

interface DashboardSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function DashboardSectionTitle({ children, className = "" }: DashboardSectionTitleProps) {
  return (
    <h2
      className={`text-xs font-semibold text-muted-foreground uppercase tracking-widest ${className}`}
    >
      {children}
    </h2>
  );
}
