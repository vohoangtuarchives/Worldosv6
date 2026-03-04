from typing import Dict, Any
from state import NarrativeState
import httpx
import os

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Phân tích tâm lý nhân vật
psychologist_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Psychologist (Nhà Tâm Lý Học).
Nhiệm vụ của ngươi là tiếp nhận Dàn Ý Lịch Sử (Historical Outline) từ The Historian cùng với Hồ Sơ Nhân Vật (Character Profiles) lấy từ hệ thống.
Từ đó, ngươi sẽ điền Động Lực (Motivations), Nỗi Sợ (Fears), và Trạng Thái Tinh Thần (Mental State) vào những kẻ đang tham gia trong sự kiện này.
Tuyệt đối không viết chuyện, vẫn chỉ tập trung phân tích dưới góc nhìn lâm sàng.
(VD: Nhân vật A hành động tàn bạo vì TraitVector của hắn có chỉ số Sadism 80% do bị giam giữ 500 tick).
"""),
    ("human", """Historical Outline:
{outline}
    
Profiles (JSON):
{profiles}
""")
])

async def psychologist_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    """
    Node B: The Psychologist. 
    Lấy thông tin Outline và gọi Character API từ WorldOS để fetch profiles.
    """
    print("--- RUNNING AGENT: THE PSYCHOLOGIST ---")
    
    outline = state.get("historical_outline", "")
    
    # 1. Quét tìm các Character ID tiềm năng từ Outline (Giả sử sử dụng Regex hoặc NER để lấy danh sách Agent id, ở đây dùng placeholder flow)
    # Trong thực tế, Historian nên return một mảng "involved_agents" trong JSON
    # Hiện tại chúng ta giả lập data hoặc gọi thử 1 ID tùy ý
    
    # GỌI API WORLDOS: /api/loom/v1/narrative/characters/{id}
    # backend_url = os.getenv("WORLDOS_API_URL", "http://backend:9000/api")
    # fetched_profiles = {}
    # async with httpx.AsyncClient() as client:
    #    ... fetch ...
    
    fetched_profiles = {"mocked": "Character data will be injected here using API"}
    
    # 2. Xử lý thông qua LLM
    provider = "anthropic" # Default The Psychologist uses Anthropic for better analytical reasoning
    model_name = "claude-3-opus-20240229"
    
    if config and config.get("configurable"):
        provider = config["configurable"].get("psychologist_provider", provider)
        model_name = config["configurable"].get("psychologist_model", model_name)
        
    llm = get_llm(provider=provider, model_name=model_name)
    chain = psychologist_prompt | llm | StrOutputParser()
    
    result = chain.invoke({
        "outline": outline,
        "profiles": str(fetched_profiles)
    })
    
    return {
        **state,
        "psychological_profiles": {"analysis": result},
        "current_agent": "psychologist"
    }
