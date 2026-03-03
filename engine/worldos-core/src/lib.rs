pub mod agent;
pub mod cascade;
pub mod constants;
pub mod types;
pub mod universe;

pub use agent::{Agent, TraitVector};
pub use cascade::{tick_with_cascade, SimEvent};
pub use constants::{COLLAPSE_THRESHOLD, K1_ENTROPY_PER_STRUCTURED};
pub use types::*;
pub use universe::{UniverseState, ZoneId, ZoneStateSerial};
