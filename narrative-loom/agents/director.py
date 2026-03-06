import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Đạo diễn dàn dựng
director_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Director (Đạo Diễn). Khách hàng của ngươi là The Wordsmith (Nhà Văn).
Từ Dàn Ý cốt truyện của Sử Gia (5-8 beats), Bản phân tích nội tâm của Bác Sĩ Tâm Lý và Trạng Thái Thế Giới. Ngươi có nhiệm vụ dàn dựng một STORYBOARD CHI TIẾT gồm nhiều phân cảnh.
Với mỗi Beat từ Sử Gia, hãy tạo ra 1 phân cảnh (Scene):
1. Bối cảnh & Không khí: Thời tiết, ánh sáng, mùi vị, âm thanh nền (VD: Tiếng gió hú qua khe đá).
2. Góc máy & Nhịp điệu: Mô tả cách "quay" cảnh đó (VD: Cận cảnh đôi mắt run rẩy, sau đó là cú máy toàn cảnh bao quát đại quân).
3. Mâu thuẫn trung tâm: Hành động chính diễn ra trong cảnh.
Đầu ra của ngươi phải là một bản phân cảnh chi tiết (Storyboard) sẵn sàng để Nhà Văn triển khai thành văn chương.
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
    
    # Kéo Snapshot Vĩ mô (Ví dụ gọi API WorldState để lấy Topology/Entropy/Zones)
    world_state = "Data will be injected here via WorldState Loom API"
    
    provider = "local" # Khuyên dùng GPT-4o cho tác vụ lập dàn ý kịch bản hình ảnh (Spatial Reasoning tốt)
    model_name = os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B")
    
    if config and config.get("configurable"):
        provider = config["configurable"].get("director_provider", provider)
        model_name = config["configurable"].get("director_model", model_name)
        
    llm = get_llm(provider=provider, model_name=model_name)
    chain = director_prompt | llm | StrOutputParser()
    
    result = await chain.ainvoke({
        "outline": state.get("historical_outline", ""),
        "psychology": state.get("psychological_profiles", {}).get("analysis", ""),
        "world_state": world_state
    })
    
    print(f"DEBUG: Storyboard Length: {len(result)}")
    
    return {**state, "storyboard": result, "current_agent": "director"}
