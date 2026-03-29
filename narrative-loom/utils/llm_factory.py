import os
import redis
import json
from typing import Optional, Any
from langchain.globals import set_llm_cache
from langchain_core.caches import BaseCache
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.cache import RedisCache, RedisSemanticCache
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from utils.cache_manager import cache_manager

class TickBasedCache(BaseCache):
    """LangChain-compatible cache with 80-tick lifespan awareness."""
    def __init__(self, world_id: int, current_tick: int):
        self.world_id = world_id
        self.current_tick = current_tick

    def lookup(self, prompt: str, llm_string: str) -> Optional[Any]:
        # Hash query includes LLM settings (temp, model)
        full_query = f"{llm_string}:{prompt}"
        return cache_manager.get_cached_narrative(self.world_id, self.current_tick, full_query)

    def update(self, prompt: str, llm_string: str, return_val: Any) -> None:
        full_query = f"{llm_string}:{prompt}"
        # We only cache the text content for simplicity in this overlay
        if hasattr(return_val, "content"):
            cache_manager.set_cached_narrative(self.world_id, self.current_tick, full_query, return_val.content)

    def clear(self, **kwargs: Any) -> None:
        cache_manager.invalidate_world_cache(self.world_id)

def get_llm_for_agent(agent_id: str, world_id: int = None, current_tick: int = None) -> BaseChatModel:
    """Dynamic Routing: Trả về LLM phù hợp với cấu hình của từng Agent"""
    config_path = os.path.join(os.path.dirname(__file__), "..", "configs", "agent_routing.json")
    
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            routing = json.load(f)
        
        agent_config = routing.get(agent_id, routing.get("failover"))
        provider = agent_config.get("provider", "openai")
        model = agent_config.get("model")
        
        print(f"DEBUG: Routing Agent '{agent_id}' to {provider} ({model}) - World: {world_id}, Tick: {current_tick}")
        return get_llm(provider=provider, model_name=model, world_id=world_id, current_tick=current_tick)
    except Exception as e:
        print(f"WARNING: Routing failed for '{agent_id}': {e}. Falling back to default provider.")
        return get_llm(provider="openrouter", world_id=world_id, current_tick=current_tick)

def get_llm(provider: str = "openai", model_name: str = None, world_id: int = None, current_tick: int = None) -> BaseChatModel:
    print(f"DEBUG: get_llm called with provider={provider}, model_name={model_name}, world={world_id}, tick={current_tick}")
    provider = provider.lower()

    # Sprint 3.1: Tick-based Cache Overlay
    if world_id is not None and current_tick is not None:
         # Note: This is a thread-safe way in LangChain v0.1+ to set per-request cache if needed, 
         # but for this overlay we use a simpler approach: return LLM with custom cache attached.
         pass
 
    # Sprint 3.1: Semantic Caching (Hybrid - Local Embedding)
    if os.getenv("SEMANTIC_CACHE_ENABLED") == "true":
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
        try:
            # Sử dụng BGE Base (768 dims) để đồng bộ với hệ thống Memory hiện tại (Vietnamese-SBERT 768 dims)
            embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-base-en-v1.5") 
            
            set_llm_cache(RedisSemanticCache(
                redis_url=redis_url,
                embedding=embeddings,
                score_threshold=0.96 # Độ tương đồng cao để tránh hallucination (768 dims)
            ))
        except Exception as e:
            print(f"WARNING: Failed to init semantic cache: {e}. Falling back to standard cache.")
            try:
                set_llm_cache(RedisCache(redis.from_url(redis_url)))
            except:
                pass
    
    if provider == "openai":
        return ChatOpenAI(
            model_name=model_name or "gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY"),
            timeout=20,
            cache=TickBasedCache(world_id, current_tick) if world_id else None
        )
    elif provider == "anthropic":
        return ChatAnthropic(
            model_name=model_name or "claude-3-opus-20240229",
            temperature=0.7,
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            cache=TickBasedCache(world_id, current_tick) if world_id else None
        )
    elif provider == "google":
        return ChatGoogleGenerativeAI(
            model=model_name or "gemini-1.5-pro-latest",
            temperature=0.7,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            cache=TickBasedCache(world_id, current_tick) if world_id else None
        )
    if provider == "local":
        local_url = os.getenv("LOCAL_LLM_URL", "http://localhost:1234").strip().rstrip("/")
        if local_url and not (local_url.startswith("http://") or local_url.startswith("https://")):
            local_url = "http://" + local_url
            
        model = model_name or os.getenv("LOCAL_MODEL_NAME", "qwen3.5-9b-uncensored-hauhaucs-aggressive")
        
        # Nếu là OpenAI-compatible (LM Studio / Ollama v1 endpoint)
        if "/v1" in local_url:
            print(f"DEBUG: Local LLM using OpenAI-compatible API: {local_url}, model={model}")
            return ChatOpenAI(
                base_url=local_url,
                model=model,
                temperature=0.7,
                api_key=os.getenv("OPENAI_API_KEY") or "not-needed",
                timeout=int(os.getenv("LOCAL_LLM_TIMEOUT", "360")),
            )
        
        # Nếu là Custom /api/v1/chat (như yêu cầu của user)
        # Chúng ta dùng CustomLLM wrapper hoặc đơn giản là dùng HTTP client trực tiếp nếu LangChain không hỗ trợ tốt format lạ
        # Tuy nhiên, format user gửi trông giống hệt OpenAI nhưng endpoint là /api/v1/chat thay vì /v1/chat/completions
        # Chúng ta sẽ thử map sang OpenAI ChatOpenAI với base_url điều chỉnh
        
        print(f"DEBUG: Local LLM using Custom Chat API: {local_url}, model={model}")
        return ChatOpenAI(
            base_url=f"{local_url}/api/v1", # Kết quả sẽ là {url}/api/v1/chat/completions
            model=model,
            temperature=0.7,
            api_key="not-needed",
            timeout=int(os.getenv("LOCAL_LLM_TIMEOUT", "360")),
        )
    elif provider == "openrouter":
        or_key = os.getenv("OPENROUTER_API_KEY")
        if not or_key:
            print("WARNING: OPENROUTER_API_KEY missing. Falling back to LOCAL.")
            return get_llm(provider="local", model_name=model_name, world_id=world_id, current_tick=current_tick)
            
        return ChatOpenAI(
            model_name=model_name or "google/gemini-flash-1.5",
            base_url="https://openrouter.ai/api/v1",
            api_key=or_key,
            temperature=0.7,
            timeout=30,
            default_headers={
                "HTTP-Referer": "https://worldos.v6", # Required by OpenRouter
                "X-Title": "WorldOS Narrative Loom"
            },
            cache=TickBasedCache(world_id, current_tick) if world_id else None
        )
    elif provider in ("alibaba", "dashscope", "qwen"):
        # Alibaba DashScope — compatible with OpenAI API format
        dashscope_key = os.getenv("DASHSCOPE_API_KEY", os.getenv("ALIBABA_API_KEY", ""))
        return ChatOpenAI(
            model_name=model_name or "qwen-max",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key=dashscope_key,
            temperature=0.7,
            timeout=20,
            cache=TickBasedCache(world_id, current_tick) if world_id else None
        )
    else:
        raise ValueError(f"Provider {provider} chưa được hỗ trợ.")
