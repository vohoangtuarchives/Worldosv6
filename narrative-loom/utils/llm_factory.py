import json
import os
from typing import Any, Optional

import redis
from langchain.globals import set_llm_cache
from langchain_community.cache import RedisCache, RedisSemanticCache
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_core.caches import BaseCache
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from utils.cache_manager import cache_manager


class TickBasedCache(BaseCache):
    """LangChain-compatible cache with 80-tick lifespan awareness."""

    def __init__(self, world_id: int, current_tick: int):
        self.world_id = world_id
        self.current_tick = current_tick

    def lookup(self, prompt: str, llm_string: str) -> Optional[Any]:
        full_query = f"{llm_string}:{prompt}"
        return cache_manager.get_cached_narrative(self.world_id, self.current_tick, full_query)

    def update(self, prompt: str, llm_string: str, return_val: Any) -> None:
        full_query = f"{llm_string}:{prompt}"
        if hasattr(return_val, "content"):
            cache_manager.set_cached_narrative(self.world_id, self.current_tick, full_query, return_val.content)

    def clear(self, **kwargs: Any) -> None:
        cache_manager.invalidate_world_cache(self.world_id)


def get_llm_for_agent(
    agent_id: str,
    world_id: int = None,
    current_tick: int = None,
    ai_runtime: dict | None = None,
) -> BaseChatModel:
    """Dynamic routing for internal Narrative Loom agents."""
    runtime = _normalize_ai_runtime(ai_runtime)

    if runtime:
        print(
            f"DEBUG: Routing Agent '{agent_id}' via injected runtime "
            f"{runtime['provider']} ({runtime.get('model_name')}) - World: {world_id}, Tick: {current_tick}"
        )
        return get_llm(
            provider=runtime["provider"],
            model_name=runtime.get("model_name"),
            world_id=world_id,
            current_tick=current_tick,
            api_key=runtime.get("api_key"),
            base_url=runtime.get("base_url"),
        )

    config_path = os.path.join(os.path.dirname(__file__), "..", "configs", "agent_routing.json")

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            routing = json.load(f)

        agent_config = routing.get(agent_id, routing.get("failover", {}))
        provider = agent_config.get("provider", "openai")
        model = agent_config.get("model")

        print(f"DEBUG: Routing Agent '{agent_id}' to {provider} ({model}) - World: {world_id}, Tick: {current_tick}")
        return get_llm(provider=provider, model_name=model, world_id=world_id, current_tick=current_tick)
    except Exception as e:
        print(f"WARNING: Routing failed for '{agent_id}': {e}. Falling back to default provider.")
        return get_llm(provider="openrouter", world_id=world_id, current_tick=current_tick)


def _normalize_ai_runtime(ai_runtime: dict | None) -> dict[str, str] | None:
    if not isinstance(ai_runtime, dict):
        return None

    provider = ai_runtime.get("provider")
    if not isinstance(provider, str) or not provider.strip():
        return None

    runtime: dict[str, str] = {"provider": provider.strip()}

    for key in ("model_name", "api_key", "base_url"):
        value = ai_runtime.get(key)
        if isinstance(value, str) and value.strip():
            runtime[key] = value.strip()

    return runtime


def get_llm(
    provider: str = "openai",
    model_name: str = None,
    world_id: int = None,
    current_tick: int = None,
    api_key: str = None,
    base_url: str = None,
) -> BaseChatModel:
    print(
        f"DEBUG: get_llm called with provider={provider}, model_name={model_name}, "
        f"world={world_id}, tick={current_tick}, has_custom_key={bool(api_key)}"
    )

    provider = provider.lower().strip()
    if provider == "gemini":
        provider = "google"

    effective_api_key = api_key or os.getenv(f"{provider.upper()}_API_KEY") or os.getenv("OPENAI_API_KEY")

    if os.getenv("SEMANTIC_CACHE_ENABLED") == "true":
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
        try:
            embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-base-en-v1.5")
            set_llm_cache(
                RedisSemanticCache(
                    redis_url=redis_url,
                    embedding=embeddings,
                    score_threshold=0.96,
                )
            )
        except Exception as e:
            print(f"WARNING: Failed to init semantic cache: {e}. Falling back to standard cache.")
            try:
                set_llm_cache(RedisCache(redis.from_url(redis_url)))
            except Exception:
                pass

    cache = TickBasedCache(world_id, current_tick) if world_id is not None and current_tick is not None else None

    if provider == "openai":
        return ChatOpenAI(
            model_name=model_name or "gpt-4o",
            temperature=0.7,
            api_key=effective_api_key,
            base_url=base_url,
            timeout=20,
            cache=cache,
        )

    if provider == "zai":
        return ChatOpenAI(
            model_name=model_name or "GLM-4.5-Flash",
            temperature=0.7,
            api_key=effective_api_key or os.getenv("NARRATIVE_LLM_KEY"),
            base_url=base_url or "https://api.z.ai/api/paas/v4",
            timeout=20,
            cache=cache,
        )

    if provider == "anthropic":
        return ChatAnthropic(
            model_name=model_name or "claude-3-opus-20240229",
            temperature=0.7,
            api_key=effective_api_key or os.getenv("ANTHROPIC_API_KEY"),
            cache=cache,
        )

    if provider == "google":
        return ChatGoogleGenerativeAI(
            model=model_name or "gemini-1.5-pro-latest",
            temperature=0.7,
            google_api_key=effective_api_key or os.getenv("GOOGLE_API_KEY"),
            cache=cache,
        )

    if provider == "local":
        local_url = os.getenv("LOCAL_LLM_URL", "http://localhost:1234").strip().rstrip("/")
        if local_url and not (local_url.startswith("http://") or local_url.startswith("https://")):
            local_url = "http://" + local_url

        model = model_name or os.getenv("LOCAL_MODEL_NAME", "qwen3.5-9b-uncensored-hauhaucs-aggressive")

        if "/v1" in local_url:
            print(f"DEBUG: Local LLM using OpenAI-compatible API: {local_url}, model={model}")
            return ChatOpenAI(
                base_url=local_url,
                model=model,
                temperature=0.7,
                api_key=os.getenv("OPENAI_API_KEY") or "not-needed",
                timeout=int(os.getenv("LOCAL_LLM_TIMEOUT", "360")),
            )

        print(f"DEBUG: Local LLM using Custom Chat API: {local_url}, model={model}")
        return ChatOpenAI(
            base_url=f"{local_url}/api/v1",
            model=model,
            temperature=0.7,
            api_key="not-needed",
            timeout=int(os.getenv("LOCAL_LLM_TIMEOUT", "360")),
        )

    if provider == "openrouter":
        or_key = effective_api_key or os.getenv("OPENROUTER_API_KEY")
        if not or_key:
            print("WARNING: OPENROUTER_API_KEY missing. Falling back to LOCAL.")
            return get_llm(provider="local", model_name=model_name, world_id=world_id, current_tick=current_tick)

        return ChatOpenAI(
            model_name=model_name or "google/gemini-flash-1.5",
            base_url=base_url or "https://openrouter.ai/api/v1",
            api_key=or_key,
            temperature=0.7,
            timeout=30,
            default_headers={
                "HTTP-Referer": "https://worldos.v6",
                "X-Title": "WorldOS Narrative Loom",
            },
            cache=cache,
        )

    if provider in ("alibaba", "dashscope", "qwen"):
        dashscope_key = effective_api_key or os.getenv("DASHSCOPE_API_KEY", os.getenv("ALIBABA_API_KEY", ""))
        return ChatOpenAI(
            model_name=model_name or "qwen-max",
            base_url=base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key=dashscope_key,
            temperature=0.7,
            timeout=20,
            cache=cache,
        )

    raise ValueError(f"Provider {provider} chưa được hỗ trợ.")
