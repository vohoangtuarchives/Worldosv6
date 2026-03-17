"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export interface DashboardEmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function DashboardEmptyState({
  message,
  icon,
  action,
}: DashboardEmptyStateProps) {
  return <EmptyState message={message} icon={icon} action={action} />;
}
