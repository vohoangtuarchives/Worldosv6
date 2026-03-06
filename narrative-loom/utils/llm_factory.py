import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import SystemMessage
import httpx
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
        local_url = os.getenv("LOCAL_LLM_URL")
        if not local_url:
            local_url = "http://host.docker.internal:1234/v1"
        print(f"DEBUG: Initializing local custom provider: {local_url} with model {model_name}")
        
        @RunnableLambda
        async def custom_lm_studio(prompt_value):
            # Format to the specific api/v1/chat structure
            system_prompt = ""
            inputs = []
            messages = prompt_value.to_messages()
            for msg in messages:
                if isinstance(msg, SystemMessage):
                    system_prompt += msg.content + "\n"
                else:
                    inputs.append(msg.content)
            
            payload = {
                "model": model_name,
                "system_prompt": system_prompt.strip(),
                "input": "\n".join(inputs).strip()
            }
            
            # Change /v1 to /api/v1/chat if needed
            endpoint = local_url.replace("/v1", "/api/v1")
            if not endpoint.endswith("/chat"):
                endpoint = f"{endpoint}/chat"
                
            print(f"DEBUG: Sending custom request to {endpoint} - This may take a while for reasoning models...")
            async with httpx.AsyncClient(timeout=3600.0) as client:
                resp = await client.post(endpoint, json=payload)
                resp.raise_for_status()
                data = resp.json()
                
                # Extract response based on possible formats
                if "output" in data and isinstance(data["output"], list):
                    final_content = ""
                    for item in data["output"]:
                        if item.get("type") == "message":
                            final_content += item.get("content", "")
                    if final_content:
                        return final_content
                        
                if "choices" in data and len(data["choices"]) > 0:
                    msg = data["choices"][0].get("message", {})
                    content = msg.get("content", "")
                    if content: return content
                if "message" in data:
                    if isinstance(data["message"], dict):
                        return data["message"].get("content", "")
                    return data["message"]
                if "response" in data:
                    return data["response"]
                if "reply" in data:
                    return data["reply"]
                
                return str(data)
                
        return custom_lm_studio
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
