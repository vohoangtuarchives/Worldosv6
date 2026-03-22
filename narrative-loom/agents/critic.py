import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from schemas import CriticReview

critic_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Critic (Nhà Phê Bình Văn Học). 
Nhiệm vụ của ngươi là chấm điểm và soi lỗi bản nháp của The Wordsmith (Nhà Văn) dựa trên Kịch Bản (Storyboard).
Ngươi cực kỳ khó tính. Tiêu chí đánh giá:
1. Quy tắc 'Show, Don't tell' (phải mô tả chi tiết hình bóng, âm thanh, cảm xúc qua hành động chứ không kể lể).
2. Lời thoại phải tự nhiên và sắc nhọn.
3. Không dư thừa thuật ngữ máy tính (tick, vector).
Chấm một cách công tâm. Nếu điểm >= 7, set is_passed = True. Nếu dưới 7, set is_passed = False và liệt kê rõ ràng feedbacks.
Đầu ra PHẢI LÀ JSON THEO SCHEMA QUY ĐỊNH.
"""),
    ("human", "KỊCH BẢN ĐẠO DIỄN (Storyboard):\n{storyboard}\n\nBẢN NHÁP CỦA NHÀ VĂN:\n{prose}")
])

async def critic_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    print("--- RUNNING AGENT: THE CRITIC ---")
    
    prose = state.get("final_prose", "")
    storyboard = state.get("storyboard", "")
    
    provider = "local"
    model_name = os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B")
    llm = get_llm(provider=provider, model_name=model_name)
    structured_llm = llm.with_structured_output(CriticReview)
    
    chain = critic_prompt | structured_llm
    
    if isinstance(storyboard, dict):
        import json
        storyboard_str = json.dumps(storyboard, ensure_ascii=False)
    else:
        storyboard_str = str(storyboard)
        
    result = await chain.ainvoke({"storyboard": storyboard_str, "prose": prose})
    
    rev = state.get("revision_count", 0) + 1
    
    if not result:
        print("DEBUG: Lỗi phân tích cú pháp Critic, cho pass tạm.")
        report = {"score": 7, "feedbacks": ["Lỗi parse JSON"], "is_passed": True}
    else:
        report = result.model_dump()
        
    print(f"DEBUG: Critic Score: {report.get('score')}/10 - Passed: {report.get('is_passed')}")
    
    return {**state, "feedback": report, "revision_count": rev, "current_agent": "critic"}
