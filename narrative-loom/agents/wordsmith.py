import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Viết tiểu thuyết
wordsmith_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Wordsmith (Nhà Giả Kim Ngôn Từ) - Người biên soạn cuối cùng của bộ tiểu thuyết sử thi.
Nhiệm vụ của ngươi là biến STORYBOARD từ Đạo Diễn thành một CHƯƠNG TRUYỆN DÀI (Novel Chapter). 
Quy tắc tối thượng:
1. "Show, Don't Tell" (Tả, đừng kể): Không bao giờ nói "Anh ta tức giận", hãy tả "Gân xanh nổi lên trên vầng thái dương của hắn, những ngón tay siết chặt đến mức móng tay găm sâu vào lòng bàn tay".
2. Khai triển chi tiết: Mỗi phân cảnh (Scene) trong Storyboard phải được triển khai ít nhất 3-5 đoạn văn dài. 
3. Loại bỏ dữ liệu thô: Không nhắc đến Tick, Vector hay các thuật ngữ máy tính. Mọi thứ phải thấm đẫm phong cách văn học.
Viết bằng tiếng Việt (hoặc theo cấu hình ngôn ngữ yêu cầu). Hãy viết thật dài, thật sâu, và thật hùng tráng.
"""),
    ("human", """Kịch bản của Đạo Diễn (Storyboard):
{storyboard}
""")
])

async def wordsmith_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    """
    Node D: The Wordsmith. 
    Bộ lọc cuối cùng biến mọi dữ liệu tẻ nhạt thành tiểu thuyết đỉnh cao.
    """
    print("--- RUNNING AGENT: THE WORDSMITH ---")
    
    # 🌟 Trong production, Wordsmith thường dùng Claude 3 Opus vì văn phong rất thật
    # Tuy nhiên hoàn toàn có thể config sang OpenAI hoặc Google.
    provider = "local" 
    model_name = os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B")
    print(f"DEBUG: Wordsmith Agent using provider={provider}, model={model_name}")
        
    llm = get_llm(provider=provider, model_name=model_name)
    chain = wordsmith_prompt | llm | StrOutputParser()
    
    # 🌟 CHIẾN THUẬT MỚI: Tách storyboard thành từng Scene và expand riêng biệt
    storyboard = state.get("storyboard", "")
    scenes = storyboard.split("Scene")
    
    chapter_content = []
    
    # Nếu không detect được "Scene", thì fallback lại dùng nguyên cục
    if len(scenes) <= 1:
        print("DEBUG: Single-take Wordsmith expansion.")
        result = await chain.ainvoke({"storyboard": storyboard})
        chapter_content.append(result)
    else:
        print(f"DEBUG: Iterative Wordsmith expansion. Detected {len(scenes)-1} potential scenes.")
        for i, scene_text in enumerate(scenes):
            if not scene_text.strip(): continue
            print(f"--- EXPANDING SCENE {i} ---")
            scene_result = await chain.ainvoke({"storyboard": f"Scene {scene_text}"})
            chapter_content.append(scene_result)
            print(f"DEBUG: Scene {i} length: {len(scene_result)}")

    final_prose = "\n\n".join(chapter_content)
    print(f"DEBUG: Final Prose Total Length: {len(final_prose)}")
    
    return {**state, "final_prose": final_prose, "current_agent": "wordsmith"}
