import { useEffect } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useSimulation } from "@/context/SimulationContext";

export function useZenithSync(universeId: number | null) {
  const store = useWorldStore();
  const { latestSnapshot, liveEvents, isPaused } = useSimulation();

  // 1. Fetch Initial Data Graph
  const { data: graphData } = useQuery({
    queryKey: ["zenith_graph", universeId],
    queryFn: () => (universeId ? api.graph(universeId) : null),
    enabled: !!universeId,
    refetchOnWindowFocus: false,
  });

  // 2. Fetch Initial Hex Zones Environment & Society
  const { data: envData } = useQuery({
    queryKey: ["zenith_env", universeId],
    queryFn: () => (universeId ? api.environmentMetrics(universeId) : null),
    enabled: !!universeId,
  });

  const { data: societyData } = useQuery({
    queryKey: ["zenith_society", universeId],
    queryFn: () => (universeId ? api.societyMetrics(universeId) : null),
    enabled: !!universeId,
  });

  // 3. Fetch Initial Topology (Grid X/Y)
  const { data: topologyData } = useQuery({
    queryKey: ["zenith_topology", universeId],
    queryFn: () => (universeId ? api.topology(universeId) : null),
    enabled: !!universeId,
  });

  // Sync Global Settings
  useEffect(() => {
    if (universeId !== store.universeId) {
      store.setUniverseId(universeId || 0);
    }
  }, [universeId, store.universeId]);

  // Sync Initial Graph
  useEffect(() => {
    if (graphData && (graphData as any).nodes && (graphData as any).edges) {
      store.updateGraph((graphData as any).nodes, (graphData as any).edges);
    }
  }, [graphData]);

  // Sync Initial Zones
  useEffect(() => {
    if (envData?.zones) {
      const topoMap = new Map();
      if ((topologyData as any)?.zones) {
        (topologyData as any).zones.forEach((tz: any) => {
          topoMap.set(tz.id, { x: tz.x || 0, y: tz.y || 0 });
        });
      }

      const mergedZones = envData.zones.map((z: any) => {
        const matchingSociety = societyData?.settlements?.[z.id];
        const topo = topoMap.get(z.id) || { x: 0, y: 0 };
        return {
          zone_id: Number(z.id),
          x: topo.x,
          y: topo.y,
          urban_density: matchingSociety?.population || 0,
          entropy: 0, // Fallback entropy
          resource_extraction: matchingSociety?.resource_surplus || z.mineral_richness || 0,
          fear: 0,
          danger_level: z.ecosystem_state === "COLLAPSED" ? "CRITICAL" : "SAFE",
        };
      });
      store.updateZones(mergedZones);
    }
  }, [envData, societyData, topologyData]);

  // Sync Realtime Snapshot Ticks
  useEffect(() => {
    if (latestSnapshot?.tick && !isPaused) {
      store.updateTick(latestSnapshot.tick);
      store.clearExpiredCalamities(latestSnapshot.tick);
      
      // Update zone entropy if passed from snapshot metrics
      if (latestSnapshot.metrics?.zones_entropy) {
        // ... logic for bulk update
      }
    }
  }, [latestSnapshot?.tick, isPaused]);

  // Handle Live Events from Centrifuge
  useEffect(() => {
    if (liveEvents && liveEvents.length > 0) {
      const lastEvent = liveEvents[0];
      
      // Listen for Calamities
      if (lastEvent.type === "calamity_triggered") {
        store.addCalamity({
          id: lastEvent.id,
          type: lastEvent.payload.type || "UNKNOWN",
          epicenter_zone_id: lastEvent.payload.epicenter_zone_id || 0,
          intensity: lastEvent.payload.intensity || 1.0,
          description: lastEvent.payload.description || "Disaster strikes.",
          tick: lastEvent.tick,
        });
      }
      
      // Listen for Lore Generated
      if (lastEvent.type === "lore_generated" || lastEvent.type === "myth_created") {
        store.addSaga(lastEvent.payload.content || lastEvent.payload.description);
      }
    }
  }, [liveEvents]);
}
