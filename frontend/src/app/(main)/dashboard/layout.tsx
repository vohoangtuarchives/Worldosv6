"use client";

import { SimulationProvider } from "@/context/SimulationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimulationProvider>
      {children}
    </SimulationProvider>
  );
}
