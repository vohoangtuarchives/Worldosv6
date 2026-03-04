import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import Dict, Any

from state import NarrativeState
from utils.llm_factory import get_llm

historian_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Historian (Sử Gia) của một hệ thống mô phỏng vũ trụ.
Nhiệm vụ của ngươi là tiếp nhận các dữ liệu sự kiện thô (Raw Chronicles) dưới dạng JSON và biến nó thành một bản dàn ý lịch sử (Historical Outline) súc tích, mạch lạc.
Ngươi không được phép tự sáng tác lời văn bay bổng (hãy để đó cho The Wordsmith). Ngươi chỉ phân tích:
1. Nguyên nhân - Kết quả (Causality)
2. Chủ thể chính yếu (Key Actors)
3. Nghĩa bóng của chuỗi sự kiện đối với sự vận động của vũ trụ (Tích cực, Tiêu cực, Hỗn loạn, Trật tự).

Đầu ra của ngươi phải là một dàn ý Dạng Điểm (Bullet points) hoặc Các mốc sự kiện đánh dấu rõ ràng.
"""),
    ("human", "Dưới đây là Chronicle Payload (Từ Tick {tick_start} đến {tick_end}):\n\n{raw_payload}")
])

def historian_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    """
    Hàm xử lý Node 'The Historian' trong LangGraph. 
    Lấy dữ liệu thô và gọi LLM để viết Historical Outline.
    """
    print("--- RUNNING AGENT: THE HISTORIAN ---")
    
    # 1. Trích xuất Payload từ State
    chronicles = state.get("raw_chronicles", [])
    if not chronicles:
        return {**state, "historical_outline": "Kho lưu trữ trống. Không có sự kiện nào xảy ra."}
    
    tick_start = state.get("tick_start", "N/A")
    tick_end = state.get("tick_end", "N/A")
    
    # Lược bỏ bớt thông tin dư thừa của mảng JSON để nhét vừa Context Window
    optimized_payload = []
    for c in chronicles:
        # Giả định c có cấu trúc trả về từ WorldOS
        optimized_payload.append({
            "tick": c.get("from_tick"),
            "event_type": c.get("type"),
            "payload": c.get("raw_payload", "N/A")
        })
        
    payload_str = json.dumps(optimized_payload, ensure_ascii=False, indent=2)
    
    # 2. Setup Configuration cho LLM (có thể truyền từ config dictionary của LangGraph)
    provider = "openai"
    model_name = "gpt-4o"
    if config and config.get("configurable"):
        provider = config["configurable"].get("historian_provider", provider)
        model_name = config["configurable"].get("historian_model", model_name)
        
    llm = get_llm(provider=provider, model_name=model_name)
    
    # 3. Chains
    chain = historian_prompt | llm | StrOutputParser()
    
    # 4. Thực thi
    result = chain.invoke({
        "tick_start": tick_start,
        "tick_end": tick_end,
        "raw_payload": payload_str
    })
    
    # 5. Cập nhật State
    return {**state, "historical_outline": result, "current_agent": "historian"}
