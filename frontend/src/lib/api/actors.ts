/**
 * lib/api/actors.ts — Actors, great persons, institutions endpoints
 */
import { apiFetch } from './fetch';

export const actorsApi = {
  async actors(id: number) {
    return apiFetch(`/worldos/universes/${id}/actors`);
  },
  async actorEvents(actorId: number) {
    return apiFetch(`/worldos/actors/${actorId}/events`);
  },
  async greatPersons(id: number) {
    return apiFetch(`/worldos/universes/${id}/great-persons`);
  },
  async supremeEntities(id: number) {
    return apiFetch(`/worldos/universes/${id}/supreme-entities`);
  },
  async institutions(id: number) {
    return apiFetch(`/worldos/universes/${id}/institutions`);
  },
  async interactions(id: number) {
    return apiFetch(`/worldos/universes/${id}/interactions`);
  },
};
