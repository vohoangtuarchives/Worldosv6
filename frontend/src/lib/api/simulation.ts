/**
 * lib/api/simulation.ts — Simulation control endpoints
 */
import { apiFetch } from './fetch';

export const simulationApi = {
  async advance(universe_id: number, ticks: number) {
    return apiFetch(`/worldos/simulation/advance`, { method: "POST", body: JSON.stringify({ universe_id, ticks }) });
  },
  async fork(universeId: number, tick?: number) {
    return apiFetch(`/worldos/universes/${universeId}/fork`, { method: "POST", body: JSON.stringify({ tick: tick ?? 0 }) });
  },
  async scenarios() {
    return apiFetch("/worldos/scenarios");
  },
  async launchScenario(id: number, scenarioId: string) {
    return apiFetch(`/worldos/universes/${id}/scenario`, { method: "POST", body: JSON.stringify({ scenario_id: scenarioId }) });
  },
  async seedDemo() {
    return apiFetch(`/worldos/demo/seed`, { method: "POST" });
  },
  async getAgentConfig() {
    return apiFetch("/worldos/agent-config");
  },
  async saveAgentConfig(config: Record<string, unknown>) {
    return apiFetch("/worldos/agent-config", { method: "POST", body: JSON.stringify(config) });
  },
  async edicts() {
    return apiFetch("/worldos/edicts");
  },
  async decree(id: number, edictId: string) {
    return apiFetch(`/worldos/universes/${id}/decree`, { method: "POST", body: JSON.stringify({ edict_id: edictId }) });
  },
  async worldosEngines() {
    return apiFetch("/worldos/engines");
  },
  async apexCommand(universeId: number, command: Record<string, unknown>) {
    return apiFetch(`/worldos/universes/${universeId}/apex/command`, { method: "POST", body: JSON.stringify(command) });
  },
};
