//! Event-driven cascade: when Pressure > COLLAPSE_THRESHOLD, emit event and cascade 3–4 steps.

use crate::constants;
use crate::universe::UniverseState;
use crate::types::WorldConfig;

pub enum SimEvent {
    Crisis,
    Collapse,
    RegimeShift,
    MicroMode,
    MetaCycle,
    DeityIntervention,
    WavefunctionCollapse,
    Cosmogenesis, // Phase 61: Spontaneous generation of a child universe (§V9)
}

/// Process one tick: run 3-phase tick, then check pressure and optionally cascade.
/// Returns events emitted this tick (for logging / Laravel).
pub fn tick_with_cascade(
    state: &mut UniverseState,
    world: &WorldConfig,
    max_cascade: usize,
) -> Vec<SimEvent> {
    state.tick(world);
    let mut events = Vec::new();

    for i in 0..state.zones.len() {
        let p = state.pressure_at_zone(i);
        if p >= constants::COLLAPSE_THRESHOLD {
            events.push(SimEvent::Crisis);
            // Trigger Micro Mode if pressure is extremely high (§3.2)
            if p > 0.8 {
                events.push(SimEvent::MicroMode);
                state.trigger_micro_mode(i);
                state.scars.push(format!("Tick {}: Micro-Mode Triggered (Zone {})", state.tick, i));
            }
            // Apply one cascade step: increase entropy/trauma in this zone
            state.zones[i].state.entropy = (state.zones[i].state.entropy + 0.05).min(1.0);
            state.zones[i].state.trauma = (state.zones[i].state.trauma + 0.03).min(1.0);
            state.zones[i].state.update_material_stress();
        } else {
            // If pressure is low and we have agents, resolve them (§3.2)
            if !state.zones[i].state.agents.is_empty() && p < 0.4 {
                state.resolve_micro_mode(i);
            }
        }

        // Phase 53: Hyper-Agents & Deities (§53)
        let mut deity_interventions = Vec::new();
        for agent in &state.zones[i].state.agents {
            for (idx, &val) in agent.trait_vector.iter().enumerate() {
                if val > 0.95 {
                    deity_interventions.push((agent.id, idx));
                }
            }
        }

        for (agent_id, trait_idx) in deity_interventions {
            events.push(SimEvent::DeityIntervention);
            state.perform_deity_intervention(i, trait_idx);
            state.scars.push(format!("Tick {}: DEITY INTERVENTION by Agent {} (Trait {})", state.tick, agent_id, trait_idx));
        }

        // Phase 57: Quantum Realities & Observer Effect (§57)
        let mut collapse_triggered = false;
        let mut entropy_delta = 0.0;
        
        // 1. Immutable check (or scoped mutable) to get changes
        if let Some(overlay) = &state.zones[i].state.quantum_overlay {
            let presence = overlay.observer_presence;
            if presence > 0.1 {
                entropy_delta = 0.01 * presence;
            }
        }

        // 2. Apply entropy change (needs mutable state.zones[i].state)
        if entropy_delta > 0.0 {
            state.zones[i].state.entropy = (state.zones[i].state.entropy + entropy_delta).min(1.0);
        }

        // 3. Update overlay state (needs mutable state.zones[i].state.quantum_overlay)
        if let Some(overlay) = &mut state.zones[i].state.quantum_overlay {
            if overlay.observer_presence > 0.1 {
                if overlay.superposition_depth > 0.5 {
                    overlay.superposition_depth = (overlay.superposition_depth - overlay.probability_decay).max(0.0);
                    if overlay.superposition_depth <= 0.0 {
                        collapse_triggered = true;
                    }
                }
            } else {
                overlay.superposition_depth = (overlay.superposition_depth + 0.02).min(1.0);
            }
        }

        if collapse_triggered {
            events.push(SimEvent::WavefunctionCollapse);
            state.scars.push(format!("Tick {}: Wavefunction Collapse (Zone {})", state.tick, i));
        }

        // Phase 61: Spontaneous Birth Trigger (§V9)
        // Criteria: Peak Knowledge + Extreme Order + Structural Coherence
        if state.zones[i].state.embodied_knowledge > 0.95 
           && state.zones[i].state.entropy < 0.05 
           && state.sci > 0.9 {
            // Low probability check to prevent spawning too fast
            let seed = (state.tick + i as u64) % 1000;
            if seed == 0 {
                events.push(SimEvent::Cosmogenesis);
                state.scars.push(format!("Tick {}: CƠN SỐT SÁNG THẾ (Cosmogenesis) tại Zone {}", state.tick, i));
            }
        }
    }

    if state.check_meta_cycle() {
        events.push(SimEvent::MetaCycle);
    }

    // Limit cascade depth
    if events.len() > max_cascade {
        events.truncate(max_cascade);
    }
    events
}
