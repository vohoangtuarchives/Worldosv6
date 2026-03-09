"use client";

import { AlertTriangle } from "lucide-react";

export interface ErrorBannerProps {
  message: string;
  className?: string;
}

export function ErrorBanner({ message, className = "" }: ErrorBannerProps) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/50 text-destructive text-sm rounded-lg ${className}`}>
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
