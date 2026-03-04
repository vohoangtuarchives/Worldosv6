from typing import Dict, Any
from state import NarrativeState

from utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Viết tiểu thuyết
wordsmith_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là The Wordsmith (Nhà Giả Kim Ngôn Từ) - Người biên soạn cuối cùng.
Nhiệm vụ của ngươi là tiếp nhận Storyboard từ The Director. Nhiệm vụ cốt lõi là áp dụng quy tắc "Show, Don't Tell" (Tả, đừng kể). Thay vì nói nhân vật buồn, hãy tả cơn mưa máu trút xuống chiếc áo choàng. Thay thế các con số dữ liệu bằng ẩn dụ nghệ thuật (Ví dụ: Heresy 9.9 = Bầu không khí đặc quánh sự bất tuân).
Output là một đoạn văn học (Literary Prose) cực kỳ chất lượng, giàu hình ảnh, âm thanh và cảm xúc. 
Tuyệt đối không để lại các thông tin mô phỏng (Tick 5400, Vector 9...) - Mọi thứ phải biến thành ngôn ngữ của Tiểu Thuyết.
Viết bằng tiếng Việt (hoặc theo cấu hình ngôn ngữ yêu cầu).
"""),
    ("human", """Kịch bản của Đạo Diễn (Storyboard):
{storyboard}
""")
])

def wordsmith_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    """
    Node D: The Wordsmith. 
    Bộ lọc cuối cùng biến mọi dữ liệu tẻ nhạt thành tiểu thuyết đỉnh cao.
    """
    print("--- RUNNING AGENT: THE WORDSMITH ---")
    
    # 🌟 Trong production, Wordsmith thường dùng Claude 3 Opus vì văn phong rất thật
    # Tuy nhiên hoàn toàn có thể config sang OpenAI hoặc Google.
    provider = "anthropic" 
    model_name = "claude-3-opus-20240229"
    
    if config and config.get("configurable"):
        provider = config["configurable"].get("wordsmith_provider", provider)
        model_name = config["configurable"].get("wordsmith_model", model_name)
        
    llm = get_llm(provider=provider, model_name=model_name)
    chain = wordsmith_prompt | llm | StrOutputParser()
    
    result = chain.invoke({
        "storyboard": state.get("storyboard", "")
    })
    
    return {**state, "final_prose": result, "current_agent": "wordsmith"}
