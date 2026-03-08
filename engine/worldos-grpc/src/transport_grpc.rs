//! gRPC transport: SimulationEngine implementation.

use tonic::{Request, Response, Status};
use crate::engine;
use crate::simulation_engine_server::SimulationEngine;
use crate::{
    AdvanceRequest, AdvanceResponse, MergeRequest, MergeResponse,
    ObserveRequest, ObserveResponse, UniverseSnapshot,
    BatchAdvanceRequest, BatchAdvanceResponse,
    TrajectoryAnalysisRequest, TrajectoryAnalysisResponse,
};

pub struct EngineService;

#[tonic::async_trait]
impl SimulationEngine for EngineService {
    async fn advance(
        &self,
        request: Request<AdvanceRequest>,
    ) -> Result<Response<AdvanceResponse>, Status> {
        let req = request.into_inner();
        let state_input = req.state_input.as_slice();
        match engine::run_advance(req.universe_id, req.ticks, state_input, req.world_config) {
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, _)) => {
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
        match engine::run_merge(&req.state_a, &req.state_b) {
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, _)) => {
                let snapshot = UniverseSnapshot {
                    universe_id: 0,
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
        match engine::run_observe(req.universe_id, req.zone_index, req.intensity, &req.state_input) {
            Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, _)) => {
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
        let responses: Vec<AdvanceResponse> = req
            .requests
            .into_iter()
            .map(|r| {
                let state_input = r.state_input.as_slice();
                match engine::run_advance(r.universe_id, r.ticks, state_input, r.world_config) {
                    Ok((tick, state_vector_json, entropy, stability_index, metrics_json, sci, instability_gradient, _)) => {
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
            })
            .collect();
        Ok(Response::new(BatchAdvanceResponse { responses }))
    }

    async fn analyze_trajectory(
        &self,
        request: Request<TrajectoryAnalysisRequest>,
    ) -> Result<Response<TrajectoryAnalysisResponse>, Status> {
        let req = request.into_inner();
        let result = engine::run_trajectory_analysis(&req.points, req.recurrence_threshold);
        Ok(Response::new(result))
    }
}
