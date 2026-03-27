import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from schemas import Storyboard

# Thư ký Tòa soạn (Managing Editor / Director)
director_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là Thư ký Tòa soạn (Managing Editor) của Tòa soạn NarrativeLoom. 
Nhiệm vụ của ngươi là tổng hợp các bản tin từ Phóng viên Sử học, Phóng viên Văn hóa và Phóng viên Điều tra để xây dựng một Cấu trúc bài viết (Storyboard).
Hãy bám sát "Góc nhìn" (The Angle) mà Tổng Biên Tập đã đề ra.
Chia nhỏ bài viết thành các phân đoạn (Scenes), xác định bối cảnh, nhân vật và xung đột trung tâm cho mỗi đoạn.
Đầu ra PHẢI tuân thủ nghiêm ngặt chuẩn định dạng JSON Schema của Storyboard.
"""),
    ("human", """Bản tin sử học & Thần thoại:
{outline}
    
Phân tích tâm lý & Động cơ:
{psychology}

Bối cảnh thế giới hiện tại:
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
