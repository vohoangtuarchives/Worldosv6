import os
from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Phóng viên Viết (Staff Writer / Wordsmith)
wordsmith_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là Phóng viên Viết (Staff Writer) của Tòa soạn NarrativeLoom. 
Nhiệm vụ của ngươi là biến Cấu trúc bài viết (Storyboard) từ Thư ký Tòa soạn thành một Bài báo sử thi (Feature Article).
Hãy bám sát "Góc nhìn" (The Angle) và Phong cách (Style Guidelines) được đề ra.
Dùng kỹ thuật "Show, Don't Tell" để bài viết sống động.
"""),
    ("human", """Cấu trúc bài viết (Storyboard):
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
    style_guidelines = state.get("style_guidelines", "Phong cách kể chuyện tự do.")
    chain = wordsmith_prompt | llm | StrOutputParser()
    
    # 🌟 KIỂM TRA XEM ĐÂY CÓ PHẢI LÀ VÒNG REVISION KHÔNG?
    feedback_dict = state.get("feedback", {})
    # Nếu is_passed == False và đã có revision_count > 0, tức là The Critic chê!
    if not feedback_dict.get("is_passed", True) and state.get("revision_count", 0) > 0:
        print("--- THE WORDSMITH IS REVISING CORRUPTED PROSE ---")
        feedbacks = "\n- ".join(feedback_dict.get("feedbacks", []))
        revision_prompt = (
            f"[LỆNH TỪ NHÀ PHÊ BÌNH: BẢN NHÁP CỦA BẠN BỊ TỪ CHỐI]\n\n"
            f"--- BẢN NHÁP CŨ ---\n{state.get('final_prose')}\n\n"
            f"--- LOG LỖI TỪ CRITIC ---\n- {feedbacks}\n\n"
            f"YÊU CẦU ĐỘC ĐOÁN: Dựa trên bản nháp cũ, hãy VIẾT LẠI MỘT PHIÊN BẢN MỚI tinh tế hơn, hùng tráng hơn và tuân thủ tuyệt đối các đóng góp phía trên. Đảm bảo Show, Don't Tell!"
        )
        scene_result = await chain.ainvoke({"storyboard": revision_prompt, "style_guidelines": style_guidelines})
        
        final_prose = scene_result if isinstance(scene_result, str) else str(scene_result.content if hasattr(scene_result, 'content') else scene_result)
        print(f"DEBUG: Wordsmith Revision Completed. Length: {len(final_prose)}")
        return {**state, "final_prose": final_prose, "current_agent": "wordsmith"}
        
    # 🌟 NẾU LÀ LẦN VIẾT ĐẦU TIÊN: Tách storyboard thành từng Scene
    storyboard_data = state.get("storyboard", {})
    
    # fallback
    if isinstance(storyboard_data, str):
        scenes_data = storyboard_data.split("[SCENE]")
    else:
        scenes_data = storyboard_data.get("scenes", [])
        
    chapter_content = []
    
    # Nếu không detect được "Scene", thì fallback lại dùng nguyên cục
    if not scenes_data:
        print("DEBUG: Single-take Wordsmith expansion.")
        result = await chain.ainvoke({"storyboard": str(storyboard_data), "style_guidelines": style_guidelines})
        chapter_content.append(result)
    else:
        print(f"DEBUG: Iterative Wordsmith expansion. Detected {len(scenes_data)} scenes.")
        for i, scene in enumerate(scenes_data):
            if isinstance(scene, str):
                if not scene.strip(): continue
                scene_text = f"[SCENE] {scene}"
            else:
                scene_text = (
                    f"Bối cảnh: {scene.get('setting', '')}\n"
                    f"Góc máy: {scene.get('camera_angle', '')}\n"
                    f"Nhân vật tham gia: {', '.join(str(x) for x in scene.get('involved_characters', []))}\n"
                    f"Mâu thuẫn trung tâm: {scene.get('central_conflict', '')}"
                )
                
            print(f"--- EXPANDING SCENE {i} ---")
            scene_result = await chain.ainvoke({"storyboard": f"Phân cảnh {i+1}:\n{scene_text}", "style_guidelines": style_guidelines})
            chapter_content.append(scene_result)
            print(f"DEBUG: Scene {i} length: {len(scene_result)}")

    final_prose = "\n\n".join(chapter_content)
    print(f"DEBUG: Final Prose Total Length: {len(final_prose)}")
    
    return {**state, "final_prose": final_prose, "current_agent": "wordsmith"}
