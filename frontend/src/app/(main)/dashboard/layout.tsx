"use client";

import { SimulationProvider } from "@/context/SimulationContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimulationProvider>
      <DashboardShell>{children}</DashboardShell>
    </SimulationProvider>
  );
}
