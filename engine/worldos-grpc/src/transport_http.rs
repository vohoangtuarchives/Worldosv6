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
    /// Optional: JSON that deserializes to worldos_core::UniverseState (tick, zones, entropy, global_fields, …). If absent/empty, engine bootstraps one zone.
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
// Evaluate Rules (DSL Rule VM)
// ═══════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct EvaluateRulesHttpRequest {
    /// World state: JSON with paths per WorldOS_DSL_Spec §3 (tick, entropy, stability_index, sci, civilization.*, zones.*, etc.). Laravel builds this via RuleVmService::buildStateForVm(universe, snapshot).
    pub state: serde_json::Value,
    /// Optional DSL text; if empty, VM uses no rules or default embedded rules.
    #[serde(default)]
    pub rules_dsl: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RuleOutputHttp {
    #[serde(rename = "type")]
    pub output_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub adjust_stability_delta: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub adjust_entropy_delta: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub add_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub add_path_delta: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub set_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub set_path_value: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spawn_actor_kind: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct EvaluateRulesHttpResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub outputs: Vec<RuleOutputHttp>,
}

async fn evaluate_rules_http(Json(body): Json<EvaluateRulesHttpRequest>) -> Json<EvaluateRulesHttpResponse> {
    let mut vm = worldos_rules::RuleVm::new();
    if let Some(ref dsl) = body.rules_dsl {
        if !dsl.is_empty() {
            if let Err(e) = vm.load_rules(dsl) {
                return Json(EvaluateRulesHttpResponse {
                    ok: false,
                    error_message: Some(e.to_string()),
                    outputs: vec![],
                });
            }
        }
    }
    let tick = body.state.get("tick").and_then(|v| v.as_u64()).unwrap_or(0);
    let outputs = vm.evaluate(&body.state, tick, None::<&mut rand::rngs::StdRng>, None);
    let outputs_http: Vec<RuleOutputHttp> = outputs
        .into_iter()
        .map(|o| match o {
            worldos_rules::RuleOutput::Event { name, .. } => RuleOutputHttp {
                output_type: "event".to_string(),
                event_name: Some(name),
                adjust_stability_delta: None,
                adjust_entropy_delta: None,
                add_path: None,
                add_path_delta: None,
                set_path: None,
                set_path_value: None,
                spawn_actor_kind: None,
            },
            worldos_rules::RuleOutput::AdjustStability { delta } => RuleOutputHttp {
                output_type: "adjust_stability".to_string(),
                event_name: None,
                adjust_stability_delta: Some(delta),
                adjust_entropy_delta: None,
                add_path: None,
                add_path_delta: None,
                set_path: None,
                set_path_value: None,
                spawn_actor_kind: None,
            },
            worldos_rules::RuleOutput::AdjustEntropy { delta } => RuleOutputHttp {
                output_type: "adjust_entropy".to_string(),
                event_name: None,
                adjust_stability_delta: None,
                adjust_entropy_delta: Some(delta),
                add_path: None,
                add_path_delta: None,
                set_path: None,
                set_path_value: None,
                spawn_actor_kind: None,
            },
            worldos_rules::RuleOutput::AddPath { path, delta } => RuleOutputHttp {
                output_type: "add_path".to_string(),
                event_name: None,
                adjust_stability_delta: None,
                adjust_entropy_delta: None,
                add_path: Some(path),
                add_path_delta: Some(delta),
                set_path: None,
                set_path_value: None,
                spawn_actor_kind: None,
            },
            worldos_rules::RuleOutput::SetPath { path, value } => RuleOutputHttp {
                output_type: "set_path".to_string(),
                event_name: None,
                adjust_stability_delta: None,
                adjust_entropy_delta: None,
                add_path: None,
                add_path_delta: None,
                set_path: Some(path),
                set_path_value: Some(value),
                spawn_actor_kind: None,
            },
            worldos_rules::RuleOutput::SpawnActor { kind } => RuleOutputHttp {
                output_type: "spawn_actor".to_string(),
                event_name: None,
                adjust_stability_delta: None,
                adjust_entropy_delta: None,
                add_path: None,
                add_path_delta: None,
                set_path: None,
                set_path_value: None,
                spawn_actor_kind: Some(kind),
            },
        })
        .collect();
    Json(EvaluateRulesHttpResponse {
        ok: true,
        error_message: None,
        outputs: outputs_http,
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
        .route("/evaluate-rules", post(evaluate_rules_http))
}
