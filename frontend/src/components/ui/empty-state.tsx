"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  message,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-12 text-center text-muted-foreground ${className}`}>
      <div className="flex flex-col items-center gap-3">
        {icon ?? <Inbox className="h-10 w-10 text-muted-foreground/70" />}
        <p className="text-sm">{message}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
