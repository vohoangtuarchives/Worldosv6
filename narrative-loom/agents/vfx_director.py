import os
import json
from typing import Dict, Any
from state import NarrativeState
from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class VFXConfig(BaseModel):
    effect_type: str = Field(description="Loại hiệu ứng (glitch, ripples, bloom_glow, static, vortex)")
    intensity: float = Field(description="Cường độ hiệu ứng (0.0 - 1.0)")
    color_scheme: str = Field(description="Tông màu (neon, dark, ethereal, solar, chaotic)")
    bloom_pollen_type: str = Field(description="Loại hạt phấn (sparkles, ash, geometric, organic)")

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
    
    provider = "local"
    model_name = os.getenv("LOCAL_MODEL_NAME", "qwen3.5-9b-uncensored-hauhaucs-aggressive")
    llm = get_llm(provider=provider, model_name=model_name)
    
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
            "effect_type": "bloom_glow",
            "intensity": 0.5,
            "color_scheme": "ethereal",
            "bloom_pollen_type": "sparkles"
        }
    
    return {
        **state, 
        "vfx_config": result, 
        "current_agent": "vfx_director"
    }
