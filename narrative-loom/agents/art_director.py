from core.agent_wrapper import agent_node
import os
import httpx
from typing import Optional

@agent_node("art_director")

async def generate_visual_asset(prompt_text: str, is_portrait: bool = True) -> Optional[str]:
    """
    Sinh ảnh Visual Asset (Portrait hoặc Blueprint) thông qua OpenAI DALL-E 3 API.
    Sử dụng httpx để gọi REST API trực tiếp.
    """
    print(f"--- RUNNING AGENT: ART DIRECTOR (DALL-E 3) ---")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("WARNING: Missing OPENAI_API_KEY. Khong the sinh anh.")
        return None

    style_suffix = (
        " Digital art, highly detailed portrait, sci-fi cyberpunk and dark fantasy aesthetic. "
        "Intricate lighting, glowing accents, cinematic composition, masterpiece, 8k resolution."
    ) if is_portrait else (
        " Highly detailed technical blueprint, glowing schematic on a dark grid background. "
        "Sci-fi artifact, mysterious technology, isometric view, intricate glowing circuits."
    )

    final_prompt = f"{prompt_text}. {style_suffix}"
    # DALL-E 3 limit prompt length to 1000 characters
    final_prompt = final_prompt[:950]

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "dall-e-3",
                    "prompt": final_prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "standard"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                image_url = data['data'][0]['url']
                print(f"SUCCESS: Art Director sinh thanh cong Asset: {image_url}")
                return image_url
            else:
                print(f"ERROR: Art Director DALL-E 3 that bai: {response.text}")
                return None
    except Exception as e:
        print(f"ERROR: Art Director Exception: {e}")
        return None


