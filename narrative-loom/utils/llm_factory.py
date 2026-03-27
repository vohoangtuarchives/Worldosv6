import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel

def get_llm(provider: str = "openai", model_name: str = None) -> BaseChatModel:
    print(f"DEBUG: get_llm called with provider={provider}, model_name={model_name}")
    provider = provider.lower()
    
    if provider == "openai":
        return ChatOpenAI(
            model_name=model_name or "gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY"),
            timeout=20
        )
    elif provider == "anthropic":
        return ChatAnthropic(
            model_name=model_name or "claude-3-opus-20240229",
            temperature=0.7,
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
    elif provider == "google":
        return ChatGoogleGenerativeAI(
            model=model_name or "gemini-1.5-pro-latest",
            temperature=0.7,
            google_api_key=os.getenv("GOOGLE_API_KEY")
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
    elif provider in ("alibaba", "dashscope", "qwen"):
        # Alibaba DashScope — compatible with OpenAI API format
        dashscope_key = os.getenv("DASHSCOPE_API_KEY", os.getenv("ALIBABA_API_KEY", ""))
        return ChatOpenAI(
            model_name=model_name or "qwen-max",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key=dashscope_key,
            temperature=0.7,
            timeout=20
        )
    else:
        raise ValueError(f"Provider {provider} chưa được hỗ trợ.")
