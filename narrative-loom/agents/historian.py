import json
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import Dict, Any

from state import NarrativeState
from utils.llm_factory import get_llm
from schemas import HistoricalOutline
from utils.memory_manager import EpisodicMemoryManager

memory_db = EpisodicMemoryManager()

historian_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Historian (Sử Gia) của một hệ thống mô phỏng vũ trụ.
Nhiệm vụ của ngươi là tiếp nhận các dữ liệu sự kiện thô dưới dạng JSON và biến nó thành một bản dàn ý lịch sử sâu sắc.
Hãy tham khảo KÝ ỨC LỊCH SỬ (Past Memories) để kết nối nhân quả các sự kiện quá khứ với hiện tại.
Ngươi không được phép tự sáng tác lời văn bay bổng (hãy để đó cho The Wordsmith). Ngươi phải phân tích:
1. Nguyên nhân - Kết quả (Causality): Tại sao sự kiện này dẫn tới sự kiện kia?
2. 5-8 Mốc sự kiện chính (Narrative Beats): Chia nhỏ chuỗi dữ liệu thành các "nhịp" truyện cụ thể để chuẩn bị cho việc dàn cảnh.
Đầu ra của ngươi tuân thủ nghiêm ngặt Schema JSON quy định.
"""),
    ("human", "Dưới đây là Chronicle Payload (Từ Tick {tick_start} đến {tick_end}):\n\n{raw_payload}\n\nKÝ ỨC LỊCH SỬ LIÊN QUAN (Past Memories):\n{past_memories}")
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
    max_events = 100
    if len(chronicles) > max_events:
        chronicles_to_process = chronicles[:20] + chronicles[-(max_events-20):]
    else:
        chronicles_to_process = chronicles
        
    optimized_payload = []
    for c in chronicles_to_process:
        raw_payload = c.get("raw_payload") or {}
        if isinstance(raw_payload, str):
            try:
                raw_payload = json.loads(raw_payload)
            except:
                raw_payload = {}
        
        # The Historian is "blind" to math. Only extract high-level blurred intent.
        blurred_data = raw_payload
        if isinstance(raw_payload, dict) and "context" in raw_payload:
            ctx = raw_payload.get("context", {})
            blurred_data = {
                "action": ctx.get("action"),
                "intent": ctx.get("intent"),
                "archetype": ctx.get("archetype")
            }

        optimized_payload.append({
            "tick": c.get("from_tick"),
            "type": c.get("type"),
            "event_summary": blurred_data
        })
        
    payload_str = json.dumps(optimized_payload, ensure_ascii=False, indent=2)
    
    # 2. Setup Configuration cho LLM - FORCED TO LOCAL
    provider = "local"
    model_name = os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B")
    print(f"DEBUG: Historian Agent using provider={provider}, model={model_name}")
        
    llm = get_llm(provider=provider, model_name=model_name)
    
    # Tích hợp Trí Nhớ Voi (Episodic Memory)
    events = state.get("normalized_events", [])
    actors = set()
    for e in events:
        for a in e.get("actors", []):
            actors.add(str(a))
            
    if actors and memory_db.enabled:
        query = f"Hậu quả nhân quả và diễn biến của các nhân vật: {', '.join(list(actors)[:10])}"
        memories = memory_db.retrieve_memories(query, k=2)
        past_memories = "\n---\n".join(memories) if memories else "Chưa có ký ức nào được ghi nhận trong Vector DB."
        print(f"DEBUG: Historian retrieved {len(memories)} past memories.")
    else:
        past_memories = "Hệ thống Memory Database đang tắt hoặc không có nhân vật nào đáng chú ý."

    # 3. Chains - Sử dụng Pydantic Structured Outputs
    structured_llm = llm.with_structured_output(HistoricalOutline)
    chain = historian_prompt | structured_llm
    
    # 4. Thực thi
    result = await chain.ainvoke({
        "tick_start": tick_start,
        "tick_end": tick_end,
        "raw_payload": payload_str,
        "past_memories": past_memories
    })

    if not result:
        print("DEBUG: Lỗi cấu trúc JSON từ LLM, fallback về trạng thái rỗng.")
        outline_data = {"summary": "Lỗi phân tích cú pháp JSON.", "beats": []}
    else:
        outline_data = result.model_dump()
    
    print(f"DEBUG: Historian Outline Length (Parsed Beats): {len(outline_data.get('beats', []))}")
    
    # 5. Cập nhật State
    return {**state, "historical_outline": outline_data, "past_memories": past_memories, "current_agent": "historian"}
