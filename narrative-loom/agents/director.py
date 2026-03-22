import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from schemas import Storyboard

# Đạo diễn dàn dựng
director_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Director (Đạo Diễn). Khách hàng của ngươi là The Wordsmith (Nhà Văn).
Từ Dàn Ý cốt truyện của Sử Gia (chứa các beats), Bản phân tích nội tâm của Bác Sĩ Tâm Lý và Trạng Thái Thế Giới. Ngươi có nhiệm vụ dàn dựng một STORYBOARD CHI TIẾT gồm nhiều phân cảnh.
Đầu ra của ngươi phải tuân thủ nghiêm ngặt chuẩn định dạng JSON Schema của Storyboard. Không được tạo code block markdown, chỉ cần xuất ra Object đúng chuẩn chứa List các Scenes.
Với mỗi Scene, điền đẩy đủ các thông tin: Bối cảnh không khí, Góc quay camera, Cốt lõi giao tranh, và Các diễn viên.
"""),
    ("human", """Historical Outline:
{outline}
    
Psychological Analysis:
{psychology}

World Topology/State:
{world_state}
""")
])

async def director_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    """
    Node C: The Director. 
    Tổng hợp Outline, Psychology và WorldState để tạo Storyboard kịch tính.
    """
    print("--- RUNNING AGENT: THE DIRECTOR ---")
    
    # Lôi World State từ raw payload (Causal Integrity / Collapse Threat)
    chronicles = state.get("raw_chronicles", [])
    world_state = "Trạng thái màng thực tại ổn định."
    for c in chronicles:
        raw = c.get("raw_payload") or {}
        if isinstance(raw, str):
            import json
            try: raw = json.loads(raw)
            except: raw = {}
        if isinstance(raw, dict) and "context" in raw:
            vm = raw["context"].get("vm_state", {})
            causal = vm.get("causal_integrity")
            collapse = vm.get("collapse_active")
            if causal is not None:
                world_state = f"Độ nguyên vẹn nhân quả (Causal Integrity): {causal}%. Tình trạng sụp đổ (Collapse Active): {collapse}."
                break
    
    provider = "local" # Khuyên dùng GPT-4o cho tác vụ lập dàn ý kịch bản hình ảnh (Spatial Reasoning tốt)
    model_name = os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B")
    
    if config and config.get("configurable"):
        provider = config["configurable"].get("director_provider", provider)
        model_name = config["configurable"].get("director_model", model_name)
        
    llm = get_llm(provider=provider, model_name=model_name)
    structured_llm = llm.with_structured_output(Storyboard)
    chain = director_prompt | structured_llm
    
    # Historian có thể là Dictionary do đã nâng cấp Pydantic bên kia
    outline_data = state.get("historical_outline", {})
    if isinstance(outline_data, dict):
        import json
        outline_str = json.dumps(outline_data, ensure_ascii=False, indent=2)
    else:
        outline_str = str(outline_data)
        
    result = await chain.ainvoke({
        "outline": outline_str,
        "psychology": state.get("psychological_profiles", {}).get("analysis", ""),
        "world_state": world_state
    })
    
    if not result:
        print("DEBUG: Director JSON parsing failed.")
        result_dict = {"title": "Lỗi phân cảnh", "scenes": []}
    else:
        result_dict = result.model_dump()
        
    print(f"DEBUG: Storyboard Scenes Generated: {len(result_dict.get('scenes', []))}")
    
    return {**state, "storyboard": result_dict, "current_agent": "director"}
