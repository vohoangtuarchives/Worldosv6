import json
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import Dict, Any

from state import NarrativeState
from utils.llm_factory import get_llm

historian_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Historian (Sử Gia) của một hệ thống mô phỏng vũ trụ.
Nhiệm vụ của ngươi là tiếp nhận các dữ liệu sự kiện thô (Raw Chronicles) dưới dạng JSON và biến nó thành một bản dàn ý lịch sử (Historical Outline) sâu sắc.
Ngươi không được phép tự sáng tác lời văn bay bổng (hãy để đó cho The Wordsmith). Ngươi phải phân tích:
1. Nguyên nhân - Kết quả (Causality): Tại sao sự kiện này dẫn tới sự kiện kia?
2. 5-8 Mốc sự kiện chính (Narrative Beats): Chia nhỏ chuỗi dữ liệu thành các "nhịp" truyện cụ thể để chuẩn bị cho việc dàn cảnh.
3. Tầm vóc (Scale): Đánh giá tầm ảnh hưởng của sự kiện đối với nền văn minh (Tích cực, Tiêu cực, Hỗn loạn, Trật tự).

Đầu ra của ngươi phải là một dàn ý Dạng Điểm (Bullet points) chi tiết, mỗi điểm là một "nhịp" (beat) sẵn sàng để chuyển thể thành cảnh phim.
"""),
    ("human", "Dưới đây là Chronicle Payload (Từ Tick {tick_start} đến {tick_end}):\n\n{raw_payload}")
])

async def historian_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
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
            "content": c.get("content", "N/A"),
            "payload": c.get("raw_payload", "N/A")
        })
        
    payload_str = json.dumps(optimized_payload, ensure_ascii=False, indent=2)
    
    # 2. Setup Configuration cho LLM - FORCED TO LOCAL
    provider = "local"
    model_name = os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B")
    print(f"DEBUG: Historian Agent using provider={provider}, model={model_name}")
        
    llm = get_llm(provider=provider, model_name=model_name)
    
    # 3. Chains
    chain = historian_prompt | llm | StrOutputParser()
    
    # 4. Thực thi
    result = await chain.ainvoke({
        "tick_start": tick_start,
        "tick_end": tick_end,
        "raw_payload": payload_str
    })

    # 🌟 NEW: Loại bỏ khối <think> nếu mô hình reasoning (như Qwen2.5) trả về
    if "<think>" in result and "</think>" in result:
        import re
        result = re.sub(r'<think>.*?</think>', '', result, flags=re.DOTALL).strip()
    
    print(f"DEBUG: Historian Outline Length (Stripped): {len(result)}")
    
    # 5. Cập nhật State
    return {**state, "historical_outline": result, "current_agent": "historian"}
