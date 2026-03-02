//! WorldOS V6 constants (§3, §4).

/// Entropy increase per unit structured_mass gained: entropy += k1 * Δstructured (§4.1).
pub const K1_ENTROPY_PER_STRUCTURED: f64 = 0.01;

/// When Pressure exceeds this, trigger event / cascade (§3).
pub const COLLAPSE_THRESHOLD: f64 = 0.85;

/// SCI below this triggers Meta-Cycle (§4.3).
pub const META_CYCLE_SCI_THRESHOLD: f64 = 0.2;

/// Micro mode: instability gradient above this triggers Crisis Window (§3).
pub const INSTABILITY_GRADIENT_THRESHOLD: f64 = 0.7;
