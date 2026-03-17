/**
 * lib/api/ecology.ts — Materials, biology, environment endpoints
 */
import { apiFetch } from './fetch';

export const ecologyApi = {
  async materials(id: number) {
    return apiFetch(`/worldos/universes/${id}/materials`);
  },
  async materialDag(id: number) {
    return apiFetch(`/worldos/universes/${id}/material-dag`);
  },
  async biologyMetrics(id: number) {
    return apiFetch(`/worldos/universes/${id}/biology-metrics`);
  },
  async environmentMetrics(id: number) {
    return apiFetch(`/worldos/universes/${id}/environment-metrics`);
  },
  async topology(id: number) {
    return apiFetch(`/worldos/universes/${id}/topology`);
  },
};
