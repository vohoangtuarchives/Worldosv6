//! Event-driven cascade: when Pressure > COLLAPSE_THRESHOLD, emit event and cascade Famine → Riots → Collapse.

use crate::constants;
use crate::universe::UniverseState;
use crate::types::{CascadePhase, WorldConfig};

fn phase_name(p: CascadePhase) -> &'static str {
    match p {
        CascadePhase::Normal => "Normal",
        CascadePhase::Famine => "Famine",
        CascadePhase::Riots => "Riots",
        CascadePhase::Collapse => "Collapse",
    }
}

pub enum SimEvent {
    Crisis,
    Famine,
    Riots,
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
        let phase = state.zones[i].state.cascade_phase;

        if p >= constants::COLLAPSE_THRESHOLD {
            // Advance cascade: Normal → Famine → Riots → Collapse
            let (next_phase, event) = match phase {
                CascadePhase::Normal => (CascadePhase::Famine, SimEvent::Famine),
                CascadePhase::Famine => (CascadePhase::Riots, SimEvent::Riots),
                CascadePhase::Riots => (CascadePhase::Collapse, SimEvent::Collapse),
                CascadePhase::Collapse => (CascadePhase::Collapse, SimEvent::Crisis), // hold Collapse, still emit Crisis
            };
            state.zones[i].state.cascade_phase = next_phase;
            events.push(event);
            if phase == CascadePhase::Normal {
                events.push(SimEvent::Crisis);
            }
            // Trigger Micro Mode if pressure is extremely high (§3.2)
            if p > 0.8 {
                events.push(SimEvent::MicroMode);
                state.trigger_micro_mode(i);
                state.scars.push(format!("Tick {}: Micro-Mode Triggered (Zone {})", state.tick, i).into());
            }
            // Escalating entropy/trauma: Famine light, Riots stronger, Collapse heaviest
            let (entropy_step, trauma_step) = match next_phase {
                CascadePhase::Famine => (0.03, 0.02),
                CascadePhase::Riots => (0.05, 0.04),
                CascadePhase::Collapse => (0.08, 0.06),
                CascadePhase::Normal => (0.05, 0.03),
            };
            state.zones[i].state.entropy = (state.zones[i].state.entropy + entropy_step).min(1.0);
            state.zones[i].state.trauma = (state.zones[i].state.trauma + trauma_step).min(1.0);
            state.zones[i].state.update_material_stress();
            state.scars.push(format!("Tick {}: {} (Zone {})", state.tick, phase_name(next_phase), i).into());
            if next_phase == CascadePhase::Collapse {
                state.zones[i].state.active_materials.clear();
            }
        } else {
            state.zones[i].state.cascade_phase = CascadePhase::Normal;
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
            state.scars.push(format!("Tick {}: DEITY INTERVENTION by Agent {} (Trait {})", state.tick, agent_id, trait_idx).into());
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
            state.scars.push(format!("Tick {}: Wavefunction Collapse (Zone {})", state.tick, i).into());
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
                state.scars.push(format!("Tick {}: CƠN SỐT SÁNG THẾ (Cosmogenesis) tại Zone {}", state.tick, i).into());
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::WorldConfig;
    use crate::universe::UniverseState;

    fn world_config() -> WorldConfig {
        WorldConfig { world_id: 1, axiom: None, world_seed: None, origin: String::new() }
    }

    fn set_high_pressure(state: &mut UniverseState, zone_idx: usize) {
        let z = &mut state.zones[zone_idx].state;
        z.entropy = 0.95;
        z.trauma = 0.95;
        z.material_stress = 0.95;
        z.inequality = 0.95;
    }

    #[test]
    fn test_cascade_phase_famine_riots_collapse() {
        let world = world_config();
        let mut state = UniverseState::with_one_zone(1, 100.0);
        set_high_pressure(&mut state, 0);
        assert!(state.pressure_at_zone(0) >= constants::COLLAPSE_THRESHOLD);

        let ev1 = tick_with_cascade(&mut state, &world, 20);
        assert_eq!(state.zones[0].state.cascade_phase, CascadePhase::Famine);
        assert!(ev1.iter().any(|e| matches!(e, SimEvent::Famine)));

        set_high_pressure(&mut state, 0);
        let ev2 = tick_with_cascade(&mut state, &world, 20);
        assert_eq!(state.zones[0].state.cascade_phase, CascadePhase::Riots);
        assert!(ev2.iter().any(|e| matches!(e, SimEvent::Riots)));

        set_high_pressure(&mut state, 0);
        let ev3 = tick_with_cascade(&mut state, &world, 20);
        assert_eq!(state.zones[0].state.cascade_phase, CascadePhase::Collapse);
        assert!(ev3.iter().any(|e| matches!(e, SimEvent::Collapse)));
        assert!(state.zones[0].state.active_materials.is_empty());
    }
}
