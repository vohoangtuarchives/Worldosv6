//! HTTP transport: axum routes and JSON handlers.

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};

use crate::engine;
use crate::{KernelGenome, TrajectoryPoint, WorldConfig};

// ═══════════════════════════════════════════════════════
// Advance
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct AdvanceHttpRequest {
    pub universe_id: u64,
    pub ticks: u64,
    #[serde(default)]
    pub state_input: Option<serde_json::Value>,
    #[serde(default)]
    pub world_config: Option<AdvanceHttpWorldConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdvanceHttpKernelGenome {
    pub diffusion_rate: f64,
    pub entropy_coefficient: f64,
    pub mutation_rate: f64,
    pub attractor_gravity: f64,
    pub complexity_bonus: f64,
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
pub struct AdvanceHttpWorldConfig {
    pub world_id: u64,
    pub origin: String,
    pub axiom: Option<serde_json::Value>,
    pub world_seed: Option<serde_json::Value>,
    #[serde(default)]
    pub genome: Option<AdvanceHttpKernelGenome>,
}

#[derive(Debug, Serialize)]
pub struct AdvanceHttpSnapshot {
    pub universe_id: u64,
    pub tick: u64,
    pub state_vector: String,
    pub entropy: f64,
    pub stability_index: f64,
    pub metrics: String,
    pub sci: f64,
    pub instability_gradient: f64,
    pub global_fields: String,
}

#[derive(Debug, Serialize)]
pub struct AdvanceHttpResponse {
    pub ok: bool,
    pub error_message: String,
    pub snapshot: Option<AdvanceHttpSnapshot>,
}

async fn advance_http(Json(body): Json<AdvanceHttpRequest>) -> Json<AdvanceHttpResponse> {
    let state_bytes = body
        .state_input
        .as_ref()
        .map(|v| serde_json::to_vec(v).unwrap_or_default())
        .unwrap_or_default();

    let world_meta = body.world_config.map(|wc| {
        let g = wc.genome.unwrap_or_default();
        WorldConfig {
            world_id: wc.world_id,
            origin: wc.origin,
            axiom_json: wc.axiom.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
            world_seed_json: wc.world_seed.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
            genome: Some(KernelGenome {
                diffusion_rate: g.diffusion_rate,
                entropy_coefficient: g.entropy_coefficient,
                mutation_rate: g.mutation_rate,
                attractor_gravity: g.attractor_gravity,
                complexity_bonus: g.complexity_bonus,
            }),
        }
    });

    match engine::run_advance(body.universe_id, body.ticks, &state_bytes, world_meta) {
        Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient, global_fields)) => {
            Json(AdvanceHttpResponse {
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
                    global_fields,
                }),
            })
        }
        Err(e) => Json(AdvanceHttpResponse {
            ok: false,
            error_message: e,
            snapshot: None,
        }),
    }
}

// ═══════════════════════════════════════════════════════
// Observe
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct ObserveHttpRequest {
    pub universe_id: u64,
    pub zone_index: u32,
    pub intensity: f64,
    pub state_input: String,
}

async fn observe_http(Json(body): Json<ObserveHttpRequest>) -> Json<AdvanceHttpResponse> {
    match engine::run_observe(
        body.universe_id,
        body.zone_index,
        body.intensity,
        body.state_input.as_bytes(),
    ) {
        Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient, global_fields)) => {
            Json(AdvanceHttpResponse {
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
                    global_fields,
                }),
            })
        }
        Err(e) => Json(AdvanceHttpResponse {
            ok: false,
            error_message: e,
            snapshot: None,
        }),
    }
}

// ═══════════════════════════════════════════════════════
// Merge
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct MergeHttpRequest {
    pub state_a: String,
    pub state_b: String,
}

async fn merge_http(Json(body): Json<MergeHttpRequest>) -> Json<AdvanceHttpResponse> {
    match engine::run_merge(body.state_a.as_bytes(), body.state_b.as_bytes()) {
        Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient, global_fields)) => {
            Json(AdvanceHttpResponse {
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
                    global_fields,
                }),
            })
        }
        Err(e) => Json(AdvanceHttpResponse {
            ok: false,
            error_message: e,
            snapshot: None,
        }),
    }
}

// ═══════════════════════════════════════════════════════
// BatchAdvance
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct BatchAdvanceHttpRequest {
    pub requests: Vec<AdvanceHttpRequest>,
}

#[derive(Debug, Serialize)]
pub struct BatchAdvanceHttpResponse {
    pub responses: Vec<AdvanceHttpResponse>,
}

async fn batch_advance_http(Json(body): Json<BatchAdvanceHttpRequest>) -> Json<BatchAdvanceHttpResponse> {
    let responses = body
        .requests
        .into_iter()
        .map(|req| {
            let state_bytes = req
                .state_input
                .as_ref()
                .map(|v| serde_json::to_vec(v).unwrap_or_default())
                .unwrap_or_default();

            let world_meta = req.world_config.map(|wc| {
                let g = wc.genome.unwrap_or_default();
                WorldConfig {
                    world_id: wc.world_id,
                    origin: wc.origin,
                    axiom_json: wc.axiom.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
                    world_seed_json: wc.world_seed.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string()),
                    genome: Some(KernelGenome {
                        diffusion_rate: g.diffusion_rate,
                        entropy_coefficient: g.entropy_coefficient,
                        mutation_rate: g.mutation_rate,
                        attractor_gravity: g.attractor_gravity,
                        complexity_bonus: g.complexity_bonus,
                    }),
                }
            });

            match engine::run_advance(req.universe_id, req.ticks, &state_bytes, world_meta) {
                Ok((tick, state_vector, entropy, stability_index, metrics, sci, instability_gradient, global_fields)) => {
                    AdvanceHttpResponse {
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
                            global_fields,
                        }),
                    }
                }
                Err(e) => AdvanceHttpResponse {
                    ok: false,
                    error_message: e,
                    snapshot: None,
                },
            }
        })
        .collect();

    Json(BatchAdvanceHttpResponse { responses })
}

// ═══════════════════════════════════════════════════════
// AnalyzeTrajectory
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct TrajectoryPointHttp {
    pub tick: u64,
    pub state: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct TrajectoryAnalysisHttpRequest {
    pub points: Vec<TrajectoryPointHttp>,
    #[serde(default = "default_threshold")]
    pub recurrence_threshold: f64,
}

fn default_threshold() -> f64 {
    0.1
}

#[derive(Debug, Serialize)]
pub struct RegimeTransitionHttp {
    pub from_tick: u64,
    pub to_tick: u64,
    pub distance: f64,
}

#[derive(Debug, Serialize)]
pub struct TrajectoryAnalysisHttpResponse {
    pub is_bounded: bool,
    pub is_recurrent: bool,
    pub recurrence_rate: f64,
    pub max_lyapunov_estimate: f64,
    pub trajectory_variance: f64,
    pub basin_center: Vec<f64>,
    pub basin_radius: f64,
    pub regime_transitions: Vec<RegimeTransitionHttp>,
}

async fn analyze_trajectory_http(Json(body): Json<TrajectoryAnalysisHttpRequest>) -> Json<TrajectoryAnalysisHttpResponse> {
    let proto_points: Vec<TrajectoryPoint> = body
        .points
        .into_iter()
        .map(|p| TrajectoryPoint {
            tick: p.tick,
            state: p.state,
        })
        .collect();

    let result = engine::run_trajectory_analysis(&proto_points, body.recurrence_threshold);

    Json(TrajectoryAnalysisHttpResponse {
        is_bounded: result.is_bounded,
        is_recurrent: result.is_recurrent,
        recurrence_rate: result.recurrence_rate,
        max_lyapunov_estimate: result.max_lyapunov_estimate,
        trajectory_variance: result.trajectory_variance,
        basin_center: result.basin_center,
        basin_radius: result.basin_radius,
        regime_transitions: result
            .regime_transitions
            .into_iter()
            .map(|t| RegimeTransitionHttp {
                from_tick: t.from_tick,
                to_tick: t.to_tick,
                distance: t.distance,
            })
            .collect(),
    })
}

// ═══════════════════════════════════════════════════════
// Router
// ═══════════════════════════════════════════════════════

pub fn router() -> Router {
    Router::new()
        .route("/advance", post(advance_http))
        .route("/merge", post(merge_http))
        .route("/observe", post(observe_http))
        .route("/batch-advance", post(batch_advance_http))
        .route("/analyze-trajectory", post(analyze_trajectory_http))
}
