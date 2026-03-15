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
    heroic_types: *mut u8,
    lineage_ids: *mut u64,
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
    let heroic_types_slice = slice::from_raw_parts_mut(heroic_types, count);
    let lineage_ids_slice = slice::from_raw_parts_mut(lineage_ids, count);
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

/// Phase 53: Process Attractor Fields Dynamics in Rust (§Level-9)
/// Handles 8-field diffusion and natural decay (0.4) in high-performance Rust.
#[no_mangle]
pub unsafe extern "C" fn process_fields_v7(
    count: usize,
    fields: *mut f64, // Packed 8xCount array
    neighbor_counts: *const u32,
    neighbor_offsets: *const u32,
    neighbors: *const u32,
    diffusion_rate: f64,
    preservation_rate: f64,
) -> i32 {
    if count == 0 {
        return 0;
    }

    let fields_slice = slice::from_raw_parts_mut(fields, count * 8);
    let n_counts = slice::from_raw_parts(neighbor_counts, count);
    let n_offsets = slice::from_raw_parts(neighbor_offsets, count);
    let n_list = slice::from_raw_parts(neighbors, *n_offsets.add(count - 1) as usize + *n_counts.add(count - 1) as usize);

    let mut deltas = vec![0.0; count * 8];

    // 1. Calculate Diffusion Deltas
    for i in 0..count {
        let n_count = n_counts[i] as f64;
        if n_count < 1e-9 {
            continue;
        }

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

    // 2. Apply Decay and Deltas
    for i in 0..count {
        for f in 0..8 {
            let idx = i * 8 + f;
            // Apply preservation rate (decay) (§Level-9: 0.4)
            fields_slice[idx] *= preservation_rate;
            // Apply diffusion delta
            fields_slice[idx] = (fields_slice[idx] + deltas[idx]).clamp(0.0, 1.0);
        }
    }

    1
}
