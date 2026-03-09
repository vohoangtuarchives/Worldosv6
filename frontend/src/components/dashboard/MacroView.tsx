"use client";

import React from "react";
import MacroStateMonitor from "@/components/dashboard/MacroStateMonitor";
import AttractorMap from "@/components/dashboard/AttractorMap";
import RiskAlerts from "@/components/dashboard/RiskAlerts";
import IntelligenceExplosion from "@/components/dashboard/IntelligenceExplosion";
import EvolutionTree from "@/components/dashboard/EvolutionTree";
import { DashboardCard } from "./DashboardCard";

export function MacroView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-2 row-span-2 min-h-[400px]">
        <DashboardCard>
          <MacroStateMonitor />
        </DashboardCard>
      </div>
      <div className="lg:col-span-1 min-h-[350px]">
        <DashboardCard>
          <RiskAlerts />
        </DashboardCard>
      </div>
      <div className="lg:col-span-1 min-h-[350px]">
        <DashboardCard>
          <AttractorMap />
        </DashboardCard>
      </div>
      <div className="lg:col-span-1 min-h-[350px]">
        <DashboardCard>
          <EvolutionTree />
        </DashboardCard>
      </div>
      <div className="lg:col-span-1 min-h-[350px]">
        <DashboardCard>
          <IntelligenceExplosion />
        </DashboardCard>
      </div>
    </div>
  );
}
