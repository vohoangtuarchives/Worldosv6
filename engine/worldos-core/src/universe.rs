//! Universe state: zones (SlotMap), global_entropy, knowledge_core.
//! 3-phase tick: (1) zone local update, (2) aggregate, (3) diffusion.

use serde::{Deserialize, Serialize};

use crate::constants;
use crate::types::{CulturalVector, UniverseSnapshot, ZoneState};

/// Opaque zone key (for future SlotMap use).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ZoneId(pub u32);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniverseState {
    pub universe_id: u64,
    pub tick: u64,
    pub zones: Vec<ZoneStateSerial>,
    pub global_entropy: f64,
    pub knowledge_core: f64,
    #[serde(default)]
    pub scars: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoneStateSerial {
    pub id: u32,
    pub state: ZoneState,
    pub neighbors: Vec<u32>,
}

impl UniverseState {
    pub fn new(universe_id: u64) -> Self {
        Self {
            universe_id,
            tick: 0,
            zones: Vec::new(),
            global_entropy: 0.0,
            knowledge_core: 0.0,
            scars: Vec::new(),
        }
    }

    /// Single zone for testing / minimal run.
    pub fn with_one_zone(universe_id: u64, base_mass: f64) -> Self {
        let mut z = ZoneState::new(base_mass);
        z.update_material_stress();
        Self {
            universe_id,
            tick: 0,
            zones: vec![ZoneStateSerial {
                id: 0,
                state: z,
                neighbors: vec![],
            }],
            global_entropy: 0.0,
            knowledge_core: 0.0,
            scars: Vec::new(),
        }
    }

    /// Run one 3-phase tick (simplified: no SlotMap in this struct; we use vec for serialization).
    pub fn tick(&mut self, _world: &crate::types::WorldConfig) {
        // Phase 1: local zone update (entropy, organization, decay)
        let k1 = constants::K1_ENTROPY_PER_STRUCTURED;
        for z in &mut self.zones {
            let base = z.state.base_mass;
            let structured = z.state.structured_mass;
            let entropy = z.state.entropy;

            // Organization: some base_mass -> structured; entropy += k1 * delta_structured
            let extraction_rate = 0.01_f64.min((base - structured).max(0.0) / (base + 1e-6));
            let delta_structured = base * extraction_rate * 0.1;
            z.state.structured_mass += delta_structured;
            z.state.entropy += k1 * delta_structured;

            // Decay: structured loses to entropy
            z.state.structured_mass -= entropy * 0.02 * structured;
            z.state.structured_mass = z.state.structured_mass.max(0.0);

            // Material Pressure Resolver (WorldOS V6 §8.3)
            // DeltaEntropy = k * Output * pressure_entropy
            // Resonance: If >1 material, multiplier = 1.0 + 0.1 * (count - 1)
            let mat_count = z.state.active_materials.len();
            if mat_count > 0 {
                let resonance_mult = 1.0 + 0.1 * (mat_count as f64 - 1.0);
                for mat in &z.state.active_materials {
                    let impact = mat.output * resonance_mult * 0.01; // Scale factor per tick
                    
                    // Entropy impact
                    z.state.entropy += mat.pressure_coefficients.entropy * impact;
                    
                    // Order impact (reduces entropy or increases stability - here mapped to entropy reduction)
                    if mat.pressure_coefficients.order > 0.0 {
                        z.state.entropy -= mat.pressure_coefficients.order * impact * 0.5;
                    }

                    // Innovation/Knowledge impact
                    z.state.embodied_knowledge += mat.pressure_coefficients.innovation * impact * 10.0;
                    
                    // Growth impact (increases structured_mass organization rate or free_energy)
                    if mat.pressure_coefficients.growth > 0.0 {
                        z.state.free_energy += mat.pressure_coefficients.growth * impact * 5.0;
                    }
                }
            }

            z.state.enforce_invariant();
            z.state.update_material_stress();
        }

        // Phase 2: aggregate global_entropy, knowledge_core
        let n = self.zones.len() as f64;
        if n > 0.0 {
            self.global_entropy = self
                .zones
                .iter()
                .map(|z| z.state.entropy)
                .sum::<f64>()
                / n;
            self.knowledge_core = self
                .zones
                .iter()
                .map(|z| z.state.embodied_knowledge)
                .sum::<f64>()
                / n;
        }

        // Phase 3: Diffusion (Entropy & MaterialStress)
        // We calculate deltas first to avoid mutable borrow conflicts
        let beta = 0.05; // Diffusion coefficient
        let mut entropy_deltas = vec![0.0; self.zones.len()];
        let mut stress_deltas = vec![0.0; self.zones.len()];

        for (i, zone) in self.zones.iter().enumerate() {
            let mut s_diff_sum = 0.0;
            let mut stress_diff_sum = 0.0;
            let neighbors: Vec<usize> = zone.neighbors.iter()
                .map(|&id| id as usize)
                .filter(|&j| j < self.zones.len())
                .collect();
            
            if neighbors.is_empty() { continue; }

            for &j in &neighbors {
                let neighbor = &self.zones[j];
                s_diff_sum += neighbor.state.entropy - zone.state.entropy;
                stress_diff_sum += neighbor.state.material_stress - zone.state.material_stress;
            }

            // Average difference * beta
            entropy_deltas[i] = beta * s_diff_sum / (neighbors.len() as f64);
            stress_deltas[i] = beta * stress_diff_sum / (neighbors.len() as f64);
        }

        // Apply deltas
        for (i, zone) in self.zones.iter_mut().enumerate() {
            zone.state.entropy += entropy_deltas[i];
            zone.state.material_stress += stress_deltas[i];
            
            // Clamp values
            zone.state.entropy = zone.state.entropy.clamp(0.0, 1.0);
            zone.state.material_stress = zone.state.material_stress.clamp(0.0, 1.0);
        }

        self.tick += 1;
    }

    /// Pressure = f(inequality, entropy, trauma, MaterialStress) (§3.2).
    pub fn pressure_at_zone(&self, zone_index: usize) -> f64 {
        if zone_index >= self.zones.len() {
            return 0.0;
        }
        let z = &self.zones[zone_index].state;
        (z.inequality * 0.3 + z.entropy * 0.3 + z.trauma * 0.2 + z.material_stress * 0.2).clamp(0.0, 1.0)
    }

    pub fn to_snapshot(&self) -> UniverseSnapshot {
        let state_vector = serde_json::to_value(&self.zones).unwrap_or(serde_json::json!([]));
        let stability_index = if self.global_entropy < 1.0 {
            Some(1.0 - self.global_entropy)
        } else {
            Some(0.0)
        };
        UniverseSnapshot {
            universe_id: self.universe_id,
            tick: self.tick,
            state_vector,
            entropy: Some(self.global_entropy),
            stability_index,
            metrics: Some(serde_json::json!({
                "knowledge_core": self.knowledge_core,
                "zone_count": self.zones.len(),
                "scars": self.scars
            })),
        }
    }
}
