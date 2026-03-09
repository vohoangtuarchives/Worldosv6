"use client";

import React from "react";
import { SimulationProvider } from "@/context/SimulationContext";
import { CosmologicDashboard } from "@/components/dashboard/CosmologicDashboard";

export default function CosmologicPage() {
  return (
    <SimulationProvider>
      <CosmologicDashboard embedded={false} />
    </SimulationProvider>
  );
}
