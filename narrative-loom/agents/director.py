from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Đạo diễn dàn dựng
director_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Director (Đạo Diễn). Khách hàng của ngươi là The Wordsmith (Nhà Văn).
Từ Dàn Ý cốt truyện của Sử Gia, Bản phân tích nội tâm của Bác Sĩ Tâm Lý và Trạng Thái Thế Giới (Global Snapshot). Ngươi có nhiệm vụ dàn cảnh 1 kịch bản storyboard.
Chọn bối cảnh thời gian (Ngày/đêm, thời tiết hỗn loạn hay trật tự). Đặt một góc máy quay cụ thể: "Close-up vào giọt mồ hôi của nhân vật", "Wide-shot bao quát vùng tàn tích".
Chỉ ra những hình tượng và mâu thuẫn (nhân vật A vs Thực tại B). 
Đầu ra của ngươi như một Kịch Bản Phim (Storyboard) cho 1 cảnh (Scene) hoàn chỉnh.
"""),
    ("human", """Historical Outline:
{outline}
    
Psychological Analysis:
{psychology}

World Topology/State:
{world_state}
""")
])

def director_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    """
    Node C: The Director. 
    Tổng hợp Outline, Psychology và WorldState để tạo Storyboard kịch tính.
    """
    print("--- RUNNING AGENT: THE DIRECTOR ---")
    
    # Kéo Snapshot Vĩ mô (Ví dụ gọi API WorldState để lấy Topology/Entropy/Zones)
    world_state = "Data will be injected here via WorldState Loom API"
    
    provider = "openai" # Khuyên dùng GPT-4o cho tác vụ lập dàn ý kịch bản hình ảnh (Spatial Reasoning tốt)
    model_name = "gpt-4o"
    
    if config and config.get("configurable"):
        provider = config["configurable"].get("director_provider", provider)
        model_name = config["configurable"].get("director_model", model_name)
        
    llm = get_llm(provider=provider, model_name=model_name)
    chain = director_prompt | llm | StrOutputParser()
    
    result = chain.invoke({
        "outline": state.get("historical_outline", ""),
        "psychology": state.get("psychological_profiles", {}).get("analysis", ""),
        "world_state": world_state
    })
    
    return {**state, "storyboard": result, "current_agent": "director"}
