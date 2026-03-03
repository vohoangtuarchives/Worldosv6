//! WorldOS V6: gRPC + HTTP server. gRPC on 50051, HTTP bridge on 50052.

use std::net::SocketAddr;
use tonic::{Request, Response, Status};
use worldos_core::{tick_with_cascade, UniverseState, WorldConfig};
use worldos_grpc::{
    simulation_engine_server::SimulationEngine, simulation_engine_server::SimulationEngineServer, 
    AdvanceRequest, AdvanceResponse, MergeRequest, MergeResponse, 
    ObserveRequest, ObserveResponse, UniverseSnapshot,
};

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};

struct EngineService;

fn run_advance(universe_id: u64, ticks: u64, state_input: &[u8], world_meta: Option<worldos_grpc::WorldConfig>) -> Result<(u64, String, f64, f64, String, f64, f64), String> {
    let mut state: UniverseState = if state_input.is_empty() {
        UniverseState::with_one_zone(universe_id, 100.0)
    } else {
        serde_json::from_slice(state_input).map_err(|e| format!("state_input json: {}", e))?
    };

    let world = if let Some(meta) = world_meta {
        WorldConfig {
            world_id: meta.world_id,
            origin: meta.origin,
            axiom: serde_json::from_str(&meta.axiom_json).ok(),
            world_seed: serde_json::from_str(&meta.world_seed_json).ok(),
        }
    } else {
        WorldConfig {
            world_id: 0,
            axiom: None,
            world_seed: None,
            origin: "generic".to_string(),
        }
    };

    let mut all_events = Vec::new();
    for _ in 0..ticks {
        let events = tick_with_cascade(&mut state, &world, 4);
        all_events.extend(events);
    }

    let snap = state.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);

    let sci = state.sci;
    let instability_gradient = state.instability_gradient;

    Ok((snap.tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient))
}

fn run_merge(state_a_input: &[u8], state_b_input: &[u8]) -> Result<(u64, String, f64, f64, String, f64, f64), String> {
    let mut state_a: UniverseState = serde_json::from_slice(state_a_input).map_err(|e| format!("state_a json: {}", e))?;
    let state_b: UniverseState = serde_json::from_slice(state_b_input).map_err(|e| format!("state_b json: {}", e))?;

    state_a.merge(state_b);

    let snap = state_a.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);
    let sci = state_a.sci;
    let instability_gradient = state_a.instability_gradient;

    Ok((snap.tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient))
}

#[tonic::async_trait]
impl SimulationEngine for EngineService {
    async fn advance(
        &self,
        request: Request<AdvanceRequest>,
    ) -> Result<Response<AdvanceResponse>, Status> {
        let req = request.into_inner();
        let state_input = req.state_input.as_slice();
        match run_advance(req.universe_id, req.ticks, state_input, req.world_config) {
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient)) => {
                let snapshot = UniverseSnapshot {
                    universe_id: req.universe_id,
                    tick,
                    state_vector_json,
                    entropy,
                    stability_index,
                    metrics_json,
                    sci,
                    instability_gradient,
                };
                Ok(Response::new(AdvanceResponse {
                    ok: true,
                    error_message: String::new(),
                    snapshot: Some(snapshot),
                }))
            }
            Err(e) => Err(Status::invalid_argument(e)),
        }
    }

    async fn merge(
        &self,
        request: Request<MergeRequest>,
    ) -> Result<Response<MergeResponse>, Status> {
        let req = request.into_inner();
        match run_merge(&req.state_a, &req.state_b) {
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient)) => {
                let snapshot = UniverseSnapshot {
                    universe_id: 0, // Merged result ID handled by Laravel
                    tick,
                    state_vector_json,
                    entropy,
                    stability_index,
                    metrics_json,
                    sci,
                    instability_gradient,
                };
                Ok(Response::new(MergeResponse {
                    ok: true,
                    error_message: String::new(),
                    snapshot: Some(snapshot),
                }))
            }
            Err(e) => Err(Status::invalid_argument(e)),
        }
    }

    async fn observe(
        &self,
        request: Request<ObserveRequest>,
    ) -> Result<Response<ObserveResponse>, Status> {
        let req = request.into_inner();
        match run_observe(req.universe_id, req.zone_index, req.intensity, &req.state_input) {
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient)) => {
                let snapshot = UniverseSnapshot {
                    universe_id: req.universe_id,
                    tick,
                    state_vector_json,
                    entropy,
                    stability_index,
                    metrics_json,
                    sci,
                    instability_gradient,
                };
                Ok(Response::new(ObserveResponse {
                    ok: true,
                    error_message: String::new(),
                    snapshot: Some(snapshot),
                }))
            }
            Err(e) => Err(Status::invalid_argument(e)),
        }
    }
}

#[derive(Debug, Deserialize)]
struct AdvanceHttpRequest {
    universe_id: u64,
    ticks: u64,
    #[serde(default)]
    state_input: Option<String>,
    #[serde(default)]
    world_config: Option<AdvanceHttpWorldConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AdvanceHttpWorldConfig {
    world_id: u64,
    origin: String,
    axiom_json: String,
    world_seed_json: String,
}

#[derive(Debug, Serialize)]
struct AdvanceHttpSnapshot {
    universe_id: u64,
    tick: u64,
    state_vector: String,
    entropy: f64,
    stability_index: f64,
    metrics: String,
    sci: f64,
    instability_gradient: f64,
}

#[derive(Debug, Serialize)]
struct AdvanceHttpResponse {
    ok: bool,
    error_message: String,
    snapshot: Option<AdvanceHttpSnapshot>,
}

async fn advance_http(Json(body): Json<AdvanceHttpRequest>) -> Json<AdvanceHttpResponse> {
    let state_input = body
        .state_input
        .as_deref()
        .unwrap_or("")
        .as_bytes();

    let world_meta = body.world_config.map(|wc| worldos_grpc::WorldConfig {
        world_id: wc.world_id,
        origin: wc.origin,
        axiom_json: wc.axiom_json,
        world_seed_json: wc.world_seed_json,
    });

    match run_advance(body.universe_id, body.ticks, state_input, world_meta) {
        Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient)) => Json(AdvanceHttpResponse {
            ok: true,
            error_message: String::new(),
            snapshot: Some(AdvanceHttpSnapshot {
                universe_id: body.universe_id,
                tick,
                state_vector,
                entropy,
                stability_index,
                metrics,
                sci,
                instability_gradient,
            }),
        }),
        Err(e) => Json(AdvanceHttpResponse {
            ok: false,
            error_message: e,
            snapshot: None,
        }),
    }
}

#[derive(Debug, Deserialize)]
struct ObserveHttpRequest {
    universe_id: u64,
    zone_index: u32,
    intensity: f64,
    state_input: String,
}

async fn observe_http(Json(body): Json<ObserveHttpRequest>) -> Json<AdvanceHttpResponse> {
    match run_observe(body.universe_id, body.zone_index, body.intensity, body.state_input.as_bytes()) {
        Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient)) => Json(AdvanceHttpResponse {
            ok: true,
            error_message: String::new(),
            snapshot: Some(AdvanceHttpSnapshot {
                universe_id: body.universe_id,
                tick,
                state_vector,
                entropy,
                stability_index,
                metrics,
                sci,
                instability_gradient,
            }),
        }),
        Err(e) => Json(AdvanceHttpResponse {
            ok: false,
            error_message: e,
            snapshot: None,
        }),
    }
}
#[derive(Debug, Deserialize)]
struct MergeHttpRequest {
    state_a: String,
    state_b: String,
}

async fn merge_http(Json(body): Json<MergeHttpRequest>) -> Json<AdvanceHttpResponse> {
    match run_merge(body.state_a.as_bytes(), body.state_b.as_bytes()) {
        Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient)) => Json(AdvanceHttpResponse {
            ok: true,
            error_message: String::new(),
            snapshot: Some(AdvanceHttpSnapshot {
                universe_id: 0,
                tick,
                state_vector,
                entropy,
                stability_index,
                metrics,
                sci,
                instability_gradient,
            }),
        }),
        Err(e) => Json(AdvanceHttpResponse {
            ok: false,
            error_message: e,
            snapshot: None,
        }),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let grpc_addr_str = std::env::var("GRPC_ADDR").unwrap_or_else(|_| "0.0.0.0:50051".to_string());
    let http_addr_str = std::env::var("HTTP_ADDR").unwrap_or_else(|_| "0.0.0.0:50052".to_string());
    let grpc_addr: SocketAddr = grpc_addr_str.parse()?;
    let http_addr: SocketAddr = http_addr_str.parse()?;

    let svc = SimulationEngineServer::new(EngineService);
    let grpc_server = tonic::transport::Server::builder().add_service(svc).serve(grpc_addr);

    let http_app = Router::new()
        .route("/advance", post(advance_http))
        .route("/merge", post(merge_http))
        .route("/observe", post(observe_http));
    let http_server = axum::serve(
        tokio::net::TcpListener::bind(http_addr).await?,
        http_app,
    );

    println!("WorldOS simulation engine: gRPC on {}, HTTP on {}", grpc_addr, http_addr);
    let _ = tokio::join!(grpc_server, http_server);
    Ok(())
}
