//! Event-driven cascade: when Pressure > COLLAPSE_THRESHOLD, emit event and cascade 3–4 steps.

use crate::constants;
use crate::universe::UniverseState;
use crate::types::WorldConfig;

#[derive(Debug, Clone)]
pub enum SimEvent {
    Crisis,
    Collapse,
    RegimeShift,
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
            // Apply one cascade step: increase entropy/trauma in this zone
            state.zones[i].state.entropy = (state.zones[i].state.entropy + 0.05).min(1.0);
            state.zones[i].state.trauma = (state.zones[i].state.trauma + 0.03).min(1.0);
            state.zones[i].state.update_material_stress();
        }
    }

    // Limit cascade depth
    if events.len() > max_cascade {
        events.truncate(max_cascade);
    }
    events
}
