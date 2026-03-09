"use client";

import React, { useEffect } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { MetricGrid } from "@/components/Simulation/MetricGrid";
import { UniverseTimelineChart } from "@/components/Simulation/UniverseTimelineChart";
import { CivilizationMap } from "@/components/Simulation/CivilizationMap";
import { EventTimelineStrip } from "@/components/Simulation/EventTimelineStrip";
import { CollapseMonitor } from "@/components/Simulation/CollapseMonitor";
import { AttractorPhaseSpaceMap } from "@/components/Simulation/AttractorPhaseSpaceMap";
import { DashboardCard } from "./DashboardCard";
import { DashboardEmptyState } from "./DashboardEmptyState";

export function MicroView() {
  const { universeId, latestSnapshot, setUniverseId, universes } = useSimulation();

  useEffect(() => {
    if (!universeId && universes.length > 0) {
      setUniverseId(universes[0].id);
    }
  }, [universeId, universes, setUniverseId]);

  if (!universeId) {
    return (
      <DashboardEmptyState message="Chọn universe từ dropdown trên header để xem observatory." />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-[10px] text-muted-foreground">
        Cuộn xuống để xem: Phase space, Bản đồ văn minh, Event timeline, Collapse monitor.
      </p>

      <DashboardCard title="Chỉ số Universe">
        <MetricGrid snapshot={latestSnapshot} className="grid grid-cols-2 lg:grid-cols-4 gap-4" />
      </DashboardCard>

      <DashboardCard title="Timeline Universe">
        <UniverseTimelineChart universeId={universeId} />
      </DashboardCard>

      <DashboardCard title="Phase space – Emergent attractors">
        <AttractorPhaseSpaceMap universeId={universeId} limit={300} />
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Bản đồ văn minh" className="min-h-[320px]">
          <CivilizationMap universeId={universeId} />
        </DashboardCard>
        <DashboardCard title="Event timeline" className="min-h-[320px]">
          <EventTimelineStrip universeId={universeId} />
        </DashboardCard>
      </div>

      <DashboardCard title="Collapse monitor">
        <CollapseMonitor universeId={universeId} />
      </DashboardCard>
    </div>
  );
}
