//! Universe state: zones (SlotMap), global_entropy, knowledge_core.
//! 3-phase tick: (1) zone local update, (2) aggregate, (3) diffusion.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use crate::constants;
use crate::types::{CulturalVector, SimulationMetrics, UniverseSnapshot, ZoneState};

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
    pub instability_gradient: f64,
    #[serde(default)]
    pub sci: f64, // Structural Coherence Index (§4.3)
    #[serde(default)]
    pub scars: Vec<serde_json::Value>,
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
            instability_gradient: 0.0,
            sci: 1.0,
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
            instability_gradient: 0.0,
            sci: 1.0,
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
            // Resonance: >=2 materials same slug -> 1.5x effect; else 1.0
            let mat_count = z.state.active_materials.len();
            let mut material_stress_delta = 0.0_f64;
            if mat_count > 0 {
                let count_by_slug: HashMap<String, u32> = z.state.active_materials.iter()
                    .fold(HashMap::new(), |mut m, mat| {
                        *m.entry(mat.slug.clone()).or_insert(0) += 1;
                        m
                    });
                for mat in &mut z.state.active_materials {
                    let same_slug_count = *count_by_slug.get(&mat.slug).unwrap_or(&0);
                    let resonance_mult = if same_slug_count >= 2 { 1.5 } else { 1.0 };
                    let impact = mat.output * resonance_mult * 0.01;

                    z.state.entropy += mat.pressure_coefficients.entropy * impact;
                    if mat.pressure_coefficients.order > 0.0 {
                        z.state.entropy -= mat.pressure_coefficients.order * impact * 0.5;
                    }
                    z.state.embodied_knowledge += mat.pressure_coefficients.innovation * impact * 10.0;
                    if mat.pressure_coefficients.growth > 0.0 {
                        z.state.free_energy += mat.pressure_coefficients.growth * impact * 5.0;
                    }
                    material_stress_delta += mat.pressure_coefficients.entropy * mat.output * resonance_mult * 0.02;

                    if let Some(core) = &mut mat.recursive_core {
                        let precision = mat.output;
                        core.virtual_entropy = (core.virtual_entropy + 0.005 * (1.0 - precision)).min(1.0);
                        core.virtual_knowledge = (core.virtual_knowledge + 0.01 * precision).min(1.0);
                        if core.virtual_knowledge > 0.5 {
                            z.state.embodied_knowledge += core.virtual_knowledge * core.feedback_loop * 0.1;
                        }
                        if core.virtual_entropy > 0.9 {
                            z.state.entropy += core.virtual_entropy * core.feedback_loop * 0.05;
                            z.state.material_stress = (z.state.material_stress + 0.1).min(1.0);
                        }
                    }
                }
            }

            z.state.enforce_invariant();

            let growth_rate = 0.001 * (z.state.tech_ceiling - z.state.knowledge_frontier).max(0.0);
            z.state.knowledge_frontier = (z.state.knowledge_frontier + growth_rate).min(z.state.tech_ceiling);

            z.state.update_material_stress();
            z.state.material_stress = (z.state.material_stress + material_stress_delta).clamp(0.0, 1.0);
        }

        // Phase 2: aggregate global_entropy, knowledge_core, SCI
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
            
            let _avg_frontier: f64 = self.zones.iter().map(|z| z.state.knowledge_frontier).sum::<f64>() / n;
            let _avg_ceiling: f64 = self.zones.iter().map(|z| z.state.tech_ceiling).sum::<f64>() / n;
            
            // SCI = 1.0 - (average material stress * entropy weight)
            let avg_stress: f64 = self.zones.iter().map(|z| z.state.material_stress).sum::<f64>() / n;
            self.sci = (1.0 - (avg_stress * 0.7 + self.global_entropy * 0.3)).clamp(0.0, 1.0);
            
            // Trigger Micro Mode if gradient is high
            self.instability_gradient = (avg_stress - 0.5).max(0.0) * 2.0; 
        }

        // Phase 3: Diffusion (Entropy, Tech, Culture) (§3, §4.4)
        let beta = constants::BETA_DIFFUSION;
        let mut entropy_deltas = vec![0.0; self.zones.len()];
        let mut tech_deltas = vec![0.0; self.zones.len()];
        let mut culture_deltas = vec![CulturalVector::default(); self.zones.len()];

        for i in 0..self.zones.len() {
            let zone = &self.zones[i];
            let neighbors: Vec<usize> = zone.neighbors.iter()
                .map(|&id| id as usize)
                .filter(|&j| j < self.zones.len() && i != j)
                .collect();
            
            if neighbors.is_empty() { continue; }
            let n_len = neighbors.len() as f64;

            let mut s_diff_sum = 0.0;
            let mut t_diff_sum = 0.0;
            let mut c_diff_sum = CulturalVector::default();

            for &j in &neighbors {
                let neighbor = &self.zones[j];
                
                // Entropy diff (T2 - Relations)
                s_diff_sum += neighbor.state.entropy - zone.state.entropy;
                // Tech/Knowledge diff
                t_diff_sum += neighbor.state.knowledge_frontier - zone.state.knowledge_frontier;
                
                // Culture diff
                c_diff_sum.tradition_rigidity += neighbor.state.cultural.tradition_rigidity - zone.state.cultural.tradition_rigidity;
                c_diff_sum.innovation_openness += neighbor.state.cultural.innovation_openness - zone.state.cultural.innovation_openness;
                c_diff_sum.collective_trust += neighbor.state.cultural.collective_trust - zone.state.cultural.collective_trust;
                c_diff_sum.violence_tolerance += neighbor.state.cultural.violence_tolerance - zone.state.cultural.violence_tolerance;
                c_diff_sum.institutional_respect += neighbor.state.cultural.institutional_respect - zone.state.cultural.institutional_respect;
                c_diff_sum.myth_belief += neighbor.state.cultural.myth_belief - zone.state.cultural.myth_belief;
            }

            entropy_deltas[i] = beta * s_diff_sum / n_len;
            tech_deltas[i] = beta * 0.5 * t_diff_sum / n_len; // Tech diffuses slower
            
            culture_deltas[i].tradition_rigidity = beta * c_diff_sum.tradition_rigidity / n_len;
            culture_deltas[i].innovation_openness = beta * c_diff_sum.innovation_openness / n_len;
            culture_deltas[i].collective_trust = beta * c_diff_sum.collective_trust / n_len;
            culture_deltas[i].violence_tolerance = beta * c_diff_sum.violence_tolerance / n_len;
            culture_deltas[i].institutional_respect = beta * c_diff_sum.institutional_respect / n_len;
            culture_deltas[i].myth_belief = beta * c_diff_sum.myth_belief / n_len;
        }

        // Apply all deltas
        for i in 0..self.zones.len() {
            let z = &mut self.zones[i];
            z.state.entropy = (z.state.entropy + entropy_deltas[i]).clamp(0.0, 1.0);
            z.state.knowledge_frontier = (z.state.knowledge_frontier + tech_deltas[i]).clamp(0.0, 1.0);
            
            z.state.cultural.tradition_rigidity = (z.state.cultural.tradition_rigidity + culture_deltas[i].tradition_rigidity).clamp(0.0, 1.0);
            z.state.cultural.innovation_openness = (z.state.cultural.innovation_openness + culture_deltas[i].innovation_openness).clamp(0.0, 1.0);
            z.state.cultural.collective_trust = (z.state.cultural.collective_trust + culture_deltas[i].collective_trust).clamp(0.0, 1.0);
            z.state.cultural.violence_tolerance = (z.state.cultural.violence_tolerance + culture_deltas[i].violence_tolerance).clamp(0.0, 1.0);
            z.state.cultural.institutional_respect = (z.state.cultural.institutional_respect + culture_deltas[i].institutional_respect).clamp(0.0, 1.0);
            z.state.cultural.myth_belief = (z.state.cultural.myth_belief + culture_deltas[i].myth_belief).clamp(0.0, 1.0);
        }

        self.tick += 1;
    }

    /// Trigger Micro Mode (Crisis Window): Spawn agents deterministically (§3.2).
    pub fn trigger_micro_mode(&mut self, zone_index: usize) {
        if let Some(z) = self.zones.get_mut(zone_index) {
            // Only spawn if not already crowded
            if z.state.agents.len() < 10 {
                use crate::agent::{Agent, Archetype};
                // Deterministic spawn from entropy + material_stress
                let seed = (self.tick as f64 + z.state.material_stress * 1000.0) as u64;
                let mut traits = [0.5; 17];
                traits[0] = (seed % 10) as f64 / 10.0; // Dominance
                traits[11] = z.state.entropy; // Fear
                
                let agent = Agent::new(seed, traits, Archetype::Opportunist);
                z.state.agents.push(agent);
            }
        }
    }

    /// Resolve Micro Mode: Aggregate agent actions into Macro Deltas (§3.2, §5).
    /// Ends the crisis window and pushes an event to the chronicle.
    pub fn resolve_micro_mode(&mut self, zone_index: usize) -> Vec<String> {
        let mut events = Vec::new();
        if let Some(z) = self.zones.get_mut(zone_index) {
            if z.state.agents.is_empty() { return events; }
            
            let avg_violence: f64 = z.state.agents.iter()
                .map(|a| a.trait_vector[12]) // Vengeance
                .sum::<f64>() / z.state.agents.len() as f64;
            
            if avg_violence > 0.7 {
                z.state.trauma += 0.1;
                events.push("Violent Conflict Rooted".to_string());
            }
            
            // Garbage collect agents (§3.2)
            z.state.agents.clear();
        }
        events
    }

    /// Pressure = f(inequality, entropy, trauma, MaterialStress) (§3.2).
    pub fn pressure_at_zone(&self, zone_index: usize) -> f64 {
        if zone_index >= self.zones.len() {
            return 0.0;
        }
        let z = &self.zones[zone_index].state;
        (z.inequality * 0.2 + z.entropy * 0.3 + z.trauma * 0.2 + z.material_stress * 0.3).clamp(0.0, 1.0)
    }

    pub fn to_snapshot(&self) -> UniverseSnapshot {
        let state_vector = serde_json::to_value(&self.zones).unwrap_or(serde_json::json!([]));
        let metrics = self.calculate_metrics();
        UniverseSnapshot {
            universe_id: self.universe_id,
            tick: self.tick,
            state_vector,
            entropy: Some(self.global_entropy),
            stability_index: Some(metrics.order),
            metrics: Some(serde_json::to_value(&metrics).unwrap_or(serde_json::json!({}))),
        }
    }

    pub fn calculate_metrics(&self) -> SimulationMetrics {
        let order = 1.0 - self.global_entropy;
        let sum_v: f64 = self.zones.iter()
            .map(|z| z.state.active_materials.iter().map(|m| m.output).sum::<f64>())
            .sum();
        let energy = (1.0 + sum_v).ln();
        let ip_score = order * (1.0 - self.global_entropy / 2.0);

        SimulationMetrics {
            order,
            energy,
            ip_score,
            knowledge_core: self.knowledge_core,
            tech_ceiling_avg: self.zones.iter().map(|z| z.state.tech_ceiling).sum::<f64>() / (self.zones.len() as f64).max(1.0),
            knowledge_frontier_avg: self.zones.iter().map(|z| z.state.knowledge_frontier).sum::<f64>() / (self.zones.len() as f64).max(1.0),
            instability_gradient: self.instability_gradient,
            zone_count: self.zones.len() as u32,
            scars: self.scars.clone(),
        }
    }

    /// Check for Meta-Cycle trigger (§4.3): Major collapse when SCI is too low.
    pub fn check_meta_cycle(&mut self) -> bool {
        if self.sci < 0.3 {
            self.global_entropy = (self.global_entropy + 0.3).min(1.0);
            for z in &mut self.zones {
                z.state.entropy = (z.state.entropy + 0.5).min(1.0);
                z.state.active_materials.clear(); 
            }
            self.scars.push(format!("Phát động Meta-Cycle tại tick {}", self.tick).into());
            return true;
        }
        false
    }

    pub fn merge(&mut self, other: UniverseState) {
        self.tick = self.tick.max(other.tick);
        self.global_entropy = (self.global_entropy + other.global_entropy) / 2.0;
        self.knowledge_core = self.knowledge_core.max(other.knowledge_core);

        for other_z in other.zones {
            // Check for ID collision
            let mut found_index = None;
            for (i, z) in self.zones.iter().enumerate() {
                if z.id == other_z.id {
                    found_index = Some(i);
                    break;
                }
            }

            if let Some(idx) = found_index {
                // Conflict Resolution via Material Resonance (§52.2)
                let existing_z = &mut self.zones[idx];
                Self::resolve_collision_static(existing_z, &other_z);
            } else {
                // Unique zone, simply integrate
                self.zones.push(other_z);
            }
        }
        
        self.sci = (self.sci + other.sci) / 2.0;
    }

    fn resolve_collision_static(existing: &mut ZoneStateSerial, other: &ZoneStateSerial) {
        // Higher Frontier dominates but absorbs entropy
        if other.state.knowledge_frontier > existing.state.knowledge_frontier {
            existing.state.knowledge_frontier = other.state.knowledge_frontier;
            existing.state.tech_ceiling = existing.state.tech_ceiling.max(other.state.tech_ceiling);
        }
        
        // Blend entropy and trauma
        existing.state.entropy = (existing.state.entropy + other.state.entropy) / 2.0;
        existing.state.trauma = (existing.state.trauma + other.state.trauma).min(1.0);
        
        // Merge Material Instances
        for m_other in &other.state.active_materials {
            if !existing.state.active_materials.iter().any(|m| m.slug == m_other.slug) {
                existing.state.active_materials.push(m_other.clone());
            }
        }
    }
    /// Apply effects of hyper-agents on the universe (§53.1).
    pub fn perform_deity_intervention(&mut self, zone_index: usize, trait_index: usize) {
        if let Some(z) = self.zones.get_mut(zone_index) {
            match trait_index {
                // Power traits (Dominance, Ambition, Aggression)
                0 | 1 | 2 => {
                    z.state.embodied_knowledge = (z.state.embodied_knowledge + 0.05).min(1.0);
                    z.state.entropy = (z.state.entropy + 0.02).min(1.0); // Reduced from 0.05
                },
                // Empathy/Social traits (Compassion, Altruism)
                4 | 5 => {
                    z.state.entropy = (z.state.entropy - 0.15).max(0.0); // Increased cooling
                    z.state.trauma = (z.state.trauma - 0.1).max(0.0);    // Increased healing
                },
                // Cognitive/Curiosity (Intellect)
                8 => {
                    z.state.knowledge_frontier = (z.state.knowledge_frontier + 0.08).min(z.state.tech_ceiling);
                },
                // Fear/Grief (High-distress triggers)
                11 | 14 => {
                    z.state.trauma = (z.state.trauma + 0.08).min(1.0);
                    z.state.entropy = (z.state.entropy + 0.01).min(1.0);
                },
                _ => {}
            }
            z.state.update_material_stress();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{ActiveMaterial, PressureCoefficients, WorldConfig};

    #[test]
    fn test_micro_mode_trigger() {
        let mut state = UniverseState::with_one_zone(1, 100.0);
        assert_eq!(state.zones[0].state.agents.len(), 0);

        state.zones[0].state.material_stress = 0.8;
        state.trigger_micro_mode(0);

        assert_eq!(state.zones[0].state.agents.len(), 1);
        assert_eq!(state.zones[0].state.agents[0].archetype, crate::agent::Archetype::Opportunist);
    }

    #[test]
    fn test_material_resonance_same_slug_amplifies_effect() {
        let world = WorldConfig { world_id: 1, axiom: None, world_seed: None, origin: String::new() };
        let coeff = PressureCoefficients { entropy: 0.5, order: 0.0, innovation: 0.0, growth: 0.0 };

        let mut state_one = UniverseState::with_one_zone(1, 100.0);
        state_one.zones[0].state.active_materials.push(ActiveMaterial {
            slug: "test_material".to_string(),
            output: 0.5,
            pressure_coefficients: PressureCoefficients { entropy: 0.5, order: 0.0, innovation: 0.0, growth: 0.0 },
            recursive_core: None,
        });
        let entropy_before_one = state_one.zones[0].state.entropy;
        state_one.tick(&world);
        let delta_one = state_one.zones[0].state.entropy - entropy_before_one;

        let mut state_two = UniverseState::with_one_zone(1, 100.0);
        state_two.zones[0].state.active_materials.push(ActiveMaterial {
            slug: "test_material".to_string(),
            output: 0.5,
            pressure_coefficients: coeff,
            recursive_core: None,
        });
        state_two.zones[0].state.active_materials.push(ActiveMaterial {
            slug: "test_material".to_string(),
            output: 0.5,
            pressure_coefficients: PressureCoefficients { entropy: 0.5, order: 0.0, innovation: 0.0, growth: 0.0 },
            recursive_core: None,
        });
        let entropy_before_two = state_two.zones[0].state.entropy;
        state_two.tick(&world);
        let delta_two = state_two.zones[0].state.entropy - entropy_before_two;

        assert!(delta_two > delta_one, "two same-slug materials should produce larger entropy delta (1.5x resonance)");
        assert!(delta_two >= 1.4 * delta_one, "resonance multiplier should be ~1.5x for >=2 same slug");
    }
}
