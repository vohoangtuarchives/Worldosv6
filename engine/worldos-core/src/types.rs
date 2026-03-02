//! Core types for World, Universe, Zone, Snapshot (WorldOS V6 spec).
//! Invariant: structured_mass <= base_mass per Zone.

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
}

impl CulturalVector {
    pub fn clamp_mut(&mut self) {
        let clamp = |v: &mut f64| *v = v.clamp(0.0, 1.0);
        clamp(&mut self.tradition_rigidity);
        clamp(&mut self.innovation_openness);
        clamp(&mut self.collective_trust);
        clamp(&mut self.violence_tolerance);
        clamp(&mut self.institutional_respect);
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
    pub active_materials: Vec<ActiveMaterial>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveMaterial {
    pub slug: String,
    pub output: f64, // Normalized output level (0.0 - 1.0)
    pub pressure_coefficients: PressureCoefficients,
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
            active_materials: Vec::new(),
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
        self.material_stress = (self.entropy * 0.4 + depletion * 0.3 + fragility * 0.3).clamp(0.0, 1.0);
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
pub struct WorldSnapshot {
    pub world_id: u64,
    pub axiom: Option<serde_json::Value>,
}
