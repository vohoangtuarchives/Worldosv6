pub mod worldos {
    pub mod simulation {
        include!(concat!(env!("OUT_DIR"), "/worldos.simulation.rs"));
    }
}

pub use worldos::simulation::simulation_engine_server;
pub use worldos::simulation::{
    AdvanceRequest, AdvanceResponse, UniverseSnapshot, WorldConfig,
    MergeRequest, MergeResponse, ObserveRequest, ObserveResponse,
};
