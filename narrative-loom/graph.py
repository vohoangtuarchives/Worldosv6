from langgraph.graph import StateGraph, END
from state import NarrativeState
from engines.event_normalizer import event_normalizer_node
from engines.entropy_engine import entropy_engine_node
from engines.attractor_engine import attractor_engine_node
from engines.arc_engine import arc_engine_node
from engines.phase_engine import phase_engine_node
from engines.singularity_engine import singularity_engine_node
from agents.historian import historian_agent
from agents.psychologist import psychologist_agent
from agents.director import director_agent
from agents.wordsmith import wordsmith_agent
from agents.critic import critic_agent

# Khởi tạo Graph
workflow = StateGraph(NarrativeState)

# 1. Thêm Nodes
workflow.add_node("Event_Normalizer", event_normalizer_node)
workflow.add_node("Entropy_Engine", entropy_engine_node)
workflow.add_node("Attractor_Engine", attractor_engine_node)
workflow.add_node("Dramatic_Arc", arc_engine_node)
workflow.add_node("Phase_Engine", phase_engine_node)
workflow.add_node("Singularity_Engine", singularity_engine_node)
workflow.add_node("The_Historian", historian_agent)
workflow.add_node("The_Psychologist", psychologist_agent)
workflow.add_node("The_Director", director_agent)
workflow.add_node("The_Wordsmith", wordsmith_agent)
workflow.add_node("The_Critic", critic_agent)

# 2. Tuần tự kết nối
workflow.set_entry_point("Event_Normalizer")

workflow.add_edge("Event_Normalizer", "Entropy_Engine")
workflow.add_edge("Entropy_Engine", "Attractor_Engine")
workflow.add_edge("Attractor_Engine", "Dramatic_Arc")
workflow.add_edge("Dramatic_Arc", "Phase_Engine")
workflow.add_edge("Phase_Engine", "Singularity_Engine")
workflow.add_edge("Singularity_Engine", "The_Historian")
workflow.add_edge("The_Historian", "The_Psychologist")

## Psychologist -> Director (Dàn dựng Storyboard từ Psychology + History)
workflow.add_edge("The_Psychologist", "The_Director")

workflow.add_edge("The_Director", "The_Wordsmith")

workflow.add_edge("The_Wordsmith", "The_Critic")
workflow.add_edge("The_Critic", END)

# Tương lai có thể thêm Edge có Điều Kiện (Conditional Edges): 
# Ví dụ: Nếu Storyboard dở -> Yêu cầu Director viết lại thay vì đi đến Wordsmith.

# Compile the App
app = workflow.compile()
