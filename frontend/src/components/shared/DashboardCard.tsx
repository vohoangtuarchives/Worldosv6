"use client";

import type { ReactNode } from "react";
import { DashboardSectionTitle } from "./DashboardSectionTitle";

interface DashboardCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ title, children, className = "" }: DashboardCardProps) {
  return (
    <section
      className={`rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm ${className}`}
    >
      {title && (
        <DashboardSectionTitle className="mb-4">
          {title}
        </DashboardSectionTitle>
      )}
      {children}
    </section>
  );
}
