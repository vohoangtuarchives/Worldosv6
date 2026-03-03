//! WorldOS V6: gRPC + HTTP server. gRPC on 50051, HTTP bridge on 50052.

use std::net::SocketAddr;
use tonic::{Request, Response, Status};
use worldos_core::{tick_with_cascade, UniverseState, WorldConfig};
use worldos_grpc::{
    simulation_engine_server::SimulationEngine, simulation_engine_server::SimulationEngineServer, AdvanceRequest, AdvanceResponse, UniverseSnapshot,
};

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};

struct EngineService;

fn run_advance(universe_id: u64, ticks: u64, state_input: &[u8], world_meta: Option<worldos_grpc::WorldConfig>) -> Result<(u64, String, f64, f64, String), String> {
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

    for _ in 0..ticks {
        tick_with_cascade(&mut state, &world, 4);
    }

    let snap = state.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);

    Ok((snap.tick, state_vector_json, entropy, stability_index, metrics_json))
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
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json)) => {
                let snapshot = UniverseSnapshot {
                    universe_id: req.universe_id,
                    tick,
                    state_vector_json,
                    entropy,
                    stability_index,
                    metrics_json,
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
        Ok((tick, state_vector, entropy, stability_index, metrics)) => Json(AdvanceHttpResponse {
            ok: true,
            error_message: String::new(),
            snapshot: Some(AdvanceHttpSnapshot {
                universe_id: body.universe_id,
                tick,
                state_vector,
                entropy,
                stability_index,
                metrics,
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

    let http_app = Router::new().route("/advance", post(advance_http));
    let http_server = axum::serve(
        tokio::net::TcpListener::bind(http_addr).await?,
        http_app,
    );

    println!("WorldOS simulation engine: gRPC on {}, HTTP on {}", grpc_addr, http_addr);
    let _ = tokio::join!(grpc_server, http_server);
    Ok(())
}
