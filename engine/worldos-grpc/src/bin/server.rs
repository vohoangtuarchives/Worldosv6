//! WorldOS V6: gRPC + HTTP server. gRPC on 50051, HTTP bridge on 50052.

use std::net::SocketAddr;
use tonic::{Request, Response, Status};
use worldos_core::{tick_with_cascade, KernelGenome, UniverseState, WorldConfig};
use worldos_grpc::{
    simulation_engine_server::SimulationEngine, simulation_engine_server::SimulationEngineServer, 
    AdvanceRequest, AdvanceResponse, MergeRequest, MergeResponse, 
    ObserveRequest, ObserveResponse, UniverseSnapshot,
    BatchAdvanceRequest, BatchAdvanceResponse,
    TrajectoryAnalysisRequest, TrajectoryAnalysisResponse, TrajectoryPoint, RegimeTransition,
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
            genome: meta.genome.map(|g| KernelGenome {
                diffusion_rate: g.diffusion_rate,
                entropy_coefficient: g.entropy_coefficient,
                mutation_rate: g.mutation_rate,
                attractor_gravity: g.attractor_gravity,
                complexity_bonus: g.complexity_bonus,
            }),
        }
    } else {
        WorldConfig {
            world_id: 0,
            axiom: None,
            world_seed: None,
            origin: "generic".to_string(),
            genome: None,
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

fn run_observe(universe_id: u64, zone_index: u32, intensity: f64, state_input: &[u8]) -> Result<(u64, String, f64, f64, String, f64, f64), String> {
    let mut state: UniverseState = if state_input.is_empty() {
        UniverseState::with_one_zone(universe_id, 100.0)
    } else {
        serde_json::from_slice(state_input).map_err(|e| format!("state_input json: {}", e))?
    };

    // Apply observer effect: boost entropy (disorder) in the observed zone
    if let Some(zone) = state.zones.get_mut(zone_index as usize) {
        zone.state.entropy = (zone.state.entropy + intensity * 0.05).min(1.0);
    }

    let world = WorldConfig {
        world_id: 0,
        origin: "observed".to_string(),
        axiom: None,
        world_seed: None,
        genome: None,
    };

    let _events = tick_with_cascade(&mut state, &world, 4);

    let snap = state.to_snapshot();
    let state_vector_json = serde_json::to_string(&snap.state_vector).unwrap_or_else(|_| "{}".to_string());
    let metrics_json = serde_json::to_string(&snap.metrics).unwrap_or_else(|_| "{}".to_string());
    let entropy = snap.entropy.unwrap_or(0.0);
    let stability_index = snap.stability_index.unwrap_or(0.0);
    let sci = state.sci;
    let instability_gradient = state.instability_gradient;

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

    async fn batch_advance(
        &self,
        request: Request<BatchAdvanceRequest>,
    ) -> Result<Response<BatchAdvanceResponse>, Status> {
        let req = request.into_inner();
        let responses: Vec<AdvanceResponse> = req.requests.into_iter().map(|r| {
            let state_input = r.state_input.as_slice();
            match run_advance(r.universe_id, r.ticks, state_input, r.world_config) {
                Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient)) => {
                    AdvanceResponse {
                        ok: true,
                        error_message: String::new(),
                        snapshot: Some(UniverseSnapshot {
                            universe_id: r.universe_id,
                            tick,
                            state_vector_json,
                            entropy,
                            stability_index,
                            metrics_json,
                            sci,
                            instability_gradient,
                        }),
                    }
                }
                Err(e) => AdvanceResponse {
                    ok: false,
                    error_message: e,
                    snapshot: None,
                },
            }
        }).collect();

        Ok(Response::new(BatchAdvanceResponse { responses }))
    }

    async fn analyze_trajectory(
        &self,
        request: Request<TrajectoryAnalysisRequest>,
    ) -> Result<Response<TrajectoryAnalysisResponse>, Status> {
        let req = request.into_inner();
        let result = run_trajectory_analysis(&req.points, req.recurrence_threshold);
        Ok(Response::new(result))
    }
}

// ═══════════════════════════════════════════════════════
// Trajectory Analysis: Recurrence, Lyapunov, Boundedness
// ═══════════════════════════════════════════════════════

fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

fn run_trajectory_analysis(points: &[TrajectoryPoint], threshold: f64) -> TrajectoryAnalysisResponse {
    let n = points.len();
    if n < 3 {
        return TrajectoryAnalysisResponse {
            is_bounded: true,
            is_recurrent: false,
            recurrence_rate: 0.0,
            max_lyapunov_estimate: 0.0,
            trajectory_variance: 0.0,
            basin_center: vec![],
            basin_radius: 0.0,
            regime_transitions: vec![],
        };
    }

    let threshold = if threshold <= 0.0 { 0.1 } else { threshold };
    let dim = points[0].state.len();

    // 1. Basin center (mean) and radius
    let mut center = vec![0.0f64; dim];
    for p in points.iter() {
        for (i, v) in p.state.iter().enumerate() {
            if i < dim { center[i] += v; }
        }
    }
    for c in center.iter_mut() {
        *c /= n as f64;
    }

    let mut max_dist = 0.0f64;
    for p in points.iter() {
        let d = euclidean_distance(&p.state, &center);
        if d > max_dist { max_dist = d; }
    }

    // 2. Trajectory variance (mean squared distance from center)
    let variance: f64 = points.iter()
        .map(|p| euclidean_distance(&p.state, &center).powi(2))
        .sum::<f64>() / n as f64;

    // 3. Boundedness: all points within 5x mean radius
    let mean_radius = variance.sqrt();
    let is_bounded = max_dist < mean_radius * 5.0 + 0.01;

    // 4. Recurrence analysis (O(n^2) — core heavy computation)
    let mut recurrence_count = 0u64;
    let total_pairs = ((n * (n - 1)) / 2) as u64;

    for i in 0..n {
        for j in (i + 1)..n {
            let d = euclidean_distance(&points[i].state, &points[j].state);
            if d < threshold {
                recurrence_count += 1;
            }
        }
    }

    let recurrence_rate = if total_pairs > 0 {
        recurrence_count as f64 / total_pairs as f64
    } else { 0.0 };

    // Structured recurrence: rate > 5% but < 90% (not converged, not random)
    let is_recurrent = recurrence_rate > 0.05 && recurrence_rate < 0.90;

    // 5. Regime transitions: consecutive points with distance > 2.5x mean step
    let mut step_distances = Vec::with_capacity(n.saturating_sub(1));
    for i in 0..(n - 1) {
        step_distances.push(euclidean_distance(&points[i].state, &points[i + 1].state));
    }
    let mean_step = if !step_distances.is_empty() {
        step_distances.iter().sum::<f64>() / step_distances.len() as f64
    } else { 0.0 };

    let mut transitions = Vec::new();
    for (i, d) in step_distances.iter().enumerate() {
        if *d > mean_step * 2.5 && mean_step > 1e-6 {
            transitions.push(RegimeTransition {
                from_tick: points[i].tick,
                to_tick: points[i + 1].tick,
                distance: *d,
            });
        }
    }

    // 6. Max Lyapunov exponent estimate (nearest-neighbor divergence)
    let lyapunov = estimate_lyapunov(points);

    TrajectoryAnalysisResponse {
        is_bounded,
        is_recurrent,
        recurrence_rate,
        max_lyapunov_estimate: lyapunov,
        trajectory_variance: variance,
        basin_center: center,
        basin_radius: max_dist,
        regime_transitions: transitions,
    }
}

/// Estimate max Lyapunov exponent via nearest-neighbor divergence method.
fn estimate_lyapunov(points: &[TrajectoryPoint]) -> f64 {
    let n = points.len();
    if n < 20 { return 0.0; }

    let look_ahead = 5.min(n / 4);
    let mut divergence_sum = 0.0f64;
    let mut count = 0u32;

    for i in 0..(n - look_ahead) {
        let mut min_dist = f64::MAX;
        let mut nearest_j = 0;

        for j in 0..(n - look_ahead) {
            if (i as isize - j as isize).unsigned_abs() < 3 { continue; }
            let d = euclidean_distance(&points[i].state, &points[j].state);
            if d < min_dist && d > 1e-10 {
                min_dist = d;
                nearest_j = j;
            }
        }

        if min_dist < f64::MAX && nearest_j + look_ahead < n {
            let evolved_dist = euclidean_distance(
                &points[i + look_ahead].state,
                &points[nearest_j + look_ahead].state
            );
            if evolved_dist > 1e-10 && min_dist > 1e-10 {
                divergence_sum += (evolved_dist / min_dist).ln();
                count += 1;
            }
        }
    }

    if count > 0 {
        divergence_sum / (count as f64 * look_ahead as f64)
    } else {
        0.0
    }
}

#[derive(Debug, Deserialize)]
struct AdvanceHttpRequest {
    universe_id: u64,
    ticks: u64,
    #[serde(default)]
    state_input: Option<serde_json::Value>,
    #[serde(default)]
    world_config: Option<AdvanceHttpWorldConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AdvanceHttpKernelGenome {
    diffusion_rate: f64,
    entropy_coefficient: f64,
    mutation_rate: f64,
    attractor_gravity: f64,
    complexity_bonus: f64,
}

impl Default for AdvanceHttpKernelGenome {
    fn default() -> Self {
        Self {
            diffusion_rate: 0.05,
            entropy_coefficient: 1.0,
            mutation_rate: 0.05,
            attractor_gravity: 1.0,
            complexity_bonus: 1.0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct AdvanceHttpWorldConfig {
    world_id: u64,
    origin: String,
    axiom: Option<serde_json::Value>,
    world_seed: Option<serde_json::Value>,
    #[serde(default)]
    genome: Option<AdvanceHttpKernelGenome>,
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
    let state_bytes = body.state_input
        .as_ref()
        .map(|v| serde_json::to_vec(v).unwrap_or_default())
        .unwrap_or_default();

    let world_meta = body.world_config.map(|wc| {
        let g = wc.genome.unwrap_or_default();
        worldos_grpc::WorldConfig {
            world_id: wc.world_id,
            origin: wc.origin,
            axiom_json: wc.axiom.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
            world_seed_json: wc.world_seed.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
            genome: Some(worldos_grpc::KernelGenome {
                diffusion_rate: g.diffusion_rate,
                entropy_coefficient: g.entropy_coefficient,
                mutation_rate: g.mutation_rate,
                attractor_gravity: g.attractor_gravity,
                complexity_bonus: g.complexity_bonus,
            }),
        }
    });

    match run_advance(body.universe_id, body.ticks, &state_bytes, world_meta) {
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

// ═══════════════════════════════════════════════════════
// HTTP: BatchAdvance
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
struct BatchAdvanceHttpRequest {
    requests: Vec<AdvanceHttpRequest>,
}

#[derive(Debug, Serialize)]
struct BatchAdvanceHttpResponse {
    responses: Vec<AdvanceHttpResponse>,
}

async fn batch_advance_http(Json(body): Json<BatchAdvanceHttpRequest>) -> Json<BatchAdvanceHttpResponse> {
    let responses = body.requests.into_iter().map(|req| {
        let state_bytes = req.state_input
            .as_ref()
            .map(|v| serde_json::to_vec(v).unwrap_or_default())
            .unwrap_or_default();

        let world_meta = req.world_config.map(|wc| {
            let g = wc.genome.unwrap_or_default();
            worldos_grpc::WorldConfig {
                world_id: wc.world_id,
                origin: wc.origin,
                axiom_json: wc.axiom.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
                world_seed_json: wc.world_seed.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
                genome: Some(worldos_grpc::KernelGenome {
                    diffusion_rate: g.diffusion_rate,
                    entropy_coefficient: g.entropy_coefficient,
                    mutation_rate: g.mutation_rate,
                    attractor_gravity: g.attractor_gravity,
                    complexity_bonus: g.complexity_bonus,
                }),
            }
        });

        match run_advance(req.universe_id, req.ticks, &state_bytes, world_meta) {
            Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient)) => AdvanceHttpResponse {
                ok: true,
                error_message: String::new(),
                snapshot: Some(AdvanceHttpSnapshot {
                    universe_id: req.universe_id,
                    tick,
                    state_vector,
                    entropy,
                    stability_index,
                    metrics,
                    sci,
                    instability_gradient,
                }),
            },
            Err(e) => AdvanceHttpResponse {
                ok: false,
                error_message: e,
                snapshot: None,
            },
        }
    }).collect();

    Json(BatchAdvanceHttpResponse { responses })
}

// ═══════════════════════════════════════════════════════
// HTTP: AnalyzeTrajectory
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
struct TrajectoryPointHttp {
    tick: u64,
    state: Vec<f64>,
}

#[derive(Debug, Deserialize)]
struct TrajectoryAnalysisHttpRequest {
    points: Vec<TrajectoryPointHttp>,
    #[serde(default = "default_threshold")]
    recurrence_threshold: f64,
}

fn default_threshold() -> f64 { 0.1 }

#[derive(Debug, Serialize)]
struct RegimeTransitionHttp {
    from_tick: u64,
    to_tick: u64,
    distance: f64,
}

#[derive(Debug, Serialize)]
struct TrajectoryAnalysisHttpResponse {
    is_bounded: bool,
    is_recurrent: bool,
    recurrence_rate: f64,
    max_lyapunov_estimate: f64,
    trajectory_variance: f64,
    basin_center: Vec<f64>,
    basin_radius: f64,
    regime_transitions: Vec<RegimeTransitionHttp>,
}

async fn analyze_trajectory_http(Json(body): Json<TrajectoryAnalysisHttpRequest>) -> Json<TrajectoryAnalysisHttpResponse> {
    let proto_points: Vec<TrajectoryPoint> = body.points.into_iter().map(|p| {
        TrajectoryPoint { tick: p.tick, state: p.state }
    }).collect();

    let result = run_trajectory_analysis(&proto_points, body.recurrence_threshold);

    Json(TrajectoryAnalysisHttpResponse {
        is_bounded: result.is_bounded,
        is_recurrent: result.is_recurrent,
        recurrence_rate: result.recurrence_rate,
        max_lyapunov_estimate: result.max_lyapunov_estimate,
        trajectory_variance: result.trajectory_variance,
        basin_center: result.basin_center,
        basin_radius: result.basin_radius,
        regime_transitions: result.regime_transitions.into_iter().map(|t| {
            RegimeTransitionHttp {
                from_tick: t.from_tick,
                to_tick: t.to_tick,
                distance: t.distance,
            }
        }).collect(),
    })
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
        .route("/observe", post(observe_http))
        .route("/batch-advance", post(batch_advance_http))
        .route("/analyze-trajectory", post(analyze_trajectory_http));
    let http_server = axum::serve(
        tokio::net::TcpListener::bind(http_addr).await?,
        http_app,
    );

    println!("WorldOS simulation engine: gRPC on {}, HTTP on {}", grpc_addr, http_addr);
    let _ = tokio::join!(grpc_server, http_server);
    Ok(())
}
