//! WorldOS V6 constants (§3, §4).

/// Entropy increase per unit structured_mass gained: entropy += k1 * Δstructured (§4.1).
pub const K1_ENTROPY_PER_STRUCTURED: f64 = 0.01;

/// Baseline entropy drift per tick: có drift thì entropy không thể là 0 (§4.1).
pub const ENTROPY_DRIFT_PER_TICK: f64 = 0.003;

/// When Pressure exceeds this, trigger event / cascade (§3).
pub const COLLAPSE_THRESHOLD: f64 = 0.85;

/// SCI below this triggers Meta-Cycle (§4.3).
pub const META_CYCLE_SCI_THRESHOLD: f64 = 0.2;

/// Micro mode: instability gradient above this triggers Crisis Window (§3).
pub const INSTABILITY_GRADIENT_THRESHOLD: f64 = 0.7;

/// Diffusion coefficient for entropy/tech/culture between neighboring zones (§4.4).
pub const BETA_DIFFUSION: f64 = 0.05;
