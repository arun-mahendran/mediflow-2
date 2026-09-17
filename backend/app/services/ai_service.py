import json
import re
from typing import Optional

import httpx

from app.core.config import settings
from app.models.models import UrgencyLevel

DISCLAIMER = (
    "AI-generated urgency assessment is for support purposes only and does not "
    "replace professional medical evaluation."
)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

EMERGENCY_KEYWORDS = [
    "chest pain",
    "unconscious",
    "unresponsive",
    "severe bleeding",
    "heavy bleeding",
    "stroke",
    "can't breathe",
    "cannot breathe",
    "difficulty breathing",
    "seizure",
    "heart attack",
]

HIGH_KEYWORDS = [
    "high fever",
    "fracture",
    "broken bone",
    "severe pain",
    "vomiting blood",
    "allergic reaction",
    "severe headache",
]

MEDIUM_KEYWORDS = [
    "fever",
    "headache",
    "vomiting",
    "nausea",
    "diarrhea",
    "cough",
    "sore throat",
    "rash",
]


def _keyword_fallback(symptoms: str) -> dict:
    text = symptoms.lower()

    for kw in EMERGENCY_KEYWORDS:
        if kw in text:
            return {
                "urgency": UrgencyLevel.EMERGENCY,
                "department": "Emergency",
                "reason": f"Symptom description mentions '{kw}', a potential emergency warning sign.",
            }

    for kw in HIGH_KEYWORDS:
        if kw in text:
            return {
                "urgency": UrgencyLevel.HIGH,
                "department": "General Medicine",
                "reason": f"Symptom description mentions '{kw}', which may need prompt attention.",
            }

    for kw in MEDIUM_KEYWORDS:
        if kw in text:
            return {
                "urgency": UrgencyLevel.MEDIUM,
                "department": "General Medicine",
                "reason": f"Symptom description mentions '{kw}', suggesting a routine, non-urgent visit.",
            }

    return {
        "urgency": UrgencyLevel.LOW,
        "department": "General Medicine",
        "reason": "No high-risk keywords detected; symptoms appear mild based on description.",
    }


def _parse_gemini_json(text: str) -> Optional[dict]:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data
    except json.JSONDecodeError:
        return None


async def analyze_symptoms(symptoms: str, age: Optional[int] = None, gender: Optional[str] = None) -> dict:
    if not settings.GEMINI_API_KEY:
        result = _keyword_fallback(symptoms)
        result["source"] = "fallback"
        return result

    prompt = (
        "You are a hospital triage support assistant. You must NOT diagnose the patient. "
        "Given the patient's reported symptoms, classify urgency and suggest a hospital department. "
        "Respond with STRICT JSON only, no markdown, no extra text, in this exact shape: "
        '{"urgency": "EMERGENCY|HIGH|MEDIUM|LOW", "department": "<department name>", '
        '"reason": "<short triage justification, one or two sentences, not a diagnosis>"}. '
        f"Patient age: {age if age is not None else 'unknown'}. "
        f"Patient gender: {gender if gender else 'unknown'}. "
        f"Reported symptoms: {symptoms}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GEMINI_URL,
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            parsed = _parse_gemini_json(text)
            if not parsed:
                raise ValueError("Could not parse Gemini response")

            urgency_raw = str(parsed.get("urgency", "MEDIUM")).upper()
            if urgency_raw not in UrgencyLevel.__members__:
                urgency_raw = "MEDIUM"

            return {
                "urgency": UrgencyLevel[urgency_raw],
                "department": parsed.get("department", "General Medicine"),
                "reason": parsed.get("reason", "AI triage assessment based on reported symptoms."),
                "source": "ai",
            }
    except Exception:
        result = _keyword_fallback(symptoms)
        result["source"] = "fallback"
        return result
