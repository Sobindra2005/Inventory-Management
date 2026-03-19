import json
from typing import Any

import httpx

from app.core.config import settings


OPENROUTER_SYSTEM_PROMPT = """
You are a reporting assistant.
Given normalized business records, return a strict JSON object with exactly:
{
  "headers": ["col1", "col2", ...],
  "rows": [
    {"col1": "...", "col2": "..."}
  ]
}
Rules:
- Output valid JSON only.
- Keep headers stable and snake_case.
- rows must be an array of objects using the same headers.
- Do not include markdown fences or explanations.
""".strip()


def _normalize_ai_response(payload_text: str) -> tuple[list[str], list[dict[str, Any]]]:
    parsed = json.loads(payload_text)
    headers = parsed.get("headers", [])
    rows = parsed.get("rows", [])

    if not isinstance(headers, list) or not all(isinstance(item, str) for item in headers):
        raise ValueError("Invalid AI response headers")
    if not isinstance(rows, list):
        raise ValueError("Invalid AI response rows")

    normalized_rows: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict):
            normalized_rows.append({header: row.get(header, "") for header in headers})
            continue
        raise ValueError("Invalid AI response row format")

    return headers, normalized_rows


def generate_structured_report_rows(
    report_type: str,
    start_date: str,
    end_date: str,
    normalized_data: dict[str, Any],
) -> tuple[list[str], list[dict[str, Any]]]:
    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    user_prompt = json.dumps(
        {
            "report_type": report_type,
            "date_range": {"start_date": start_date, "end_date": end_date},
            "data": normalized_data,
            "required_output": "json",
        },
        ensure_ascii=False,
    )

    with httpx.Client(timeout=90.0) as client:
        response = client.post(
            f"{settings.OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": OPENROUTER_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.1,
            },
        )
        response.raise_for_status()
        payload = response.json()

    content = payload["choices"][0]["message"]["content"]
    return _normalize_ai_response(content)
