from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional

# Vỏ bối cảnh từ Laravel truyền sang
class WorldContext(BaseModel):
    era: str             # vd: "Medieval Low-Fantasy"
    tech_level: str      # vd: "Swords and Magic, no electricity"
    social_structure: str # vd: "Feudalism, Serfdom"
    communication_method: str # vd: "Town Criers, Ravens, Taverns"
    event_trigger: str   # vd: "The Mad King has been assassinated by a rebel faction."
    agents_count: int = 10 # Số lượng Agent tối đa

# Dữ liệu trả về
class SpawnResponse(BaseModel):
    success: bool
    task_id: str
    message: str

router = APIRouter()

def run_swarm_simulation_task(context: WorldContext):
    # TODO: Tích hợp với oasis_profile_generator và simulation_runner.
    # Trong phiên bản sắp tới, chúng ta sẽ gọi logic của MiroFish ở đây.
    pass

@router.post("/swarm/spawn", response_model=SpawnResponse)
async def spawn_swarm(context: WorldContext, background_tasks: BackgroundTasks):
    try:
        # Chạy giả lập trong Background
        background_tasks.add_task(run_swarm_simulation_task, context)
        
        return SpawnResponse(
            success=True,
            task_id="task_" + str(hash(context.event_trigger)),
            message=f"Đã kích hoạt mô phỏng đám đông cho kỷ nguyên: {context.era} với {context.agents_count} Agents."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
