//! Engine logic: advance, merge, observe, trajectory analysis, and vectorized simulation.
//! Used by both gRPC and HTTP transports.

use worldos_core::{tick_with_cascade, KernelGenome, UniverseState, WorldConfig};
use crate::{
    RegimeTransition, TrajectoryAnalysisResponse, TrajectoryPoint, WorldConfig as GrpcWorldConfig,
    ActorSoaOutput, ProcessActorsSoaResponse, ProcessFieldsV7Response, ComputeMetabolismGridResponse,
};
use rayon::prelude::*;
use rand::SeedableRng;
use rand::Rng;

/// Deserialize state from bytes: JSON if starts with b'{', else bincode.
pub fn deserialize_state(state_input: &[u8]) -> Result<UniverseState, String> {
    if state_input.is_empty() {
        return Err("empty state_input".to_string());
    }
    let first = state_input[0];
    if first == b'{' {
        serde_json::from_slice(state_input).map_err(|e| format!("state_input json: {}", e))
    } else {
        bincode::deserialize(state_input).map_err(|e| format!("state_input bincode: {}", e))
    }
}

pub fn run_advance(
    universe_id: u64,
    ticks: u64,
    state_input: &[u8],
    world_meta: Option<GrpcWorldConfig>,
) -> Result<(u64, String, f64, f64, String, f64, f64, String), String> {
    let mut state: UniverseState = if state_input.is_empty() {
        UniverseState::with_one_zone(universe_id, 100.0)
    } else {
        deserialize_state(state_input)?
    };

    if state.zones.is_empty() {
        let saved_tick = state.tick;
        state = UniverseState::with_one_zone(universe_id, 100.0);
        state.tick = saved_tick;
    }

    let world = if let Some(meta) = world_meta {
        WorldConfig {
            world_id: meta.world_id,
            origin: meta.origin,
            axiom: serde_json::from_str(&meta.axiom_json).ok(),
            world_seed: serde_json::from_str(&meta.world_seed_json).ok(),
            genome: meta.genome.map(|g| KernelGenome {
                diffusion_rate: g.diffusion_rate,
                entropy_coefficient: g.entropy_coefficient,
                mutation_rate: g.mutation_rate,
                attractor_gravity: g.attractor_gravity,
                complexity_bonus: g.complexity_bonus,
            }),
            behavior_graph: None,
            sharding_config: None,
        }
    } else {
        WorldConfig {
            world_id: 0,
            axiom: None,
            world_seed: None,
            origin: "generic".to_string(),
            genome: None,
            behavior_graph: None,
            sharding_config: None,
        }
    };

    let macro_idx = state.build_macro_index();
    for _ in 0..ticks {
        let _events = tick_with_cascade(&mut state, &world, 4, Some(&macro_idx));
    }

    let snap = state.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);
    let sci = state.sci;
    let instability_gradient = state.instability_gradient;
    let global_fields_json = serde_json::to_string(&state.global_fields).unwrap_or_else(|_| "{}".to_string());

    Ok((snap.tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, global_fields_json))
}

pub fn run_merge(state_a_input: &[u8], state_b_input: &[u8]) -> Result<(u64, String, f64, f64, String, f64, f64, String), String> {
    let mut state_a = deserialize_state(state_a_input)?;
    let state_b = deserialize_state(state_b_input)?;
    state_a.merge(state_b);

    let snap = state_a.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);
    let sci = state_a.sci;
    let instability_gradient = state_a.instability_gradient;
    let global_fields_json = serde_json::to_string(&state_a.global_fields).unwrap_or_else(|_| "{}".to_string());

    Ok((snap.tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, global_fields_json))
}

pub fn run_observe(
    universe_id: u64,
    zone_index: u32,
    intensity: f64,
    state_input: &[u8],
) -> Result<(u64, String, f64, f64, String, f64, f64, String), String> {
    let mut state: UniverseState = if state_input.is_empty() {
        UniverseState::with_one_zone(universe_id, 100.0)
    } else {
        deserialize_state(state_input)?
    };

    if state.zones.is_empty() {
        let saved_tick = state.tick;
        state = UniverseState::with_one_zone(universe_id, 100.0);
        state.tick = saved_tick;
    }

    if let Some(zone) = state.zones.get_mut(zone_index as usize) {
        zone.state.entropy = (zone.state.entropy + intensity * 0.05).min(1.0);
    }

    let world = WorldConfig::default();
    let macro_idx = state.build_macro_index();
    let _events = tick_with_cascade(&mut state, &world, 4, Some(&macro_idx));

    let snap = state.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);
    let sci = state.sci;
    let instability_gradient = state.instability_gradient;
    let global_fields_json = serde_json::to_string(&state.global_fields).unwrap_or_else(|_| "{}".to_string());

    Ok((snap.tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, global_fields_json))
}

// ═══════════════════════════════════════════════════════
// Vectorized Simulation Logic (ported from FFI)
// ═══════════════════════════════════════════════════════

pub fn run_evaluate_rules(state_json: &str, dsl: &str) -> (bool, String, String) {
    let state: serde_json::Value = serde_json::from_str(state_json).unwrap_or(serde_json::Value::Null);
    let mut rng = rand::rngs::StdRng::from_entropy();
    match worldos_rules::evaluate_rules(dsl, &state, Some(&mut rng)) {
        Ok(outputs) => {
            let out_json = serde_json::to_string(&outputs).unwrap_or("{}".to_string());
            (true, String::new(), out_json)
        }
        Err(e) => (false, format!("{:?}", e), "{}".to_string()),
    }
}

pub fn run_process_actors_soa(
    tick: u64,
    ids: Vec<u64>,
    zone_ids: Vec<u32>,
    mut hunger: Vec<f32>,
    mut energy: Vec<f32>,
    fear: Vec<f32>,
    mut trauma: Vec<f32>,
    heroic_types: Vec<u32>,
    lineage_ids: Vec<u64>,
    memes: Vec<u64>,
) -> ProcessActorsSoaResponse {
    let count = ids.len();
    if count == 0 {
        return ProcessActorsSoaResponse { ok: true, error_message: String::new(), outputs: vec![] };
    }

    // Prepare seeds for determinism
    let seeds: Vec<u64> = ids.iter().map(|id| id.wrapping_add(tick)).collect();

    let outputs: Vec<ActorSoaOutput> = (0..count).into_par_iter().map(|i| {
        let mut rng = rand::rngs::StdRng::seed_from_u64(seeds[i]);
        
        let h_val = hunger[i];
        let e_val = energy[i];
        let f_val = fear[i];
        let t_val = trauma[i];

        let mut action_id = 0; // Idle
        let mut h_delta = 0.0;
        let mut e_delta = 0.0;
        let mut t_delta = -0.005; // Base trauma decay

        let effective_fear = (f_val + t_val * 0.4).clamp(0.0, 1.0);

        if h_val > 0.8 {
            action_id = 1; // FindFood
            h_delta = -0.4;
            e_delta = 0.15;
        } else if effective_fear > 0.65 {
            action_id = 2; // Flee
            e_delta = -0.25;
            if effective_fear > 0.85 {
                t_delta = 0.04;
            }
        }

        let drift: f32 = rng.gen_range(-0.01..0.01);
        
        ActorSoaOutput {
            action_id,
            new_hunger: (h_val + h_delta + drift).clamp(0.0, 1.0),
            new_energy: (e_val + e_delta + drift).clamp(0.0, 1.0),
            new_trauma: (t_val + t_delta).clamp(0.0, 1.0),
        }
    }).collect();

    ProcessActorsSoaResponse {
        ok: true,
        error_message: String::new(),
        outputs,
    }
}

pub fn run_process_fields_v7(
    fields: Vec<f64>,
    neighbor_counts: Vec<u32>,
    neighbor_offsets: Vec<u32>,
    neighbors: Vec<u32>,
    diffusion_rate: f64,
    preservation_rate: f64,
) -> Vec<f64> {
    let count = neighbor_counts.len();
    if count == 0 { return fields; }
    
    let mut deltas = vec![0.0; count * 8];
    for i in 0..count {
        let n_count = neighbor_counts[i] as f64;
        if n_count < 1e-9 { continue; }
        let offset = neighbor_offsets[i] as usize;
        for j in 0..(neighbor_counts[i] as usize) {
            let neighbor_idx = neighbors[offset + j] as usize;
            if neighbor_idx >= count { continue; }
            for f in 0..8 {
                let diff = fields[neighbor_idx * 8 + f] - fields[i * 8 + f];
                deltas[i * 8 + f] += diffusion_rate * diff / n_count;
            }
        }
    }
    
    let mut new_fields = fields;
    for i in 0..count {
        for f in 0..8 {
            let idx = i * 8 + f;
            new_fields[idx] *= preservation_rate;
            new_fields[idx] = (new_fields[idx] + deltas[idx]).clamp(0.0, 1.0);
        }
    }
    new_fields
}

pub fn run_compute_metabolism_grid(
    mut populations: Vec<f64>,
    mut biomasses: Vec<f64>,
    industries: Vec<f64>,
    efficiency: f64,
    base_energy: f64,
) -> ComputeMetabolismGridResponse {
    let count = populations.len();
    if count == 0 {
        return ComputeMetabolismGridResponse { total_waste: 0.0, populations, biomasses, net_energies: vec![] };
    }

    let mut net_energies = vec![0.0; count];
    let mut total_waste = 0.0;

    for i in 0..count {
        let p = populations[i];
        let ind_act = industries[i];
        
        let gross_energy = base_energy * efficiency;
        let maintenance = (p * 0.01) + (ind_act * 0.05);
        let net_e = gross_energy - maintenance;
        net_energies[i] = net_e;
        
        if net_e < -0.5 {
            let deaths = p * 0.3;
            populations[i] = p - deaths;
            biomasses[i] += deaths * 0.05;
        }
        
        let waste_rate = 1.0 - efficiency;
        total_waste += (maintenance * waste_rate) * 0.1;
    }

    ComputeMetabolismGridResponse {
        total_waste,
        populations,
        biomasses,
        net_energies,
    }
}

pub fn run_calculate_vocation_alignment(actor_motivation_json: &str, target_profile_json: &str) -> f32 {
    let actor_motivation: worldos_core::vocation::definitions::MotivationProfile = 
        serde_json::from_str(actor_motivation_json).unwrap_or_default();
    let target_profile: worldos_core::vocation::definitions::MotivationProfile = 
        serde_json::from_str(target_profile_json).unwrap_or_default();
        
    worldos_core::vocation::scoring::calculate_vocation_alignment(&actor_motivation, &target_profile)
}

pub fn run_get_combined_gravity(rulesets_json: &str) -> f32 {
    let rulesets: Vec<worldos_core::ruleset::RuleSet> = serde_json::from_str(rulesets_json).unwrap_or_default();
    let engine = worldos_core::ruleset::RuleSetEngine { active_rulesets: rulesets };
    engine.get_combined_gravity()
}

// ═══════════════════════════════════════════════════════
// Trajectory Analysis
// ═══════════════════════════════════════════════════════

const MAX_RECURRENCE_PAIRS: u64 = 500_000;

fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

pub fn run_trajectory_analysis(points: &[TrajectoryPoint], threshold: f64) -> TrajectoryAnalysisResponse {
    let n = points.len();
    if n < 3 {
        return TrajectoryAnalysisResponse {
            is_bounded: true,
            is_recurrent: false,
            recurrence_rate: 0.0,
            max_lyapunov_estimate: 0.0,
            trajectory_variance: 0.0,
            basin_center: vec![],
            basin_radius: 0.0,
            regime_transitions: vec![],
        };
    }

    let threshold = if threshold <= 0.0 { 0.1 } else { threshold };
    let dim = points[0].state.len();

    let mut center = vec![0.0f64; dim];
    for p in points.iter() {
        for (i, v) in p.state.iter().enumerate() {
            if i < dim {
                center[i] += v;
            }
        }
    }
    for c in center.iter_mut() {
        *c /= n as f64;
    }

    let mut max_dist = 0.0f64;
    for p in points.iter() {
        let d = euclidean_distance(&p.state, &center);
        if d > max_dist {
            max_dist = d;
        }
    }

    let variance: f64 = points
        .iter()
        .map(|p| euclidean_distance(&p.state, &center).powi(2))
        .sum::<f64>() / n as f64;
    let mean_radius = variance.sqrt();
    let is_bounded = max_dist < mean_radius * 5.0 + 0.01;

    let total_pairs = ((n * (n - 1)) / 2) as u64;
    let (recurrence_count, total_counted, _) = if total_pairs > MAX_RECURRENCE_PAIRS {
        let step = (total_pairs / MAX_RECURRENCE_PAIRS).max(1);
        let mut recurrence_count = 0u64;
        let mut total_counted = 0u64;
        let mut t = 0u64;
        while t < total_pairs && total_counted < MAX_RECURRENCE_PAIRS {
            let mut remaining = t;
            let mut i = 0usize;
            while i < n && remaining as usize >= n - 1 - i {
                remaining -= (n - 1 - i) as u64;
                i += 1;
            }
            if i >= n {
                break;
            }
            let j = i + 1 + remaining as usize;
            if j < n {
                let d = euclidean_distance(&points[i].state, &points[j].state);
                if d < threshold {
                    recurrence_count += 1;
                }
                total_counted += 1;
            }
            t += step;
        }
        (recurrence_count, total_counted, true)
    } else {
        let mut recurrence_count = 0u64;
        for i in 0..n {
            for j in (i + 1)..n {
                let d = euclidean_distance(&points[i].state, &points[j].state);
                if d < threshold {
                    recurrence_count += 1;
                }
            }
        }
        (recurrence_count, total_pairs, false)
    };

    let recurrence_rate = if total_counted > 0 {
        recurrence_count as f64 / total_counted as f64
    } else {
        0.0
    };
    let is_recurrent = recurrence_rate > 0.05 && recurrence_rate < 0.90;

    let mut step_distances = Vec::with_capacity(n.saturating_sub(1));
    for i in 0..(n - 1) {
        step_distances.push(euclidean_distance(&points[i].state, &points[i + 1].state));
    }
    let mean_step = if step_distances.is_empty() {
        0.0
    } else {
        step_distances.iter().sum::<f64>() / step_distances.len() as f64
    };

    let mut transitions = Vec::new();
    for (i, d) in step_distances.iter().enumerate() {
        if *d > mean_step * 2.5 && mean_step > 1e-6 {
            transitions.push(RegimeTransition {
                from_tick: points[i].tick,
                to_tick: points[i + 1].tick,
                distance: *d,
            });
        }
    }

    let lyapunov = estimate_lyapunov(points);

    TrajectoryAnalysisResponse {
        is_bounded,
        is_recurrent,
        recurrence_rate,
        max_lyapunov_estimate: lyapunov,
        trajectory_variance: variance,
        basin_center: center,
        basin_radius: max_dist,
        regime_transitions: transitions,
    }
}

fn estimate_lyapunov(points: &[TrajectoryPoint]) -> f64 {
    let n = points.len();
    if n < 20 {
        return 0.0;
    }
    let look_ahead = 5.min(n / 4);
    let mut divergence_sum = 0.0f64;
    let mut count = 0u32;

    for i in 0..(n - look_ahead) {
        let mut min_dist = f64::MAX;
        let mut nearest_j = 0;
        for j in 0..(n - look_ahead) {
            if (i as isize - j as isize).unsigned_abs() < 3 {
                continue;
            }
            let d = euclidean_distance(&points[i].state, &points[j].state);
            if d < min_dist && d > 1e-10 {
                min_dist = d;
                nearest_j = j;
            }
        }
        if min_dist < f64::MAX && nearest_j + look_ahead < n {
            let evolved_dist = euclidean_distance(
                &points[i + look_ahead].state,
                &points[nearest_j + look_ahead].state,
            );
            if evolved_dist > 1e-10 && min_dist > 1e-10 {
                divergence_sum += (evolved_dist / min_dist).ln();
                count += 1;
            }
        }
    }
    if count > 0 {
        divergence_sum / (count as f64 * look_ahead as f64)
    } else {
        0.0
    }
}
