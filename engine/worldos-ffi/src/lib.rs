#![allow(clippy::missing_safety_doc)]

use std::slice;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use worldos_rules::{evaluate_rules, RuleOutput};
use rand::SeedableRng;
use rayon::prelude::*;

// Helper struct to share pointers across Rayon threads (§Level-10)
#[derive(Copy, Clone)]
struct SendPtr<T>(pub *mut T);
unsafe impl<T> Send for SendPtr<T> {}
unsafe impl<T> Sync for SendPtr<T> {}

/// The main entry point for the FFI Vectorized Projection.
#[no_mangle]
pub unsafe extern "C" fn process_actors_soa(
    count: usize,
    _ids: *const u64,
    _zone_ids: *const u32,
    p_hunger: *mut f32,
    p_energy: *mut f32,
    p_fear: *mut f32,
    p_trauma: *mut f32, // New: Persistence (§Level-10)
    _heroic_types: *mut u8,
    _lineage_ids: *mut u64,
    _memes: *mut u64,
    p_seeds: *const u64, // New: Determinism (§Level-10)
    p_actions_out: *mut u32, // Action IDs returned to PHP
) -> i32 {
    if count == 0 {
        return 0;
    }

    // Shadow parameters with SendPtr to isolate them from capture errors
    let h_p = SendPtr(p_hunger);
    let e_p = SendPtr(p_energy);
    let f_p = SendPtr(p_fear);
    let t_p = SendPtr(p_trauma);
    let s_p = SendPtr(p_seeds as *mut u64);
    let a_p = SendPtr(p_actions_out);

    // Phase 10: Zenith Parallel execution (§Level-10)
    (0..count).into_par_iter().for_each(move |i| {
        // Access pointers strictly via SendPtr inside unsafe block
        let hp = h_p;
        let ep = e_p;
        let fp = f_p;
        let tp = t_p;
        let sp = s_p;
        let ap = a_p;

        unsafe {
            let seed = *sp.0.add(i);
            let mut rng = rand::rngs::StdRng::seed_from_u64(seed);
            
            let h_ptr = hp.0.add(i);
            let e_ptr = ep.0.add(i);
            let f_ptr = fp.0.add(i);
            let t_ptr = tp.0.add(i);
            let a_ptr = ap.0.add(i);

            let hunger_val = *h_ptr;
            let energy_val = *e_ptr;
            let fear_val = *f_ptr;
            let trauma_val = *t_ptr;

            let mut action = 0; // 0 = Idle
            let mut h_delta = 0.0;
            let mut e_delta = 0.0;
            let mut t_delta = -0.005; // Base trauma decay (§Level-10)

            // Decision logic with Trauma influence
            let effective_fear = (fear_val + trauma_val * 0.4).clamp(0.0, 1.0);

            if hunger_val > 0.8 {
                action = 1; // 1 = FindFood
                h_delta = -0.4;
                e_delta = 0.15;
            } else if effective_fear > 0.65 {
                action = 2; // 2 = Flee
                e_delta = -0.25;
                if effective_fear > 0.85 {
                    t_delta = 0.04;
                }
            } 
            
            // Deterministic random drift
            use rand::Rng;
            let drift: f32 = rng.gen_range(-0.01..0.01);
            
            *h_ptr = (hunger_val + h_delta + drift).clamp(0.0, 1.0);
            *e_ptr = (energy_val + e_delta + drift).clamp(0.0, 1.0);
            *t_ptr = (trauma_val + t_delta).clamp(0.0, 1.0);
            *a_ptr = action;
        }
    });

    1
}

/// Phase 53: Process Attractor Fields Dynamics in Rust (§Level-9)
#[no_mangle]
pub unsafe extern "C" fn process_fields_v7(
    count: usize,
    fields: *mut f64,
    neighbor_counts: *const u32,
    neighbor_offsets: *const u32,
    neighbors: *const u32,
    diffusion_rate: f64,
    preservation_rate: f64,
) -> i32 {
    let fields_slice = slice::from_raw_parts_mut(fields, count * 8);
    let n_counts = slice::from_raw_parts(neighbor_counts, count);
    let n_offsets = slice::from_raw_parts(neighbor_offsets, count);
    let n_list = slice::from_raw_parts(neighbors, n_offsets[count - 1] as usize + n_counts[count - 1] as usize);
    let mut deltas = vec![0.0; count * 8];
    for i in 0..count {
        let n_count = n_counts[i] as f64;
        if n_count < 1e-9 { continue; }
        let offset = n_offsets[i] as usize;
        for j in 0..(n_counts[i] as usize) {
            let neighbor_idx = n_list[offset + j] as usize;
            if neighbor_idx >= count { continue; }
            for f in 0..8 {
                let diff = fields_slice[neighbor_idx * 8 + f] - fields_slice[i * 8 + f];
                deltas[i * 8 + f] += diffusion_rate * diff / n_count;
            }
        }
    }
    for i in 0..count {
        for f in 0..8 {
            let idx = i * 8 + f;
            fields_slice[idx] *= preservation_rate;
            fields_slice[idx] = (fields_slice[idx] + deltas[idx]).clamp(0.0, 1.0);
        }
    }
    1
}

/// Phase 15: Grid-Based Metabolic Calculation (O(N) parallelized)
#[no_mangle]
pub unsafe extern "C" fn process_metabolism_grid(
    count: usize,
    population: *mut f64,
    biomass: *mut f64,
    industry: *const f64,
    net_energy_out: *mut f64,
    efficiency: f64,
    base_energy: f64,
) -> f64 { // Returns total waste (entropy generation)
    if count == 0 { return 0.0; }
    
    // Shadow parameters with SendPtr to isolate them from capture errors (§Level-10)
    let p_p = SendPtr(population);
    let b_p = SendPtr(biomass);
    let i_p = SendPtr(industry as *mut f64);
    let n_p = SendPtr(net_energy_out);
    
    let total_waste: f64 = (0..count).into_par_iter().map(move |i| {
        // Access pointers strictly via SendPtr inside unsafe block
        let pp = p_p;
        let bp = b_p;
        let ip = i_p;
        let np = n_p;

        unsafe {
            let p_ptr = pp.0.add(i);
            let b_ptr = bp.0.add(i);
            let i_ptr = ip.0.add(i);
            let n_ptr = np.0.add(i);

            let p = *p_ptr;
            let ind_act = *i_ptr;
            
            let gross_energy = base_energy * efficiency;
            let maintenance = (p * 0.01) + (ind_act * 0.05);
            let net_e = gross_energy - maintenance;
            *n_ptr = net_e;
            
            // Emulate starvation
            if net_e < -0.5 {
                let deaths = p * 0.3; // 30% penalty
                *p_ptr = p - deaths;
                *b_ptr += deaths * 0.05; // Return to biomass
            }
            
            let waste_rate = 1.0 - efficiency;
            (maintenance * waste_rate) * 0.1
        }
    }).sum();
    
    total_waste
}

#[no_mangle]
pub unsafe extern "C" fn evaluate_dsl_v10(
    dsl_ptr: *const c_char,
    state_json_ptr: *const c_char,
    seed: u64,
) -> *mut c_char {
    if dsl_ptr.is_null() || state_json_ptr.is_null() { return std::ptr::null_mut(); }
    let dsl = CStr::from_ptr(dsl_ptr).to_str().unwrap_or("");
    let state_json = CStr::from_ptr(state_json_ptr).to_str().unwrap_or("{}");
    let state: serde_json::Value = serde_json::from_str(state_json).unwrap_or(serde_json::Value::Null);
    let mut rng = rand::rngs::StdRng::seed_from_u64(seed);
    match evaluate_rules(dsl, &state, Some(&mut rng)) {
        Ok(outputs) => {
            let out_json = serde_json::to_string(&outputs).unwrap_or("{}".to_string());
            CString::new(out_json).unwrap().into_raw()
        }
        Err(e) => {
            CString::new(format!("{{\"error\": \"{:?}\"}}", e)).unwrap().into_raw()
        }
    }
}

/// Phase 55: Emergent Universe Tick (Meso/Macro layer influence)
/// Receives full state and narrative influences, returns updated state + events.
#[no_mangle]
pub unsafe extern "C" fn tick_universe_emergent(
    state_json_ptr: *const c_char,
    influences_json_ptr: *const c_char,
) -> *mut c_char {
    if state_json_ptr.is_null() {
        return CString::new("{\"error\": \"Null state pointer\"}").unwrap().into_raw();
    }

    let state_json = CStr::from_ptr(state_json_ptr).to_str().unwrap_or("{}");
    let influences_json = if influences_json_ptr.is_null() {
        "[]"
    } else {
        CStr::from_ptr(influences_json_ptr).to_str().unwrap_or("[]")
    };

    println!("FFI: tick_universe_emergent - State size: {}, Influences: {}", state_json.len(), influences_json);

    // Phase 1: Deserialize
    let mut universe: worldos_core::types::UniverseState = match serde_json::from_str(state_json) {
        Ok(u) => u,
        Err(e) => {
            return CString::new(format!("{{\"error\": \"State deserialization failed: {:?}\"}}", e)).unwrap().into_raw();
        }
    };

    let influences: Vec<serde_json::Value> = serde_json::from_str(influences_json).unwrap_or_default();

    // Phase 2: Apply Influences (RuleSet Axioms, etc.)
    for influence in influences {
        if let Some(inf_type) = influence.get("type").and_then(|t| t.as_str()) {
            if inf_type == "ruleset_axioms" {
                if let Some(payload) = influence.get("payload") {
                    println!("FFI: Applying RuleSet Axioms: {}", payload);
                    // Map axioms to narrative influence (which uses the payload internally)
                    universe.apply_narrative_influence(&influence);
                }
            }
        }
    }

    // Phase 3: Tick Universe (Motivation Drift, etc.)
    println!("FFI: Executing universe.tick()...");
    let world_config = worldos_core::types::WorldConfig::default();
    universe.tick(&world_config, None); 

    // Phase 4: Serialize & Return
    let outputs = serde_json::json!({
        "state": universe,
        "scars": universe.scars,
        "narrative_tags": universe.narrative_tags
    });

    match serde_json::to_string(&outputs) {
        Ok(json) => CString::new(json).unwrap().into_raw(),
        Err(e) => CString::new(format!("{{\"error\": \"Serialization failed: {:?}\"}}", e)).unwrap().into_raw(),
    }
}

#[no_mangle]
pub unsafe extern "C" fn vocation_calculate_alignment_ffi(
    actor_motivation_json_ptr: *const c_char,
    target_profile_json_ptr: *const c_char,
) -> f32 {
    if actor_motivation_json_ptr.is_null() || target_profile_json_ptr.is_null() { return 0.0; }
    
    let actor_json = CStr::from_ptr(actor_motivation_json_ptr).to_str().unwrap_or("{}");
    let target_json = CStr::from_ptr(target_profile_json_ptr).to_str().unwrap_or("{}");
    
    let actor_motivation: worldos_core::vocation::definitions::MotivationProfile = 
        serde_json::from_str(actor_json).unwrap_or_default();
    let target_profile: worldos_core::vocation::definitions::MotivationProfile = 
        serde_json::from_str(target_json).unwrap_or_default();
        
    worldos_core::vocation::scoring::calculate_vocation_alignment(&actor_motivation, &target_profile)
}

#[no_mangle]
pub unsafe extern "C" fn ruleset_get_gravity_ffi(
    rulesets_json_ptr: *const c_char,
) -> f32 {
    if rulesets_json_ptr.is_null() { return 1.0; }
    
    let json = CStr::from_ptr(rulesets_json_ptr).to_str().unwrap_or("[]");
    let rulesets: Vec<worldos_core::ruleset::RuleSet> = serde_json::from_str(json).unwrap_or_default();
    
    let engine = worldos_core::ruleset::RuleSetEngine { active_rulesets: rulesets };
    engine.get_combined_gravity()
}

#[no_mangle]
pub unsafe extern "C" fn free_rust_string(s: *mut c_char) {
    if !s.is_null() { let _ = CString::from_raw(s); }
}
