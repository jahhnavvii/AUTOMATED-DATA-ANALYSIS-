import json
import httpx
from ..config import settings


async def ask_llm(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(f"{settings.OLLAMA_BASE_URL}/api/generate", json={
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        })
        return r.json()["response"]


async def detect_domain(column_names: list, sample_rows: list) -> dict:
    prompt = f"""You are a data scientist. Given these column names: {column_names}
and sample data rows: {sample_rows[:3]}

Respond ONLY with a valid JSON object, no explanation, no markdown:
{{"domain": "finance", "confidence": 0.9, "tasks": ["churn prediction", "revenue forecast", "fraud detection"]}}

Domain options: finance, healthcare, retail, hr, marketing, real_estate, other
Pick the 3 most relevant tasks for this domain and dataset."""
    raw = await ask_llm(prompt)
    raw = raw.strip().strip('`')
    if raw.startswith("json"):
        raw = raw[4:]
    return json.loads(raw)


async def narrate_stage(stage: str, context: dict) -> dict:
    prompt = f"""You are an expert AI data scientist narrating your work to a user.
Stage: {stage}
Context: {json.dumps(context, indent=2)}

Respond ONLY with a JSON object:
{{"message": "plain English explanation of what you observed (2-3 sentences)", "decision": "the specific action or decision you are taking"}}
No markdown, no extra text."""
    raw = await ask_llm(prompt)
    raw = raw.strip().strip('`')
    if raw.startswith("json"):
        raw = raw[4:]
    return json.loads(raw)
