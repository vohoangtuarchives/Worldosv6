use crate::agent::Agent;
use serde::{Deserialize, Serialize};

/// World: genotype, immutable rules. Not ticked.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldConfig {
    pub world_id: u64,
    #[serde(default)]
    pub axiom: Option<serde_json::Value>,
    #[serde(default)]
    pub world_seed: Option<serde_json::Value>,
    pub origin: String,
}

/// Cultural vector C_z: ~5–8 dimensions in [0,1].
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CulturalVector {
    #[serde(default)]
    pub tradition_rigidity: f64,
    #[serde(default)]
    pub innovation_openness: f64,
    #[serde(default)]
    pub collective_trust: f64,
    #[serde(default)]
    pub violence_tolerance: f64,
    #[serde(default)]
    pub institutional_respect: f64,
    #[serde(default)]
    pub myth_belief: f64,
}

impl CulturalVector {
    pub fn clamp_mut(&mut self) {
        let clamp = |v: &mut f64| *v = v.clamp(0.0, 1.0);
        clamp(&mut self.tradition_rigidity);
        clamp(&mut self.innovation_openness);
        clamp(&mut self.collective_trust);
        clamp(&mut self.violence_tolerance);
        clamp(&mut self.institutional_respect);
        clamp(&mut self.myth_belief);
    }
}

/// Zone state: material + knowledge + cultural (per WORLDOS_V6 §4).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoneState {
    pub base_mass: f64,
    pub structured_mass: f64,
    pub free_energy: f64,
    /// Normalized [0,1]: higher = more disorder/fragility.
    pub entropy: f64,
    #[serde(default)]
    pub cultural: CulturalVector,
    /// MaterialStress ∝ entropy + depletion + structured fragility (§4.1).
    #[serde(default)]
    pub material_stress: f64,
    #[serde(default)]
    pub embodied_knowledge: f64,
    #[serde(default)]
    pub inequality: f64,
    #[serde(default)]
    pub trauma: f64,
    #[serde(default)]
    pub tech_ceiling: f64,
    #[serde(default)]
    pub knowledge_frontier: f64,
    #[serde(default)]
    pub active_materials: Vec<ActiveMaterial>,
    #[serde(default)]
    pub agents: Vec<Agent>,
    #[serde(default)]
    pub regional_scars: f64, // Normalized scar pressure (0.0 - 1.0)
    #[serde(default)]
    pub quantum_overlay: Option<QuantumOverlay>,
}

/// Quantum Overlay: Controls probabilistic state and observer effect (§57).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumOverlay {
    pub superposition_depth: f64, // 0.0 (Collapsed) to 1.0 (Deep Superposition)
    pub observer_presence: f64,    // 0.0 to 1.0
    pub probability_decay: f64,    // Speed of collapse
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveMaterial {
    pub slug: String,
    pub output: f64, // Normalized output level (0.0 - 1.0)
    pub pressure_coefficients: PressureCoefficients,
    #[serde(default)]
    pub recursive_core: Option<RecursiveCore>,
}

/// Recursive Core: Metadata for a nested simulation running inside a material (§59).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecursiveCore {
    pub layer: u32,             // 1 for first nested level
    pub virtual_entropy: f64,   // Entropy inside the sim
    pub virtual_knowledge: f64, // Knowledge generated inside
    pub feedback_loop: f64,     // How much it affects the parent zone
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PressureCoefficients {
    #[serde(default)]
    pub entropy: f64,
    #[serde(default)]
    pub order: f64,
    #[serde(default)]
    pub innovation: f64,
    #[serde(default)]
    pub growth: f64,
}

impl ZoneState {
    pub fn new(base_mass: f64) -> Self {
        Self {
            base_mass,
            structured_mass: 0.0,
            free_energy: base_mass * 0.1,
            entropy: 0.0,
            cultural: CulturalVector::default(),
            material_stress: 0.0,
            embodied_knowledge: 0.0,
            inequality: 0.0,
            trauma: 0.0,
            tech_ceiling: 1.0,
            knowledge_frontier: 0.0,
            active_materials: Vec::new(),
            agents: Vec::new(),
            regional_scars: 0.0,
            quantum_overlay: None,
        }
    }

    /// Invariant: structured_mass <= base_mass.
    pub fn enforce_invariant(&mut self) {
        if self.structured_mass > self.base_mass {
            self.structured_mass = self.base_mass;
        }
        self.entropy = self.entropy.clamp(0.0, 1.0);
    }

    /// MaterialStress ~ entropy + (1 - structured/base) + fragility (§4.1).
    pub fn update_material_stress(&mut self) {
        let depletion = if self.base_mass > 0.0 {
            1.0 - (self.structured_mass / self.base_mass)
        } else {
            0.0
        };
        let fragility = self.entropy * (self.structured_mass / (self.base_mass + 1e-6));
        // MaterialStress = f(entropy, depletion, fragility) + scar pressure (§4.1)
        self.material_stress = (self.entropy * 0.3 + depletion * 0.2 + fragility * 0.2 + self.regional_scars * 0.3).clamp(0.0, 1.0);
    }
}

/// Universe snapshot for output (stored by Laravel).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniverseSnapshot {
    pub universe_id: u64,
    pub tick: u64,
    pub state_vector: serde_json::Value,
    pub entropy: Option<f64>,
    pub stability_index: Option<f64>,
    pub metrics: Option<serde_json::Value>,
}

impl UniverseSnapshot {
    pub fn empty(universe_id: u64, tick: u64) -> Self {
        Self {
            universe_id,
            tick,
            state_vector: serde_json::json!({}),
            entropy: None,
            stability_index: None,
            metrics: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationMetrics {
    pub order: f64,
    pub energy: f64,
    pub ip_score: f64,
    pub knowledge_core: f64,
    pub tech_ceiling_avg: f64,
    pub knowledge_frontier_avg: f64,
    pub instability_gradient: f64,
    pub zone_count: u32,
    pub scars: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldSnapshot {
    pub world_id: u64,
    pub axiom: Option<serde_json::Value>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_material_stress_logic() {
        let mut z = ZoneState::new(100.0);
        z.structured_mass = 50.0;
        z.entropy = 0.5;
        z.update_material_stress();
        
        // new formula weights: entropy(0.3), depletion(0.2), fragility(0.2), regional_scars(0.3)
        // 0.5*0.3 (entropy) + 0.5*0.2 (depletion) + 0.25*0.2 (fragility) + 0.0*0.3 (scars)
        // = 0.15 + 0.1 + 0.05 + 0.0 = 0.3
        assert!((z.material_stress - 0.3).abs() < 1e-6);
    }
}
