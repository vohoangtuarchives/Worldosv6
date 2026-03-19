"use client";

import { SimulationProvider } from "@/context/SimulationContext";

export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <SimulationProvider>
      {children}
      {modal}
    </SimulationProvider>
  );
}
