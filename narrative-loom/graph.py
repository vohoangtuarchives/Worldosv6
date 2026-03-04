from langgraph.graph import StateGraph, END
from state import NarrativeState

from agents.historian import historian_agent
from agents.psychologist import psychologist_agent
from agents.director import director_agent
from agents.wordsmith import wordsmith_agent

# Khởi tạo Graph
workflow = StateGraph(NarrativeState)

# 1. Thêm Nodes
workflow.add_node("The_Historian", historian_agent)
workflow.add_node("The_Psychologist", psychologist_agent)
workflow.add_node("The_Director", director_agent)
workflow.add_node("The_Wordsmith", wordsmith_agent)

# 2. Tuần tự kết nối
## Entrypoint -> Historian
workflow.set_entry_point("The_Historian")

## Historian -> Psychologist (Cung cấp dàn ý và bối cảnh tâm lý)
workflow.add_edge("The_Historian", "The_Psychologist")

## Psychologist -> Director (Dàn dựng Storyboard từ Psychology + History)
workflow.add_edge("The_Psychologist", "The_Director")

## Director -> Wordsmith (Chắp bút thành prose)
workflow.add_edge("The_Director", "The_Wordsmith")

## Wordsmith -> KẾT THÚC (Tương lai có thể cắm thêm node Reviewer để sửa vòng lại nếu chưa đạt)
workflow.add_edge("The_Wordsmith", END)

# Tương lai có thể thêm Edge có Điều Kiện (Conditional Edges): 
# Ví dụ: Nếu Storyboard dở -> Yêu cầu Director viết lại thay vì đi đến Wordsmith.

# Compile the App
app = workflow.compile()
