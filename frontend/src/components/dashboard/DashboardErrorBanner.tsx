"use client";

import { ErrorBanner } from "@/components/ui/error-banner";

export interface DashboardErrorBannerProps {
  message: string;
}

export function DashboardErrorBanner({ message }: DashboardErrorBannerProps) {
  return <ErrorBanner message={message} />;
}
