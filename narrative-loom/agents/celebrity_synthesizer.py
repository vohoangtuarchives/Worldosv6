from core.agent_wrapper import agent_node
from core.logging import get_logger
import json
from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, Any

from utils.llm_factory import get_llm_for_agent

log = get_logger(__name__)

celebrity_prompt = ChatPromptTemplate.from_messages([
    ("system", """Ngươi là Trưởng Ban Tiểu sử Danh nhân (Biographer) của WorldOS.
Nhiệm vụ của ngươi là khoác lên dữ liệu thô (raw data) của một Danh nhân mới sinh ra những câu từ đẹp đẽ nhất.

THÔNG SỐ RAW:
- ID: {agent_id}
- Zone: {zone_id}
- Mức độ nổi tiếng (Fame): {fame}
- Thiên hướng (Vocation): {vocation}
- Kỷ nguyên: {world_era}

YÊU CẦU:
Viết một đoạn tiểu sử ngắn gọn (khoảng 3-4 câu) mô tả nguồn gốc, tính cách, và lý do nhân vật này sẽ thay đổi thế giới. 
Không lặp lại nguyên văn các tham số raw khô khan, hãy dùng ngôn từ văn chương bay bổng. Tên nhân vật hãy tự rèn (forge) một cái tên ngẫu nhiên nhưng nghe rất hùng hồn.
Trả về dữ liệu JSON bao gồm: "name" và "biography".
"""),
    ("human", "Hãy viết tiểu sử cho danh nhân này.")
])

@agent_node("celebrity_synthesizer")

async def synthesize_celebrity(req_data: dict) -> dict:
    llm = get_llm_for_agent("wordsmith", world_id=req_data.get("world_id"))
    structured_llm = llm.with_structured_output(schema={"type": "object", "properties": {"name": {"type": "string"}, "biography": {"type": "string"}}, "required": ["name", "biography"]})
    chain = celebrity_prompt | structured_llm
    
    try:
        result = await chain.ainvoke({
            "agent_id": req_data.get("agent_id"),
            "zone_id": req_data.get("zone_id"),
            "fame": req_data.get("fame"),
            "vocation": req_data.get("vocation"),
            "world_era": req_data.get("world_era", "genesis")
        })
        return result
    except Exception as e:
        log.debug("agent.detail", agent="celebrity_synthesizer", event="synthesize_error", exc=str(e))
        return {"name": "Vô Danh", "biography": "Một sự hiện diện bí ẩn vừa xuất hiện với hành tung bất định."}


@agent_node("celebrity_synthesizer")


async def celebrity_synthesizer_api(req: dict) -> dict:
    """API wrapper called from main.py when /weave-celebrity is hit."""
    return await synthesize_celebrity(req)


