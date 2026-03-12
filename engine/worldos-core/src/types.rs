use crate::agent::Agent;
use serde::{Deserialize, Serialize};
use crate::sharding::{ShardId, ShardMap, GhostZone};

/// World: genotype, immutable rules. Not ticked.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorldConfig {
    pub world_id: u64,
    #[serde(default)]
    pub axiom: Option<serde_json::Value>,
    #[serde(default)]
    pub world_seed: Option<serde_json::Value>,
    pub origin: String,
    #[serde(default)]
    pub genome: Option<KernelGenome>,
    #[serde(default)]
    pub behavior_graph: Option<Vec<crate::behavior_graph::BehaviorNode>>,
    #[serde(default)]
    pub sharding_config: Option<ShardMap>,
}

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
    pub global_fields: CivilizationFields,
    #[serde(default)]
    pub scars: Vec<serde_json::Value>,
    #[serde(default)]
    pub attractors: Vec<CivilizationAttractor>,
    #[serde(default)]
    pub dark_attractors: Vec<DarkAttractor>,
    /// Deep Sim Phase 4: macro agents (army, ruler, trader). Laravel spawns; kernel applies pressure.
    #[serde(default)]
    pub macro_agents: Vec<MacroAgent>,
    #[serde(default)]
    pub actor_table: ActorTable,
    #[serde(default)]
    pub behavior_context: BehaviorContext,
    #[serde(default)]
    pub local_shard_id: ShardId,
    #[serde(default)]
    pub ghost_zones: Vec<GhostZone>,
    #[serde(default)]
    pub archetype_discovery: Option<DiscoveryResult>,
    #[serde(default)]
    pub narrative_tags: Vec<NarrativeTag>,
    #[serde(default)]
    pub fork_recommendation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoneStateSerial {
    pub id: u32,
    pub state: ZoneState,
    pub neighbors: Vec<u32>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ZoneId(pub u32);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KernelGenome {
    pub diffusion_rate: f64,
    pub entropy_coefficient: f64,
    pub mutation_rate: f64,
    pub attractor_gravity: f64,
    pub complexity_bonus: f64,
}

impl Default for KernelGenome {
    fn default() -> Self {
        Self {
            diffusion_rate: 0.05,
            entropy_coefficient: 1.0,
            mutation_rate: 0.05,
            attractor_gravity: 1.0,
            complexity_bonus: 1.0,
        }
    }
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NarrativeTag {
    pub slug: String,
    pub weight: f32,
}

/// Level 7 Attractor Fields: Survival, Power, Wealth, Knowledge, Meaning.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CivilizationFields {
    #[serde(default)]
    pub survival: f64,
    #[serde(default)]
    pub power: f64,
    #[serde(default)]
    pub wealth: f64,
    #[serde(default)]
    pub knowledge: f64,
    #[serde(default)]
    pub meaning: f64,
}

/// Cascade phase per zone: pressure above threshold advances Normal → Famine → Riots → Collapse.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CascadePhase {
    #[default]
    Normal,
    Famine,
    Riots,
    Collapse,
}

/// Deep Sim Phase 4: Macro agent type (rulers, armies, traders). Few per civ/zone.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MacroAgentType {
    Army,
    Ruler,
    Trader,
}

/// Macro agent: zone_id, type, strength. Laravel spawns; Rust applies pressure/effect.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroAgent {
    pub zone_id: u32,
    #[serde(rename = "type")]
    pub agent_type: MacroAgentType,
    #[serde(default)]
    pub strength: f64,
}

/// Civilization phase: Tribal → Agrarian → Kingdom → Empire → Industrial → Information (§Level-8).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CivilizationPhase {
    #[default]
    Tribal,
    Agrarian,
    Kingdom,
    Empire,
    Industrial,
    Information,
}

/// Simulation intelligence archetypes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchetypeProfile {
    pub name: String,
    pub survival: f64,
    pub power: f64,
    pub wealth: f64,
    pub knowledge: f64,
    pub meaning: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryResult {
    pub name: String,
    pub distance: f64,
    pub is_novel: bool,
}

/// Biome types for ecological simulation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Biome {
    #[default]
    Barren,
    Tundra,
    Forest,
    Steppe,
    Desert,
    Ocean,
}

/// Ecological metrics for a zone.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EcologicalFields {
    #[serde(default)]
    pub biodiversity: f64,
    #[serde(default)]
    pub biomass: f64,
    #[serde(default)]
    pub resource_stress: f64,
}

/// Civilization Attractor: zone emits field that pulls neighbor civ_fields (Rome, Athens, Venice...).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CivilizationAttractor {
    pub id: u64,
    pub zone_id: u32,
    pub power: f64,
    pub wealth: f64,
    pub knowledge: f64,
    pub meaning: f64,
    pub survival: f64,
    pub radius: f64,
    pub decay: f64,
}

/// Dark Attractor: high entropy/trauma/inequality pulls zone toward collapse.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DarkAttractor {
    pub id: u64,
    pub entropy_threshold: f64,
    pub trauma_threshold: f64,
    pub inequality_threshold: f64,
    pub pull_strength: f64,
    pub collapse_probability: f64,
}

/// Outcome of a simulated future branch (Possibility Space Navigator).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FutureOutcome {
    pub entropy: f64,
    pub knowledge: f64,
    pub sci: f64,
    pub tick: u64,
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

impl CivilizationFields {
    pub fn clamp_mut(&mut self) {
        let clamp = |v: &mut f64| *v = v.clamp(0.0, 1.0);
        clamp(&mut self.survival);
        clamp(&mut self.power);
        clamp(&mut self.wealth);
        clamp(&mut self.knowledge);
        clamp(&mut self.meaning);
    }
}

/// Zone state: material + knowledge + cultural (per WORLDOS_V6 §4).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoneState {
    #[serde(default)]
    pub base_mass: f64,
    #[serde(default)]
    pub structured_mass: f64,
    #[serde(default)]
    pub free_energy: f64,
    /// Normalized [0,1]: higher = more disorder/fragility.
    #[serde(default)]
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
    #[serde(default)]
    pub cascade_phase: CascadePhase,
    #[serde(default)]
    pub civ_fields: CivilizationFields,
    #[serde(default)]
    pub phase: CivilizationPhase,
    /// Population proxy [0,1] for population flow diffusion (Doc 21 §4.1). Pressure = pop / resources proxy.
    #[serde(default)]
    pub population_proxy: f64,
    /// Resource capacity [0,1] from geography/agriculture (Deep Sim Phase 1). When > 0, used for population pressure; else fallback to f(base_mass, material_stress).
    #[serde(default)]
    pub resource_capacity: f64,
    /// Wealth/resource proxy [0,1] for trade flow between zones (Deep Sim Phase C). Flow: k_trade * (wealth_i - wealth_j); when 0, initialized from resource_capacity or (base_mass, material_stress).
    #[serde(default)]
    pub wealth_proxy: f64,
    #[serde(default)]
    pub biome: Biome,
    #[serde(default)]
    pub eco_fields: EcologicalFields,
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

// ==========================================
// CORE-SIMULATION DIVERGENCE LAYER MODELS
// ==========================================

/// Macro Layer: Civilization Emotion Field
/// Fields diffuse across zones influencing crowd and actor behaviors.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EmotionField {
    #[serde(default)]
    pub fear: f32,
    #[serde(default)]
    pub anger: f32,
    #[serde(default)]
    pub hope: f32,
    #[serde(default)]
    pub trust: f32,
}

/// Meso Layer: Crowd Dynamics
/// Generated dynamically by clustering actors with similar locations and emotions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Crowd {
    pub id: u64,
    pub zone_id: u32,
    pub size: u32,
    pub emotion: EmotionField,
    pub dominant_meme: u64, // Extracted bitmask of dominant meme
}

/// Micro Layer: Behavior Graph Node
/// Represents a state in the actor's decision graph.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorNode {
    pub id: u32,
    pub action_id: u32,
    // (Optional) Expressions or conditions evaluated by the Rule VM
    // pub conditions: Vec<Condition>, 
    // pub transitions: Vec<u32>,
}

/// Actor Storage: Struct of Arrays (SoA) Layout for maximum performance
/// Scales to 1,000,000 actors.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ActorTable {
    pub ids: Vec<u64>,
    pub hunger: Vec<f32>,
    pub energy: Vec<f32>,
    pub fear: Vec<f32>,
    pub traits_mask: Vec<u64>,     // Bitmask for personality traits
    pub memes_mask: Vec<u64>,      // Bitmask for cultural memes
    pub zone_ids: Vec<u32>,        // Zone ID mapping
    pub current_node: Vec<u16>,    // Current node ID in the Behavior Graph
}

impl ActorTable {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub fn push(&mut self, id: u64, zone: u32) {
        self.ids.push(id);
        self.hunger.push(0.0);
        self.energy.push(1.0);
        self.fear.push(0.0);
        self.traits_mask.push(0);
        self.memes_mask.push(0);
        self.zone_ids.push(zone);
        self.current_node.push(0); // 0 = Idle node
    }
}

/// Simulation Global State for Behaviors
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BehaviorContext {
    pub emotion_fields: Vec<EmotionField>, // Indexed by zone_id
    #[serde(default)]
    pub crowd_rules: Vec<CrowdRule>,
    #[serde(default)]
    pub social_rules: Vec<SocialRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrowdRule {
    pub min_anger: f32,
    pub min_fear: f32,
    pub min_size: u32,
    pub influence: CrowdInfluence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CrowdInfluence {
    SetNode(u16),
    AddFear(f32),
    AddAnger(f32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialRule {
    pub condition: SocialCondition,
    pub action: SocialAction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SocialCondition {
    FearGt(f32),
    TrustLt(f32),
    AngerGt(f32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SocialAction {
    SetTraitMask(u64),
    SetNode(u16),
}

// ==========================================

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
            cascade_phase: CascadePhase::Normal,
            civ_fields: CivilizationFields::default(),
            phase: CivilizationPhase::Tribal,
            population_proxy: 0.0,
            resource_capacity: 0.0,
            wealth_proxy: 0.0,
            biome: Biome::Barren,
            eco_fields: EcologicalFields::default(),
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
    pub civ_fields: CivilizationFields,
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
