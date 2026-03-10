"use client";

import React, { Suspense } from "react";
import { CosmologicDashboard } from "@/components/dashboard/CosmologicDashboard";

function CosmologicFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-background text-muted-foreground">
      <span className="animate-pulse">Đang tải dashboard...</span>
    </div>
  );
}

export default function CosmologicPage() {
  return (
    <Suspense fallback={<CosmologicFallback />}>
      <CosmologicDashboard embedded={false} />
    </Suspense>
  );
}
