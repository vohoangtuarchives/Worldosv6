import os
from typing import Dict, Any
from state import NarrativeState
from utils.llm_factory import get_llm, get_llm_for_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class NewsHeadline(BaseModel):
    headline: str = Field(description="Tiêu đề giật gân cho bản tin")
    slogan: str = Field(description="Một câu slogan ngắn gọn, súc tích (dưới 15 chữ)")

# Phát thanh viên (News Anchor) - Người truyền tải thông tin cuối cùng
news_anchor_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là Phát thanh viên (News Anchor) của Đài truyền thông Đa vũ trụ NarrativeLoom. 
Nhiệm vụ của ngươi là biến bài viết sử thi từ Phóng viên Viết thành một bản tin "Breaking News" ngắn gọn.
Hãy tạo ra một Tiêu đề (Headline) cực kỳ thu hút và một câu Slogan đại diện cho linh hồn của bản tin này.
Phong cách: Giật gân, súc tích, mang tính chất tin tức thời sự của đa vũ trụ.
Trả về định dạng JSON thuần túy.
"""),
    ("human", """Bài viết sử thi:
{prose}

Góc nhìn tòa soạn (Angle):
{angle}
""")
])

async def news_anchor_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    print("--- RUNNING AGENT: THE NEWS ANCHOR (BROADCASTING) ---")
    
    prose = state.get("final_prose", "")
    angle = state.get("past_memories", "").split("[CHIEF EDITOR ANGLE]:")[-1]
    
    # 🌟 DYNAMIC ROUTING: Chọn mô hình tối ưu cho phát thanh viên
    llm = get_llm_for_agent(
        "news_anchor",
        world_id=state.get("world_id"),
        current_tick=state.get("tick_end"),
        ai_runtime=state.get("ai_runtime"),
    )
    
    # Sử dụng JsonOutputParser để lấy dữ liệu có cấu trúc
    parser = JsonOutputParser(pydantic_object=NewsHeadline)
    chain = news_anchor_prompt | llm | parser
    
    try:
        result = await chain.ainvoke({
            "prose": prose[:2000], # Chỉ lấy đoạn đầu để tiết kiệm token
            "angle": angle
        })
        headline = result.get("headline", "Sự kiện Đa vũ trụ chưa xác định")
        slogan = result.get("slogan", "Mọi thứ đang nở rộ...")
    except Exception as e:
        print(f"DEBUG: News Anchor error: {e}")
        headline = "BREAKING NEWS: SỰ KIỆN LỚN ĐANG DIỄN RA"
        slogan = "Theo dõi để biết thêm chi tiết."
    
    return {
        **state, 
        "news_headline": headline, 
        "news_slogan": slogan, 
        "current_agent": "news_anchor"
    }
