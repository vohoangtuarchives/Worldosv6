//! WorldOS V6 constants (§3, §4). Deep Sim Phase 2.3: tune for "healthy" band (variance oscillates); see Doc 21 §4e.

/// Entropy increase per unit structured_mass gained: entropy += k1 * Δstructured (§4.1).
pub const K1_ENTROPY_PER_STRUCTURED: f64 = 0.01;

/// Baseline entropy drift per tick: có drift thì entropy không thể là 0 (§4.1).
pub const ENTROPY_DRIFT_PER_TICK: f64 = 0.003;

/// When Pressure exceeds this, trigger event / cascade (§3). Recommended 0.8–0.9; higher = fewer collapses.
pub const COLLAPSE_THRESHOLD: f64 = 0.85;

/// SCI below this triggers Meta-Cycle (§4.3).
pub const META_CYCLE_SCI_THRESHOLD: f64 = 0.2;

/// Micro mode: instability gradient above this triggers Crisis Window (§3).
pub const INSTABILITY_GRADIENT_THRESHOLD: f64 = 0.7;

/// Diffusion coefficient for entropy/tech/culture between neighboring zones (§4.4). Recommended 0.03–0.08; higher = faster spread.
pub const BETA_DIFFUSION: f64 = 0.05;

/// Phase-dependent diffusion multipliers (Doc 21 §4): collapse spreads faster.
/// Normal=1.0, Famine=1.3, Riots=1.8, Collapse=2.5.
pub const PHASE_DIFFUSION_NORMAL: f64 = 1.0;
pub const PHASE_DIFFUSION_FAMINE: f64 = 1.3;
pub const PHASE_DIFFUSION_RIOTS: f64 = 1.8;
pub const PHASE_DIFFUSION_COLLAPSE: f64 = 2.5;

/// Population flow (Doc 21 §4.1): flow_ij = k * (pressure_i - pressure_j); pressure = pop / resources proxy.
pub const POPULATION_FLOW_COEFFICIENT: f64 = 0.05;
/// Max population_proxy flow per tick per edge to avoid runaway.
pub const MAX_POPULATION_FLOW_PER_TICK: f64 = 0.1;

/// Hazard model (Doc 21 §10): sigmoid steepness for P(phase change). Higher k = sharper transition. Recommended 5–12.
pub const HAZARD_SIGMOID_STEEPNESS: f64 = 8.0;

/// Event cascade (Doc 21 §10): pressure injection to neighbors when emitting Famine/Riots/Collapse (no phase change).
pub const EVENT_CASCADE_ENTROPY_NEIGHBOR: f64 = 0.05;
pub const EVENT_CASCADE_TRAUMA_NEIGHBOR: f64 = 0.03;
pub const EVENT_CASCADE_INEQUALITY_NEIGHBOR: f64 = 0.02;

/// Deep Sim Phase 3: Innovation/diversity generator. Max absolute delta per tick per cultural dimension.
pub const CULTURAL_DRIFT_MAGNITUDE: f64 = 0.008;
/// Tech discovery: probability denominator (hash % this == 0 triggers boost). Smaller = more frequent.
pub const TECH_DISCOVERY_MOD: u64 = 500;
/// Tech discovery: additive delta to knowledge_frontier when triggered.
pub const TECH_DISCOVERY_DELTA: f64 = 0.01;

/// Deep Sim Phase 4: Macro agent (army) contribution to zone pressure. pressure += strength * this.
pub const MACRO_ARMY_PRESSURE_COEFF: f64 = 0.05;

/// Trade flow (Deep Sim Phase C): flow_ij = k_trade * (wealth_i - wealth_j) between neighbors; wealth_proxy per zone.
pub const TRADE_FLOW_COEFFICIENT: f64 = 0.04;
/// Max wealth_proxy flow per tick per edge to avoid runaway.
pub const MAX_TRADE_FLOW_PER_TICK: f64 = 0.08;
