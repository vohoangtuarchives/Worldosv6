'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import api from '@/lib/api';
import type {
  ActorSummary,
  ActorDetail,
  ActorEvent,
  ActorDecision,
  SupremeEntity,
} from '@/types/api';

// ── Actor list for a universe (auto-refresh every 10s) ──

export function useActors(universeId: number | null) {
  const { data, error, isLoading } = useQuery<{ data: ActorSummary[] }>({
    queryKey: ['universes', universeId, 'actors'],
    queryFn: () =>
      api
        .get(`/worldos/universes/${universeId}/actors`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  return {
    actors: data?.data ?? [],
    isLoading,
    isError: error,
  };
}

// ── Single actor detail ──

export function useActorDetail(actorId: number | null) {
  const { data, error, isLoading } = useQuery<{ data: ActorDetail }>({
    queryKey: ['actors', actorId],
    queryFn: () =>
      api.get(`/worldos/actors/${actorId}`).then((res) => res.data),
    enabled: !!actorId,
    refetchOnWindowFocus: true,
  });

  return {
    actor: data?.data ?? null,
    isLoading,
    isError: error,
  };
}

// ── Actor events ──

export function useActorEvents(actorId: number | null) {
  const { data, error, isLoading } = useQuery<{ data: ActorEvent[] }>({
    queryKey: ['actors', actorId, 'events'],
    queryFn: () =>
      api.get(`/worldos/actors/${actorId}/events`).then((res) => res.data),
    enabled: !!actorId,
    refetchOnWindowFocus: true,
  });

  return {
    events: data?.data ?? [],
    isLoading,
    isError: error,
  };
}

// ── Actor decisions ──

export function useActorDecisions(actorId: number | null) {
  const { data, error, isLoading } = useQuery<{ data: ActorDecision[] }>({
    queryKey: ['actors', actorId, 'decisions'],
    queryFn: () =>
      api.get(`/worldos/actors/${actorId}/decisions`).then((res) => res.data),
    enabled: !!actorId,
    refetchOnWindowFocus: true,
  });

  return {
    decisions: data?.data ?? [],
    isLoading,
    isError: error,
  };
}

// ── Supreme entities for a universe ──

export function useSupremeEntities(universeId: number | null) {
  const { data, error, isLoading } = useQuery<{ data: SupremeEntity[] }>({
    queryKey: ['universes', universeId, 'supreme-entities'],
    queryFn: () =>
      api
        .get(`/worldos/universes/${universeId}/supreme-entities`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchOnWindowFocus: true,
  });

  return {
    entities: data?.data ?? [],
    isLoading,
    isError: error,
  };
}

// ── Mind Meld mutation ──

interface MindMeldResponse {
  data: {
    action: string;
    confidence: number;
  };
}

export function useMindMeld() {
  return useMutation<MindMeldResponse, Error, number>({
    mutationFn: (actorId: number) =>
      api
        .post(`/worldos/actors/${actorId}/mind-meld`)
        .then((res) => res.data),
  });
}
