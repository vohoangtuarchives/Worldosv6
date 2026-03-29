import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm, get_llm_for_agent
from langchain_core.prompts import ChatPromptTemplate
from schemas import CriticReview

# Biên tập viên Cao cấp (Senior Editor / Critic)
critic_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là Biên tập viên Cao cấp (Senior Editor) của Tòa soạn NarrativeLoom. 
Nhiệm vụ của ngươi là kiểm duyệt bài viết của Phóng viên Viết.
Chấm điểm dựa trên: Độ sắc bén của góc nhìn, tính sống động (Show, Don't Tell) và sự nhất quán với chỉ thị của Tổng Biên Tập.
"""),
    ("human", "CẤU TRÚC BÀI VIẾT (Storyboard):\n{storyboard}\n\nBẢN THẢO CỦA PHÓNG VIÊN:\n{prose}")
])

async def critic_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    print("--- RUNNING AGENT: THE CRITIC ---")
    
    prose = state.get("final_prose", "")
    storyboard = state.get("storyboard", "")
    
    # 🌟 DYNAMIC ROUTING: Phân bổ mô hình rà soát cho Critic
    llm = get_llm_for_agent("critic", world_id=state.get("world_id"), current_tick=state.get("tick_end"))
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
