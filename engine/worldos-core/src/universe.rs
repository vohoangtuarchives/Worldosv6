//! Universe state: zones (SlotMap), global_entropy, knowledge_core.
//! 3-phase tick: (1) zone local update, (2) aggregate, (3) diffusion.

use std::collections::HashMap;

use crate::constants;
use crate::types::*;



/// Doc 21 §4: Phase-dependent diffusion multiplier (collapse spreads faster).
fn phase_diffusion_factor(phase: CascadePhase) -> f64 {
    use crate::constants;
    match phase {
        CascadePhase::Normal => constants::PHASE_DIFFUSION_NORMAL,
        CascadePhase::Famine => constants::PHASE_DIFFUSION_FAMINE,
        CascadePhase::Riots => constants::PHASE_DIFFUSION_RIOTS,
        CascadePhase::Collapse => constants::PHASE_DIFFUSION_COLLAPSE,
    }
}

impl UniverseState {
    /// Update a ghost zone's state from an external snapshot
    pub fn apply_ghost_update(&mut self, snapshot: ZoneStateSerial) {
        if let Some(ghost) = self.ghost_zones.iter_mut().find(|gz| gz.id == snapshot.id) {
            ghost.state_snapshot = snapshot;
        }
    }

    pub fn build_macro_index(&self) -> crate::memory::ZoneActorIndex {
        let num_zones = self.zones.len();
        let mut id_to_idx = HashMap::with_capacity(num_zones);
        for (idx, z) in self.zones.iter().enumerate() {
            id_to_idx.insert(z.id, idx);
        }
        let mut index = crate::memory::ZoneActorIndex::new(num_zones);
        for (ma_idx, ma) in self.macro_agents.iter().enumerate() {
            if let Some(&z_idx) = id_to_idx.get(&ma.zone_id) {
                index.add_actor_to_zone(z_idx, ma_idx as u64);
            }
        }
        index
    }


    fn refresh_aggregates(&mut self) {
        let n = self.zones.len() as f64;
        if n <= 0.0 {
            return;
        }

        self.global_entropy = self.zones.iter().map(|z| z.state.entropy).sum::<f64>() / n;
        self.knowledge_core = self.zones.iter().map(|z| z.state.embodied_knowledge).sum::<f64>() / n;
        
        let avg_stress: f64 = self.zones.iter().map(|z| z.state.material_stress).sum::<f64>() / n;
        self.sci = (1.0 - (avg_stress * 0.4 + self.global_entropy * 0.2)).clamp(0.0, 1.0);
        self.instability_gradient = (avg_stress - 0.5).max(0.0) * 2.0;

        self.global_fields.survival = self.zones.iter().map(|z| z.state.civ_fields.survival).sum::<f64>() / n;
        self.global_fields.reproduction = self.zones.iter().map(|z| z.state.civ_fields.reproduction).sum::<f64>() / n;
        self.global_fields.wealth = self.zones.iter().map(|z| z.state.civ_fields.wealth).sum::<f64>() / n;
        self.global_fields.power = self.zones.iter().map(|z| z.state.civ_fields.power).sum::<f64>() / n;
        self.global_fields.knowledge = self.zones.iter().map(|z| z.state.civ_fields.knowledge).sum::<f64>() / n;
        self.global_fields.meaning = self.zones.iter().map(|z| z.state.civ_fields.meaning).sum::<f64>() / n;
        self.global_fields.status = self.zones.iter().map(|z| z.state.civ_fields.status).sum::<f64>() / n;
        self.global_fields.belonging = self.zones.iter().map(|z| z.state.civ_fields.belonging).sum::<f64>() / n;
    }
    pub fn new(universe_id: u64) -> Self {
        Self {
            universe_id,
            tick: 0,
            zones: Vec::new(),
            global_entropy: 0.0,
            knowledge_core: 0.0,
            instability_gradient: 0.0,
            sci: 1.0,
            global_fields: CivilizationFields::default(),
            scars: Vec::new(),
            attractors: Vec::new(),
            dark_attractors: Vec::new(),
            macro_agents: Vec::new(),
            actor_table: crate::types::ActorTable::default(),
            behavior_context: crate::types::BehaviorContext::default(),
            local_shard_id: 0,
            ghost_zones: Vec::new(),
            archetype_discovery: None,
            narrative_tags: Vec::new(),
            fork_recommendation: false,
            axioms: HashMap::new(),
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
            global_fields: CivilizationFields::default(),
            scars: Vec::new(),
            attractors: Vec::new(),
            dark_attractors: Vec::new(),
            macro_agents: Vec::new(),
            actor_table: crate::types::ActorTable::default(),
            behavior_context: crate::types::BehaviorContext::default(),
            local_shard_id: 0,
            ghost_zones: Vec::new(),
            archetype_discovery: None,
            narrative_tags: Vec::new(),
            fork_recommendation: false,
            axioms: HashMap::new(),
        }
    }


    /// Run one 3-phase tick (simplified: no SlotMap in this struct; we use vec for serialization).
    pub fn tick(&mut self, world: &crate::types::WorldConfig, macro_idx: Option<&crate::memory::ZoneActorIndex>) {
        // Ensure behavior_context has enough zones
        if self.behavior_context.emotion_fields.len() < self.zones.len() {
            self.behavior_context.emotion_fields.resize(self.zones.len(), crate::types::EmotionField::default());
        }

        // 0. LAYERED BEHAVIOR PIPELINE (Phase 3 Architecture)
        
        // A. Macro Layer: Update Emotion Fields (Diffusion/Decay)
        let emotion_engine = crate::emotion_field::EmotionFieldEngine::new(0.01);
        emotion_engine.update(&mut self.behavior_context, &self.actor_table);

        // B. Social/Cognitive Layer: Update Beliefs and Power structures
        let belief_engine = crate::social_layers::BeliefSystemEngine::new(0.05);
        belief_engine.update(&mut self.actor_table, &mut self.behavior_context);

        let power_engine = crate::social_layers::PowerStructureEngine::new(0.1);
        power_engine.apply_coercion(&mut self.actor_table, &self.behavior_context);

        let culture_engine = crate::culture_engine::CultureEngine::new(0.02);
        culture_engine.update(&mut self.actor_table, &self.behavior_context, &self.zones);

        // C. Meso Layer: Cluster Crowds and Apply Crowd Dynamics
        let mut mass_engine = crate::mass_behavior::MassBehaviorEngine::new();
        mass_engine.detect_crowds(&self.actor_table, &self.behavior_context);
        mass_engine.apply_dynamics(&mut self.actor_table, &self.behavior_context);

        // D. Micro Layer: Evaluate Behavior Graph (Data-Driven)
        let nodes = world.behavior_graph.clone().unwrap_or_default();
        let mut micro_engine = crate::behavior_graph::BehaviorGraphEngine::new(nodes); 
        micro_engine.evaluate(&mut self.actor_table, &self.behavior_context);

        let genome = world.genome.clone().unwrap_or_default();
        // Phase 1: local zone update (entropy, organization, decay, ecology)
        let k1 = genome.entropy_coefficient * constants::K1_ENTROPY_PER_STRUCTURED;
        let eco_engine = crate::ecological_engine::EcologicalEngine::new(0.85);

        for (idx, z) in self.zones.iter_mut().enumerate() {
            // Ecological Update (§Phase 2)
            if let Some(event_desc) = eco_engine.update(&mut z.state) {
                 self.scars.push(serde_json::json!({
                    "type": "ecological_event",
                    "description": event_desc,
                    "zone_id": z.id,
                    "tick": self.tick
                }));
            }

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

            // Drift nhẹ mỗi tick; có drift thì entropy không thể là 0 — sàn bằng đúng lượng drift
            z.state.entropy = (z.state.entropy + constants::ENTROPY_DRIFT_PER_TICK).min(1.0);
            z.state.entropy = z.state.entropy.max(constants::ENTROPY_DRIFT_PER_TICK);

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

            // Level 7: Civilization Field Genesis (M1 Migration)
            // Ported to MacroFieldEngine (Macro scale). 
            // Individual zone fields are still updated here if needed for local effects.
            let s = &mut z.state;
            let structured_ratio = s.structured_mass / (s.base_mass + 1e-6);
            
            s.civ_fields.survival = (structured_ratio * 0.4 + (1.0 - s.entropy) * 0.6).clamp(0.0, 1.0);
            s.civ_fields.power = (structured_ratio * 0.7 + s.embodied_knowledge * 0.3).clamp(0.0, 1.0);
            s.civ_fields.wealth = (structured_ratio * 0.8 + s.free_energy / (s.base_mass * 2.0 + 1e-6)).clamp(0.0, 1.0);
            s.civ_fields.knowledge = (s.embodied_knowledge * 0.7 + s.knowledge_frontier * 0.3).clamp(0.0, 1.0);
            s.civ_fields.meaning = (s.cultural.myth_belief * 0.6 + (1.0 - s.material_stress) * 0.2 + s.entropy * 0.2).clamp(0.0, 1.0);
            s.civ_fields.clamp_mut();

            // Deep Sim Phase 3: Cultural drift (deterministic) — prevents diffusion from making all zones identical.
            let seed = world.world_id.wrapping_add(self.tick).wrapping_mul(31).wrapping_add(z.id as u64).wrapping_add(idx as u64);
            let h1 = (seed % 10_000) as f64 / 10_000.0;
            let h2 = (seed.wrapping_mul(17).wrapping_add(1) % 10_000) as f64 / 10_000.0;
            let drift1 = (h1 - 0.5) * 2.0 * constants::CULTURAL_DRIFT_MAGNITUDE;
            let drift2 = (h2 - 0.5) * 2.0 * constants::CULTURAL_DRIFT_MAGNITUDE;
            z.state.cultural.innovation_openness = (z.state.cultural.innovation_openness + drift1).clamp(0.0, 1.0);
            z.state.cultural.myth_belief = (z.state.cultural.myth_belief + drift2).clamp(0.0, 1.0);

            // Deep Sim Phase 3: Tech discovery proxy (deterministic, low probability).
            let discovery_roll = seed.wrapping_mul(13) % constants::TECH_DISCOVERY_MOD;
            let ok_stress = z.state.material_stress < 0.75;
            let ok_pop = z.state.population_proxy > 0.1;
            if discovery_roll == 0 && ok_stress && ok_pop {
                z.state.knowledge_frontier = (z.state.knowledge_frontier + constants::TECH_DISCOVERY_DELTA).min(z.state.tech_ceiling);
            }
        }

        // Deep Sim Phase 4: Ruler agents reduce entropy (order) in their zone.
        if let Some(idx) = macro_idx {
            for (i, z) in self.zones.iter_mut().enumerate() {
                for &ma_id in idx.actors_in_zone(i) {
                    let ma = &self.macro_agents[ma_id as usize];
                    if ma.agent_type == MacroAgentType::Ruler {
                        z.state.entropy = (z.state.entropy - 0.01 * ma.strength.clamp(0.0, 1.0)).max(0.0);
                    }
                }
            }
        } else {
            for z in &mut self.zones {
                for ma in &self.macro_agents {
                    if ma.zone_id == z.id && ma.agent_type == MacroAgentType::Ruler {
                        z.state.entropy = (z.state.entropy - 0.01 * ma.strength.clamp(0.0, 1.0)).max(0.0);
                    }
                }
            }
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
            // Tuning (§V23): Reduced decay weights from 0.7/0.3 to 0.4/0.2 to prevent premature collapse at tick 96.
            let avg_stress: f64 = self.zones.iter().map(|z| z.state.material_stress).sum::<f64>() / n;
            self.sci = (1.0 - (avg_stress * 0.4 + self.global_entropy * 0.2)).clamp(0.0, 1.0);
            
            
            // Toggle Micro Mode if gradient is high
            self.instability_gradient = (avg_stress - 0.5).max(0.0) * 2.0; 

            // Macro Field Evolution (Phase 4 Purification)
            let macro_engine = crate::macro_fields::MacroFieldEngine::new();
            macro_engine.update(self);

            // Zone Potential Fields (Phase 4 Purification)
            let potential_engine = crate::potential_fields::PotentialFieldEngine::new();
            potential_engine.update(self);
        }

        // Level-8: Archetype Discovery — recognize civilization patterns
        self.run_archetype_discovery();

        // Level-8: Narrative Synthesis
        let culture_engine = crate::culture_engine::CultureEngine::new(0.01);
        self.narrative_tags = culture_engine.generate_narrative_tags(&self.zones);
        // Level-8: Attractor Field Engine — zones pulled by civilization attractors
        self.apply_attractor_fields();
        // Level-8: Dark Attractor — high entropy/trauma/inequality pulls toward collapse
        self.apply_dark_attractors();
        // Level-8: Intelligence Explosion — knowledge/energy/openness boost
        self.apply_intelligence_explosion();
        // Level-8: Phase Transition — Tribal → Agrarian → ... → Information
        for z in &mut self.zones {
            Self::check_phase_transition(&mut z.state);
        }

        // Phase 3: Diffusion (Entropy, Tech, Culture, Population) (§3, §4.4). Doc 21: phase-dependent diffusion + population flow.
        let beta = genome.diffusion_rate;
        let mut entropy_deltas = vec![0.0; self.zones.len()];
        let mut tech_deltas = vec![0.0; self.zones.len()];
        let mut culture_deltas = vec![CulturalVector::default(); self.zones.len()];
        let mut civ_field_deltas = vec![CivilizationFields::default(); self.zones.len()];
        let mut population_deltas = vec![0.0; self.zones.len()];
        let mut trade_deltas = vec![0.0; self.zones.len()];

        // Effective wealth per zone for trade flow (Deep Sim Phase C): wealth_proxy if set, else from resource_capacity or (base_mass, material_stress).
        let effective_wealth: Vec<f64> = self.zones.iter()
            .map(|z| {
                let base = if z.state.resource_capacity > 1e-9 {
                    (z.state.resource_capacity * 1.5 + 0.5).min(1.0)
                } else {
                    ((z.state.base_mass * 0.01 + 1.0) * (1.0 - z.state.material_stress * 0.5) + z.state.free_energy * 0.001).min(1.0)
                };
                if z.state.wealth_proxy > 1e-9 {
                    z.state.wealth_proxy
                } else {
                    base
                }
            })
            .collect();

        // Population pressure per zone: pop / (resources proxy + eps). Doc 21 §4.1. Deep Sim Phase 1: use resource_capacity when set (geography), else fallback.
        let population_pressures: Vec<f64> = self.zones.iter()
            .map(|z| {
                let resources = if z.state.resource_capacity > 1e-9 {
                    (z.state.resource_capacity * 1.5 + 0.5).max(0.1)
                } else {
                    (z.state.base_mass * 0.01 + 1.0) * (1.0 - z.state.material_stress * 0.5) + z.state.free_energy * 0.001
                };
                (z.state.population_proxy + 1e-6) / (resources + 1e-6)
            })
            .collect();

        let zone_map: HashMap<u32, usize> = self.zones.iter().enumerate().map(|(idx, z)| (z.id, idx)).collect();
        let ghost_map: HashMap<u32, usize> = self.ghost_zones.iter().enumerate().map(|(idx, gz)| (gz.id, idx)).collect();

        for i in 0..self.zones.len() {
            let zone = &self.zones[i];
            let n_len = zone.neighbors.len() as f64;
            if n_len < 1e-9 { continue; }
            
            let phase_factor = phase_diffusion_factor(zone.state.cascade_phase);

            let mut s_diff_sum = 0.0;
            let mut t_diff_sum = 0.0;
            let mut c_diff_sum = CulturalVector::default();
            let mut civ_diff_sum = CivilizationFields::default();

            for &id in &zone.neighbors {
                if let Some(&j) = zone_map.get(&id) {
                    let neighbor = &self.zones[j];
                    s_diff_sum += neighbor.state.entropy - zone.state.entropy;
                    t_diff_sum += neighbor.state.knowledge_frontier - zone.state.knowledge_frontier;
                    
                    c_diff_sum.tradition_rigidity += neighbor.state.cultural.tradition_rigidity - zone.state.cultural.tradition_rigidity;
                    c_diff_sum.innovation_openness += neighbor.state.cultural.innovation_openness - zone.state.cultural.innovation_openness;
                    c_diff_sum.collective_trust += neighbor.state.cultural.collective_trust - zone.state.cultural.collective_trust;
                    c_diff_sum.violence_tolerance += neighbor.state.cultural.violence_tolerance - zone.state.cultural.violence_tolerance;
                    c_diff_sum.institutional_respect += neighbor.state.cultural.institutional_respect - zone.state.cultural.institutional_respect;
                    c_diff_sum.myth_belief += neighbor.state.cultural.myth_belief - zone.state.cultural.myth_belief;

                    civ_diff_sum.survival += neighbor.state.civ_fields.survival - zone.state.civ_fields.survival;
                    civ_diff_sum.reproduction += neighbor.state.civ_fields.reproduction - zone.state.civ_fields.reproduction;
                    civ_diff_sum.wealth += neighbor.state.civ_fields.wealth - zone.state.civ_fields.wealth;
                    civ_diff_sum.power += neighbor.state.civ_fields.power - zone.state.civ_fields.power;
                    civ_diff_sum.knowledge += neighbor.state.civ_fields.knowledge - zone.state.civ_fields.knowledge;
                    civ_diff_sum.meaning += neighbor.state.civ_fields.meaning - zone.state.civ_fields.meaning;
                    civ_diff_sum.status += neighbor.state.civ_fields.status - zone.state.civ_fields.status;
                    civ_diff_sum.belonging += neighbor.state.civ_fields.belonging - zone.state.civ_fields.belonging;
                } else if let Some(&k) = ghost_map.get(&id) {
                    let ghost = &self.ghost_zones[k].state_snapshot.state;
                    s_diff_sum += ghost.entropy - zone.state.entropy;
                    t_diff_sum += ghost.knowledge_frontier - zone.state.knowledge_frontier;
                    
                    c_diff_sum.tradition_rigidity += ghost.cultural.tradition_rigidity - zone.state.cultural.tradition_rigidity;
                    c_diff_sum.innovation_openness += ghost.cultural.innovation_openness - zone.state.cultural.innovation_openness;
                    c_diff_sum.collective_trust += ghost.cultural.collective_trust - zone.state.cultural.collective_trust;
                    c_diff_sum.violence_tolerance += ghost.cultural.violence_tolerance - zone.state.cultural.violence_tolerance;
                    c_diff_sum.institutional_respect += ghost.cultural.institutional_respect - zone.state.cultural.institutional_respect;
                    c_diff_sum.myth_belief += ghost.cultural.myth_belief - zone.state.cultural.myth_belief;

                    civ_diff_sum.survival += ghost.civ_fields.survival - zone.state.civ_fields.survival;
                    civ_diff_sum.reproduction += ghost.civ_fields.reproduction - zone.state.civ_fields.reproduction;
                    civ_diff_sum.wealth += ghost.civ_fields.wealth - zone.state.civ_fields.wealth;
                    civ_diff_sum.power += ghost.civ_fields.power - zone.state.civ_fields.power;
                    civ_diff_sum.knowledge += ghost.civ_fields.knowledge - zone.state.civ_fields.knowledge;
                    civ_diff_sum.meaning += ghost.civ_fields.meaning - zone.state.civ_fields.meaning;
                    civ_diff_sum.status += ghost.civ_fields.status - zone.state.civ_fields.status;
                    civ_diff_sum.belonging += ghost.civ_fields.belonging - zone.state.civ_fields.belonging;
                }
            }

            let beta_zone = beta * phase_factor;
            entropy_deltas[i] = beta_zone * s_diff_sum / n_len;
            tech_deltas[i] = beta_zone * 0.5 * t_diff_sum / n_len;
            
            culture_deltas[i].tradition_rigidity = beta_zone * c_diff_sum.tradition_rigidity / n_len;
            culture_deltas[i].innovation_openness = beta_zone * c_diff_sum.innovation_openness / n_len;
            culture_deltas[i].collective_trust = beta_zone * c_diff_sum.collective_trust / n_len;
            culture_deltas[i].violence_tolerance = beta_zone * c_diff_sum.violence_tolerance / n_len;
            culture_deltas[i].institutional_respect = beta_zone * c_diff_sum.institutional_respect / n_len;
            culture_deltas[i].myth_belief = beta_zone * c_diff_sum.myth_belief / n_len;

            civ_field_deltas[i].survival = beta_zone * civ_diff_sum.survival / n_len;
            civ_field_deltas[i].reproduction = beta_zone * civ_diff_sum.reproduction / n_len;
            civ_field_deltas[i].wealth = beta_zone * civ_diff_sum.wealth / n_len;
            civ_field_deltas[i].power = beta_zone * civ_diff_sum.power / n_len;
            civ_field_deltas[i].knowledge = beta_zone * civ_diff_sum.knowledge / n_len;
            civ_field_deltas[i].meaning = beta_zone * civ_diff_sum.meaning / n_len;
            civ_field_deltas[i].status = beta_zone * civ_diff_sum.status / n_len;
            civ_field_deltas[i].belonging = beta_zone * civ_diff_sum.belonging / n_len;

            // Flow deltas (Population & Trade) require local update for both sides if local,
            // or just local side if neighbor is ghost.
            let pi = population_pressures[i];
            let wi = effective_wealth[i];

            for &id in &zone.neighbors {
                let (pj, wj) = if let Some(&j) = zone_map.get(&id) {
                    (population_pressures[j], effective_wealth[j])
                } else if let Some(&k) = ghost_map.get(&id) {
                    let ghost = &self.ghost_zones[k].state_snapshot.state;
                    // Recompute pressure for ghost (simplified or use stored)
                    let resources = if ghost.resource_capacity > 1e-9 {
                        (ghost.resource_capacity * 1.5 + 0.5).max(0.1)
                    } else {
                        (ghost.base_mass * 0.01 + 1.0) * (1.0 - ghost.material_stress * 0.5) + ghost.free_energy * 0.001
                    };
                    let g_pj = (ghost.population_proxy + 1e-6) / (resources + 1e-6);
                    let g_wj = if ghost.wealth_proxy > 1e-9 { ghost.wealth_proxy } else { 0.5 }; // Default wealth for ghost if unset
                    (g_pj, g_wj)
                } else {
                    continue;
                };

                // Population flow
                if pi > pj {
                    let flow = (constants::POPULATION_FLOW_COEFFICIENT * (pi - pj) / n_len)
                        .min(constants::MAX_POPULATION_FLOW_PER_TICK);
                    population_deltas[i] -= flow;
                    // If local, apply symmetry
                    if let Some(&j) = zone_map.get(&id) {
                        population_deltas[j] += flow;
                    }
                }

                // Trade flow (avoid double counting by only processing if i < id)
                if (zone.id as u64) < (id as u64) {
                    let flow = (constants::TRADE_FLOW_COEFFICIENT * (wi - wj) / n_len)
                        .max(-constants::MAX_TRADE_FLOW_PER_TICK)
                        .min(constants::MAX_TRADE_FLOW_PER_TICK);
                    trade_deltas[i] -= flow;
                    if let Some(&j) = zone_map.get(&id) {
                        trade_deltas[j] += flow;
                    }
                }
            }
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

            // Apply decay (Preservation rate 0.4) before deltas (§Level-9)
            z.state.civ_fields.survival *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.reproduction *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.wealth *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.power *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.knowledge *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.meaning *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.status *= constants::FIELD_PRESERVATION_RATE;
            z.state.civ_fields.belonging *= constants::FIELD_PRESERVATION_RATE;

            z.state.civ_fields.survival = (z.state.civ_fields.survival + civ_field_deltas[i].survival).clamp(0.0, 1.0);
            z.state.civ_fields.reproduction = (z.state.civ_fields.reproduction + civ_field_deltas[i].reproduction).clamp(0.0, 1.0);
            z.state.civ_fields.wealth = (z.state.civ_fields.wealth + civ_field_deltas[i].wealth).clamp(0.0, 1.0);
            z.state.civ_fields.power = (z.state.civ_fields.power + civ_field_deltas[i].power).clamp(0.0, 1.0);
            z.state.civ_fields.knowledge = (z.state.civ_fields.knowledge + civ_field_deltas[i].knowledge).clamp(0.0, 1.0);
            z.state.civ_fields.meaning = (z.state.civ_fields.meaning + civ_field_deltas[i].meaning).clamp(0.0, 1.0);
            z.state.civ_fields.status = (z.state.civ_fields.status + civ_field_deltas[i].status).clamp(0.0, 1.0);
            z.state.civ_fields.belonging = (z.state.civ_fields.belonging + civ_field_deltas[i].belonging).clamp(0.0, 1.0);

            z.state.population_proxy = (z.state.population_proxy + population_deltas[i]).clamp(0.0, 1.0);
            if z.state.wealth_proxy < 1e-9 {
                z.state.wealth_proxy = effective_wealth[i];
            }
            z.state.wealth_proxy = (z.state.wealth_proxy + trade_deltas[i]).clamp(0.0, 1.0);
        }

        // V7: Quantum Overlay — decay superposition per tick
        self.tick_quantum_overlays();

        // Phase 4: Vocation & Motivation Drift (§Phase 4 Synthesis)
        self.tick_vocation_drift();

        self.refresh_aggregates();
        self.tick += 1;
    }












    pub fn to_snapshot(&self) -> UniverseSnapshot {
        let state_vector = serde_json::to_value(self).unwrap_or(serde_json::json!({}));
        let metrics = self.calculate_metrics();
        // Có drift (đã chạy ít nhất 1 tick) thì entropy không thể là 0 — sàn khi trả snapshot
        let entropy_val = if self.tick > 0 {
            self.global_entropy.max(constants::ENTROPY_DRIFT_PER_TICK)
        } else {
            self.global_entropy
        };
        UniverseSnapshot {
            universe_id: self.universe_id,
            tick: self.tick,
            state_vector,
            entropy: Some(entropy_val),
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
            civ_fields: self.global_fields.clone(),
            scars: self.scars.clone(),
        }
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{ActiveMaterial, PressureCoefficients, WorldConfig};


    #[test]
    fn test_material_resonance_same_slug_amplifies_effect() {
        let world = WorldConfig { world_id: 1, ..Default::default() };
        let coeff = PressureCoefficients { entropy: 0.5, order: 0.0, innovation: 0.0, growth: 0.0 };

        let mut state_one = UniverseState::with_one_zone(1, 100.0);
        state_one.zones[0].state.active_materials.push(ActiveMaterial {
            slug: "test_material".to_string(),
            output: 0.5,
            pressure_coefficients: PressureCoefficients { entropy: 0.5, order: 0.0, innovation: 0.0, growth: 0.0 },
            recursive_core: None,
        });
        let entropy_before_one = state_one.zones[0].state.entropy;
        state_one.tick(&world, None);
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
        state_two.tick(&world, None);
        let delta_two = state_two.zones[0].state.entropy - entropy_before_two;

        assert!(delta_two > delta_one, "two same-slug materials should produce larger entropy delta (1.5x resonance)");
        assert!(delta_two >= 1.4 * delta_one, "resonance multiplier should be ~1.5x for >=2 same slug");
    }

    #[test]
    fn test_tick_determinism() {
        let world = WorldConfig { world_id: 1, ..Default::default() };
        let mut state_a = UniverseState::with_one_zone(1, 100.0);
        state_a.zones[0].state.entropy = 0.5;
        state_a.zones[0].state.knowledge_frontier = 10.0;
        
        let mut state_b = state_a.clone();
        
        state_a.tick(&world, None);
        state_b.tick(&world, None);
        
        // Assert identical outcomes
        assert_eq!(state_a.global_entropy, state_b.global_entropy, "Tick must be deterministic for entropy");
        assert_eq!(state_a.sci, state_b.sci, "Tick must be deterministic for SCI");
        assert_eq!(state_a.zones[0].state.embodied_knowledge, state_b.zones[0].state.embodied_knowledge);
    }

    #[test]
    fn test_boundedness_invariants() {
        let world = WorldConfig { world_id: 1, ..Default::default() };
        let mut state = UniverseState::with_one_zone(1, 100.0);
        
        // Inject extreme out-of-bounds values
        state.zones[0].state.entropy = 100.0; // very high
        state.zones[0].state.material_stress = -50.0; // very low
        state.zones[0].state.knowledge_frontier = 5000.0;
        state.zones[0].state.tech_ceiling = 10.0; // frontier > ceiling
        
        state.tick(&world, None);
        
        let z = &state.zones[0].state;
        assert!(z.material_stress >= 0.0 && z.material_stress <= 1.0, "Material stress must clamp 0-1");
        assert!(state.sci >= 0.0 && state.sci <= 1.0, "Global SCI must clamp 0-1");
        assert!(z.knowledge_frontier <= z.tech_ceiling, "Knowledge frontier cannot exceed tech ceiling");
        assert!(z.civ_fields.power >= 0.0 && z.civ_fields.power <= 1.0, "Power field must clamp 0-1");
        assert!(z.civ_fields.survival >= 0.0 && z.civ_fields.survival <= 1.0, "Survival field must clamp 0-1");
    }

    /// Exhaustive multi-tick boundedness: run 100 ticks with extreme initial conditions
    /// and verify that ALL state variables remain within valid bounds on every tick.
    #[test]
    fn test_exhaustive_multi_tick_boundedness() {
        let world = WorldConfig { world_id: 1, ..Default::default() };
        let mut state = UniverseState::with_one_zone(1, 100.0);

        // Start with extreme out-of-bounds values
        state.zones[0].state.entropy = 999.0;
        state.zones[0].state.material_stress = -100.0;
        state.zones[0].state.knowledge_frontier = 50000.0;
        state.zones[0].state.tech_ceiling = 10.0;
        state.zones[0].state.trauma = 50.0;
        state.zones[0].state.inequality = -20.0;

        for tick_num in 0..100 {
            state.tick(&world, None);
            let z = &state.zones[0].state;

            assert!(z.material_stress >= 0.0 && z.material_stress <= 1.0,
                "Tick {}: material_stress={} out of [0,1]", tick_num, z.material_stress);
            assert!(z.entropy >= 0.0,
                "Tick {}: entropy={} must be >= 0", tick_num, z.entropy);
            assert!(state.sci >= 0.0 && state.sci <= 1.0,
                "Tick {}: SCI={} out of [0,1]", tick_num, state.sci);
            assert!(z.knowledge_frontier <= z.tech_ceiling,
                "Tick {}: frontier={} > ceiling={}", tick_num, z.knowledge_frontier, z.tech_ceiling);
            assert!(z.civ_fields.power >= 0.0 && z.civ_fields.power <= 1.0,
                "Tick {}: power={} out of [0,1]", tick_num, z.civ_fields.power);
            assert!(z.civ_fields.survival >= 0.0 && z.civ_fields.survival <= 1.0,
                "Tick {}: survival={} out of [0,1]", tick_num, z.civ_fields.survival);
            assert!(z.civ_fields.knowledge >= 0.0 && z.civ_fields.knowledge <= 1.0,
                "Tick {}: knowledge={} out of [0,1]", tick_num, z.civ_fields.knowledge);
            assert!(z.civ_fields.meaning >= 0.0 && z.civ_fields.meaning <= 1.0,
                "Tick {}: meaning={} out of [0,1]", tick_num, z.civ_fields.meaning);
        }
    }

    /// Snapshot reproducibility: two identical states must produce byte-identical snapshots.
    #[test]
    fn test_snapshot_reproducibility() {
        let world = WorldConfig { world_id: 1, ..Default::default() };

        let mut state_a = UniverseState::with_one_zone(1, 100.0);
        state_a.zones[0].state.entropy = 0.6;
        state_a.zones[0].state.knowledge_frontier = 5.0;
        let mut state_b = state_a.clone();

        // Run both for 10 ticks
        for _ in 0..10 {
            state_a.tick(&world, None);
            state_b.tick(&world, None);
        }

        let snap_a = state_a.to_snapshot();
        let snap_b = state_b.to_snapshot();

        // Serialise and compare byte-for-byte
        let json_a = serde_json::to_string(&snap_a).unwrap();
        let json_b = serde_json::to_string(&snap_b).unwrap();
        assert_eq!(json_a, json_b, "Identical initial states must produce identical snapshots after N ticks");

        // Also verify individual fields
        assert_eq!(snap_a.tick, snap_b.tick);
        assert_eq!(snap_a.entropy, snap_b.entropy);
        assert_eq!(snap_a.stability_index, snap_b.stability_index);
    }

    /// Multi-zone determinism: a universe with 3 zones must be deterministic.
    #[test]
    fn test_multi_zone_determinism() {
        let world = WorldConfig { world_id: 1, ..Default::default() };

        let build = || {
            let mut s = UniverseState::new(1);
            for i in 0..3 {
                let mut z = ZoneState::new(100.0);
                z.entropy = 0.3 + i as f64 * 0.1;
                z.knowledge_frontier = 5.0;
                z.update_material_stress();
                s.zones.push(ZoneStateSerial { id: i, state: z, neighbors: vec![] });
            }
            // Set neighbors for diffusion
            s.zones[0].neighbors = vec![1];
            s.zones[1].neighbors = vec![0, 2];
            s.zones[2].neighbors = vec![1];
            s
        };

        let mut a = build();
        let mut b = build();

        for _ in 0..20 {
            a.tick(&world, None);
            b.tick(&world, None);
        }

        assert_eq!(a.global_entropy, b.global_entropy, "Multi-zone global_entropy must be deterministic");
        assert_eq!(a.sci, b.sci, "Multi-zone SCI must be deterministic");
        for i in 0..3 {
            assert_eq!(a.zones[i].state.entropy, b.zones[i].state.entropy,
                "Zone {} entropy mismatch", i);
            assert_eq!(a.zones[i].state.knowledge_frontier, b.zones[i].state.knowledge_frontier,
                "Zone {} knowledge_frontier mismatch", i);
        }
    }




    /// Trade flow (Deep Sim Phase C): wealth_proxy flows from higher to lower between neighbors.
    #[test]
    fn test_trade_flow_redistributes_wealth() {
        let world = WorldConfig { world_id: 1, ..Default::default() };
        let mut state = UniverseState::new(1);
        let mut z0 = ZoneState::new(100.0);
        z0.wealth_proxy = 0.8;
        z0.entropy = 0.3;
        let mut z1 = ZoneState::new(100.0);
        z1.wealth_proxy = 0.2;
        z1.entropy = 0.4;
        state.zones.push(ZoneStateSerial { id: 0, state: z0, neighbors: vec![1] });
        state.zones.push(ZoneStateSerial { id: 1, state: z1, neighbors: vec![0] });

        let w0_before = state.zones[0].state.wealth_proxy;
        let w1_before = state.zones[1].state.wealth_proxy;
        state.tick(&world, None);
        let w0_after = state.zones[0].state.wealth_proxy;
        let w1_after = state.zones[1].state.wealth_proxy;

        assert!(w0_after < w0_before, "wealth should flow out of richer zone 0");
        assert!(w1_after > w1_before, "wealth should flow into poorer zone 1");
        assert!((w0_after + w1_after - (w0_before + w1_before)).abs() < 0.001, "total wealth approximately conserved");
    }

    /// Ghost Zone Diffusion: local zone should diffuse with ghost zone.
    #[test]
    fn test_ghost_zone_diffusion() {
        use crate::sharding::GhostZone;
        let world = WorldConfig { world_id: 1, ..Default::default() };
        let mut state = UniverseState::new(1);
        
        let mut z_local = ZoneState::new(100.0);
        z_local.entropy = 0.2;
        state.zones.push(ZoneStateSerial { id: 0, state: z_local, neighbors: vec![99] });
        
        let mut z_ghost = ZoneState::new(100.0);
        z_ghost.entropy = 0.8;
        let gz = GhostZone {
            id: 99,
            shard_id: 2,
            state_snapshot: ZoneStateSerial { id: 99, state: z_ghost, neighbors: vec![0] },
        };
        state.ghost_zones.push(gz);

        let entropy_before = state.zones[0].state.entropy;
        state.tick(&world, None);
        let entropy_after = state.zones[0].state.entropy;

        assert!(entropy_after > entropy_before, "entropy should flow from ghost (0.8) to local (0.2)");
    }




}
