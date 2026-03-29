import os
import json
from typing import Dict, Any
from state import NarrativeState
from utils.llm_factory import get_llm, get_llm_for_agent
from nodes.universe_bridge import record_universe_whisper
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class VFXConfig(BaseModel):
    primary_color: str = Field(description="Mã màu Hex (VD: #ff4500 cho Paleo, #00f3ff cho Sci-fi)")
    distortion: float = Field(description="Độ biến dạng thực tại (0.0 - 1.0)")
    particle_density: int = Field(description="Mật độ hạt (40 - 200)")
    atmosphere_filter: str = Field(description="Bộ lọc khí quyển (none, mist, sepia, grain, glitch, aurora, dust)")

# Kỹ thuật viên Hình ảnh (Visual Director) - Người điều phối hiệu ứng trên UI
vfx_director_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là Kỹ thuật viên Hình ảnh (Visual Director) của Đài truyền thông NarrativeLoom. 
Nhiệm vụ của ngươi là thiết lập cấu hình hiệu ứng hình ảnh (VFX) cho Bloom UI dựa trên diễn biến câu chuyện.
Hãy phân tích độ Distortion (biến dạng) và Entropy để quyết định loại hiệu ứng và tông màu phù hợp.
Trả về định dạng JSON thuần túy.
"""),
    ("human", """Thông số mô phỏng:
- Entropy: {entropy}
- Độ biến dạng thực tại (Distortion): {distortion}
- Thể loại (Genre): {genre}
- Tóm tắt câu chuyện: {headline}
""")
])

async def vfx_director_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    print("--- RUNNING AGENT: THE VFX DIRECTOR (VISUAL EFFECTS) ---")
    
    # Lấy thông số từ state
    entropy = state.get("event_scores", {}).get("total_entropy", 0.5)
    distortion = state.get("singularity", {}).get("distortion", 0.0) if isinstance(state.get("singularity"), dict) else 0.0
    genre = state.get("genre", "generic")
    headline = state.get("news_headline", "")
    
    # 🌟 DYNAMIC ROUTING: Chọn mô hình tối ưu cho đạo diễn hình ảnh
    llm = get_llm_for_agent("vfx_director", world_id=state.get("world_id"), current_tick=state.get("tick_end"))
    
    # Sử dụng JsonOutputParser
    parser = JsonOutputParser(pydantic_object=VFXConfig)
    chain = vfx_director_prompt | llm | parser
    
    try:
        result = await chain.ainvoke({
            "entropy": str(entropy),
            "distortion": str(distortion),
            "genre": genre,
            "headline": headline
        })
    except Exception as e:
        print(f"DEBUG: VFX Director error: {e}")
        result = {
            "primary_color": "#8b5cf6",
            "distortion": 0.4,
            "particle_density": 80,
            "atmosphere_filter": "none"
        }
    
    # 🌟 RECORD WHISPER: Ghi lại tiếng vọng đa vũ trụ nếu sự kiện đủ lớn
    record_universe_whisper(state)
    
    return {
        **state, 
        "vfx_config": result, 
        "current_agent": "vfx_director"
    }
