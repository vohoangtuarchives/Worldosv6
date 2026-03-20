import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const simulationKeys = {
  all: ["simulation"] as const,
  universes: () => [...simulationKeys.all, "universes"] as const,
  universe: (id: number | null) => [...simulationKeys.all, "universe", id] as const,
  snapshots: (id: number | null) => [...simulationKeys.all, "snapshots", id] as const,
  latestSnapshot: (id: number | null) => [...simulationKeys.all, "latestSnapshot", id] as const,
  actors: (id: number | null) => [...simulationKeys.all, "actors", id] as const,
  institutions: (id: number | null) => [...simulationKeys.all, "institutions", id] as const,
  chronicles: (id: number | null) => [...simulationKeys.all, "chronicles", id] as const,
  supremeEntities: (id: number | null) => [...simulationKeys.all, "supremeEntities", id] as const,
  materials: (id: number | null) => [...simulationKeys.all, "materials", id] as const,
  interactions: (id: number | null) => [...simulationKeys.all, "interactions", id] as const,
  trajectories: (id: number | null) => [...simulationKeys.all, "trajectories", id] as const,
  anomalies: (id: number | null) => [...simulationKeys.all, "anomalies", id] as const,
};

export function useUniverses() {
  return useQuery({
    queryKey: simulationKeys.universes(),
    queryFn: async () => {
      const resp = await api.universes() as any;
      return resp.data || [];
    },
  });
}

export function useUniverse(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.universe(id),
    queryFn: async () => {
      if (!id) return null;
      const resp = await api.universe(id) as any;
      return resp.data || null;
    },
    enabled: !!id,
  });
}

export function useLatestSnapshot(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.latestSnapshot(id),
    queryFn: async () => {
      if (!id) return null;
      const resp = await api.snapshots(id, 1) as any;
      const data = resp.data || resp || [];
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: !!id,
    refetchInterval: 5000, 
  });
}

export function useActors(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.actors(id),
    queryFn: async () => {
      if (!id) return [];
      const resp = await api.actors(id) as any;
      return resp.data || resp || [];
    },
    enabled: !!id,
  });
}

export function useInstitutions(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.institutions(id),
    queryFn: async () => {
      if (!id) return [];
      const resp = await api.institutions(id) as any;
      return resp.data || resp || [];
    },
    enabled: !!id,
  });
}

export function useAnomalies(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.anomalies(id),
    queryFn: async () => {
      if (!id) return [];
      const resp = await api.anomalies(id) as any;
      return resp.data || resp || [];
    },
    enabled: !!id,
  });
}

export function useSupremeEntities(id: number | null) {
    return useQuery({
      queryKey: simulationKeys.supremeEntities(id),
      queryFn: async () => {
        if (!id) return [];
        const resp = await api.supremeEntities(id) as any;
        return resp.data || resp || [];
      },
      enabled: !!id,
    });
}

export function useChronicles(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.chronicles(id),
    queryFn: async () => {
      if (!id) return [];
      const resp = await api.chronicle(id) as any;
      return resp.data || resp || [];
    },
    enabled: !!id,
  });
}

export function useInteractions(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.interactions(id),
    queryFn: async () => {
      if (!id) return [];
      const resp = await api.interactions(id) as any;
      return resp.data || resp || [];
    },
    enabled: !!id,
  });
}

export function useTrajectories(id: number | null) {
  return useQuery({
    queryKey: simulationKeys.trajectories(id),
    queryFn: async () => {
      if (!id) return [];
      const resp = await api.trajectories(id) as any;
      return resp.data || resp || [];
    },
    enabled: !!id,
  });
}

export function useMaterials(id: number | null) {
    return useQuery({
      queryKey: simulationKeys.materials(id),
      queryFn: async () => {
        if (!id) return [];
        const resp = await api.materials(id) as any;
        return resp.data || resp || [];
      },
      enabled: !!id,
    });
}

export function useAdvanceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ universeId, ticks }: { universeId: number; ticks: number }) => {
      return await api.advance(universeId, ticks);
    },
    onSuccess: (_data: any, variables: { universeId: number; ticks: number }) => {
      // Refresh dữ liệu snapshots sau khi advance
      queryClient.invalidateQueries({ queryKey: simulationKeys.latestSnapshot(variables.universeId) });
      queryClient.invalidateQueries({ queryKey: simulationKeys.universe(variables.universeId) });
    },
  });
}
