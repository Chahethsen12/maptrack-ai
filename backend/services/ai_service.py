"""
AI service layer for MapTrack AI.

Design philosophy:
- All LLM calls abstracted behind two functions: categorize() and summarize()
- Multi-provider support with automatic fallback (graceful degradation)
- Uses Chat Completions API (compatible across OpenAI, Gemini, Groq)

Provider strategy:
1. OpenAI  (gpt-4o-mini)      — primary (most reliable, good cost)
2. Gemini  (gemini-2.0-flash) — secondary (free tier available)
3. Groq    (llama-3.1-8b)     — fallback (free tier available)

Only one provider key required to run the app. Automatically skips missing keys
and tries the next provider. This design allows students with any API key to deploy.

Why not hard-code one provider?
- Better UX: If one provider goes down, app keeps working
- Accessibility: Works with free/paid tiers depending on user setup
- Educational value: Shows real-world architecture for API resilience
"""

import json
import logging
import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VALID_CATEGORIES = [
    "study", "food", "travel", "work",
    "meetup", "errands", "personal", "uncategorized",
]

# ── Provider configurations ──────────────────────────────────────────────────
# All three providers support OpenAI-compatible Chat Completions API,
# so the same request/response format works without per-provider branching.

PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1/chat/completions",
        "model":    "gpt-4o-mini",
        "key_env":  "OPENAI_API_KEY",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "model":    "gemini-2.0-flash",
        "key_env":  "GEMINI_API_KEY",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "model":    "llama-3.1-8b-instant",
        "key_env":  "GROQ_API_KEY",
    },
}

PROVIDER_ORDER = ["openai", "gemini", "groq"]


# ── Low-level HTTP call ──────────────────────────────────────────────────────

async def _call_provider(provider_name: str, messages: list[dict], max_tokens: int = 200) -> str:
    """
    Call a single provider's chat completion endpoint.
    
    Args:
        provider_name: Key in PROVIDERS dict
        messages: Chat history in OpenAI format
        max_tokens: Max response length
    
    Returns:
        Assistant message text
    
    Raises:
        ValueError: If API key not configured
        httpx.HTTPError: If request fails
    """
    config = PROVIDERS[provider_name]
    key    = os.getenv(config["key_env"], "")

    if not key:
        raise ValueError(
            f"No API key configured for provider '{provider_name}' ({config['key_env']})"
        )

    payload = {
        "model":       config["model"],
        "messages":    messages,
        "max_tokens":  max_tokens,
        "temperature": 0.2,  # Low temp: deterministic categorization
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            config["base_url"],
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type":  "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


async def _call_with_fallback(messages: list[dict], max_tokens: int = 200) -> tuple[str, str]:
    """
    Try providers in PROVIDER_ORDER, skipping any without a configured key.
    
    Returns:
        (response_text, provider_name_used)
    
    Raises:
        RuntimeError: If all providers fail
    """
    last_error: Exception | None = None

    for provider_name in PROVIDER_ORDER:
        try:
            text = await _call_provider(provider_name, messages, max_tokens)
            logger.info("AI response from provider: %s", provider_name)
            return text, provider_name
        except Exception as exc:
            logger.warning("Provider '%s' failed: %s", provider_name, exc)
            last_error = exc

    raise RuntimeError(f"All AI providers failed. Last error: {last_error}")


# ── Public functions ─────────────────────────────────────────────────────────

async def categorize(title: str, note: Optional[str]) -> dict:
    """
    Suggest a category for a place based on title + note.

    Returns:
        {"category": str, "confidence": str, "provider": str}
    """
    note_text  = note.strip() if note else "no additional notes"
    valid_list = ", ".join(VALID_CATEGORIES)

    messages = [
        {
            "role":    "system",
            "content": (
                "You are a location categorization assistant. "
                "Given a place title and optional note, return ONLY a JSON object with these keys:\n"
                '  "category": one of [' + valid_list + ']\n'
                '  "confidence": one of ["high", "medium", "low"]\n'
                "No explanation, no markdown, just the JSON object."
            ),
        },
        {
            "role":    "user",
            "content": f'Title: "{title}"\nNote: "{note_text}"',
        },
    ]

    raw, provider = await _call_with_fallback(messages, max_tokens=60)

    # Parse JSON response — fall back gracefully if malformed
    try:
        result     = json.loads(raw)
        category   = result.get("category", "uncategorized")
        if category not in VALID_CATEGORIES:
            category = "uncategorized"
        confidence = result.get("confidence", "low")
    except (json.JSONDecodeError, KeyError):
        logger.warning("Could not parse AI categorize response: %s", raw)
        category   = "uncategorized"
        confidence = "low"

    return {"category": category, "confidence": confidence, "provider": provider}


async def summarize(places: list[dict]) -> dict:
    """
    Summarize a list of place dicts (title, category, note) into a short paragraph.

    Returns:
        {"summary": str, "provider": str, "place_count": int}
    """
    if not places:
        return {
            "summary":     "No places saved yet. Start by adding some locations to your map!",
            "provider":    "local",
            "place_count": 0,
        }

    # Build a compact text representation — keep tokens low
    lines = []
    for p in places:
        note_snippet = (p.get("note") or "")[:80]
        lines.append(f"- {p['title']} [{p.get('category', '?')}]: {note_snippet}")

    place_list = "\n".join(lines)

    messages = [
        {
            "role":    "system",
            "content": (
                "You are a personal location assistant. "
                "The user has saved a list of places. "
                "Write a friendly 2-3 sentence summary that highlights patterns: "
                "dominant categories, recurring themes, or interesting observations. "
                "Be concise and practical. Do not list every place."
            ),
        },
        {
            "role":    "user",
            "content": f"My saved places:\n{place_list}",
        },
    ]

    summary_text, provider = await _call_with_fallback(messages, max_tokens=150)

    return {
        "summary":     summary_text,
        "provider":    provider,
        "place_count": len(places),
    }