#![allow(clippy::missing_safety_doc)]

use std::slice;

/// A simple struct to represent the packed trait vectors
#[repr(C)]
pub struct TraitVectors {
    pub data: *mut f64,
    pub stride: usize, // usually 17
}

/// The main entry point for the FFI Vectorized Projection.
/// 
/// PHP calls this function passing pointers to its packed arrays.
/// Rust processes the behavior rules in parallel and updates the arrays in-place.
#[no_mangle]
pub unsafe extern "C" fn process_actors_soa(
    count: usize,
    ids: *const u64,
    zone_ids: *const u32,
    hunger: *mut f32,
    energy: *mut f32,
    fear: *mut f32,
    memes: *mut u64,
    mut_actions_out: *mut u32, // Action IDs returned to PHP
) -> i32 {
    if count == 0 {
        return 0;
    }

    // Convert C pointers to Rust slices
    let ids_slice = slice::from_raw_parts(ids, count);
    let zone_ids_slice = slice::from_raw_parts(zone_ids, count);
    let hunger_slice = slice::from_raw_parts_mut(hunger, count);
    let energy_slice = slice::from_raw_parts_mut(energy, count);
    let fear_slice = slice::from_raw_parts_mut(fear, count);
    let memes_slice = slice::from_raw_parts_mut(memes, count);
    let actions_out_slice = slice::from_raw_parts_mut(mut_actions_out, count);

    // TODO: In Phase 3, this will use rayon for parallel iteration
    // For now, we simulate a simple micro-layer Behavior Graph Engine loop.
    for i in 0..count {
        let _id = ids_slice[i];
        let _zone = zone_ids_slice[i];
        
        // Example: very simple decision tree
        if hunger_slice[i] > 0.8 {
            actions_out_slice[i] = 1; // 1 = FindFood
            hunger_slice[i] -= 0.5;   // Simulate eating
            energy_slice[i] += 0.2;
        } else if fear_slice[i] > 0.6 {
            actions_out_slice[i] = 2; // 2 = Flee
            energy_slice[i] -= 0.3;
        } else {
            actions_out_slice[i] = 0; // 0 = Idle
        }
    }

    // Return 1 for success
    1
}
