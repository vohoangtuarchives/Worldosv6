from typing import Annotated, TypedDict, List
from pydantic import BaseModel, Field
import operator

class NarrativeState(TypedDict):
    """
    Trạng thái của đồ thị LangGraph được truyền qua lại giữa các Agent.
    """
    world_id: int
    tick_start: int | None
    tick_end: int | None
    
    # Dữ liệu từ WorldOS
    raw_chronicles: List[dict]
    
    # Sản phẩm của Historian
    historical_outline: str
    
    # Sản phẩm của Psychologist (nếu có context về Character)
    psychological_profiles: dict
    
    # Sản phẩm của Director
    storyboard: str
    
    # Sản phẩm cuối cùng của Wordsmith
    final_prose: str
    
    # Các phản hồi/đánh giá kịch bản
    feedback: str
    
    # Biến điều khiển luồng
    current_agent: str
