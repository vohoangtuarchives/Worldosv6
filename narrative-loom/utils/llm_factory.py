import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel

def get_llm(provider: str = "openai", model_name: str = None) -> BaseChatModel:
    """
    Khởi tạo LLM dựa trên Provider và Model Name.
    Hỗ trợ OpenAI, Anthropic, Google, và Local (thông qua OpenAI thay đổi base_url).
    """
    provider = provider.lower()
    
    if provider == "openai":
        return ChatOpenAI(
            model_name=model_name or "gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
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
    elif provider == "local":
        # Sử dụng OpenAI client trỏ về local endpoint (e.g. LM Studio, Ollama)
        local_url = os.getenv("LOCAL_LLM_URL", "http://localhost:1234/v1")
        return ChatOpenAI(
            model_name=model_name or "local-model",
            base_url=local_url,
            api_key="not-needed",
            temperature=0.7
        )
    else:
        raise ValueError(f"Provider {provider} chưa được hỗ trợ.")
