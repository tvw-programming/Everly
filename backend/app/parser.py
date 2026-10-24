import re
from datetime import datetime
from typing import List, Optional, Tuple

from .models import ParsedTasksResponse, SubCategory, TaskCategory, TaskItemBase, TaskPriority

PERSONAL = [
    (re.compile(r"\b(water|hydrat|ml|liter|drink)\b", re.I), SubCategory.HYDRATION, TaskPriority.P2_HIGH, None),
    (re.compile(r"\b(meds?|medication|pill|dose|blood pressure)\b", re.I), SubCategory.MEDICATION, TaskPriority.P1_CRITICAL, None),
    (re.compile(r"\b(workout|exercise|gym|run|yoga)\b", re.I), SubCategory.EXERCISE, TaskPriority.P3_ROUTINE, None),
    (re.compile(r"\b(manifest|mindset|affirm|zen|focus check)\b", re.I), SubCategory.MANIFESTATION, TaskPriority.P3_ROUTINE, None),
]

SOCIAL = [
    (re.compile(r"\b(post|tweet|x\.com|linkedin|publish|clip|demo)\b", re.I), SubCategory.CONTENT_POST, TaskPriority.P3_ROUTINE, None),
    (re.compile(r"\b(outreach|network|follow up)\b", re.I), SubCategory.NETWORKING, TaskPriority.P3_ROUTINE, None),
    (re.compile(r"\b(idea|thought|capture)\b", re.I), SubCategory.IDEA_CAPTURE, TaskPriority.P3_ROUTINE, None),
]

PRO = [
    (re.compile(r"\b(nifty|trading|trade|options?|market|sensex|stocks?)\b", re.I), SubCategory.TRADING, TaskPriority.P1_CRITICAL, "market_open_minus_15"),
    (re.compile(r"\b(deploy|sprint|engineering|code|build|agent)\b", re.I), SubCategory.DEV_SPRINT, TaskPriority.P2_HIGH, None),
    (re.compile(r"\b(client|invoice|business|ops)\b", re.I), SubCategory.CLIENT_OPS, TaskPriority.P2_HIGH, None),
]


def _extract_due(text: str, device_timestamp: datetime) -> Optional[datetime]:
    m = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", text, re.I)
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2) or 0)
    period = m.group(3).lower()
    if period == "pm" and hour < 12:
        hour += 12
    if period == "am" and hour == 12:
        hour = 0
    return device_timestamp.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _classify(chunk: str, device_timestamp: datetime) -> TaskItemBase:
    title = re.sub(r"\s+", " ", chunk).strip(" ,.")
    due = _extract_due(chunk, device_timestamp)

    for regex, sub, priority, trigger in PERSONAL:
        if regex.search(chunk):
            return TaskItemBase(
                title=title[:120],
                category=TaskCategory.PERSONAL,
                sub_category=sub,
                priority=priority,
                due_at=due,
                context_trigger=trigger,
            )
    for regex, sub, priority, trigger in SOCIAL:
        if regex.search(chunk):
            return TaskItemBase(
                title=title[:120],
                category=TaskCategory.SOCIAL,
                sub_category=sub,
                priority=priority,
                due_at=due,
                context_trigger=trigger,
            )
    for regex, sub, priority, trigger in PRO:
        if regex.search(chunk):
            return TaskItemBase(
                title=title[:120],
                category=TaskCategory.PROFESSIONAL,
                sub_category=sub,
                priority=priority,
                due_at=due,
                context_trigger=trigger,
            )
    return TaskItemBase(
        title=title[:120],
        category=TaskCategory.PERSONAL,
        sub_category=SubCategory.GENERAL,
        priority=TaskPriority.P3_ROUTINE,
        due_at=due,
    )


def parse_transcript(raw: str, device_timestamp: datetime) -> ParsedTasksResponse:
    cleaned = raw.strip()
    if not cleaned:
        return ParsedTasksResponse(parsed_items=[], unresolved_notes=None)

    parts = [
        p.strip()
        for p in re.split(r"\band then\b|\band also\b|\balso\b|, and |,(?=\s)|;|\n", cleaned, flags=re.I)
        if p and len(p.strip()) > 2
    ]
    chunks = parts if len(parts) > 1 else [cleaned]
    items: List[TaskItemBase] = [_classify(c, device_timestamp) for c in chunks if c.strip()]
    return ParsedTasksResponse(
        parsed_items=items,
        unresolved_notes=None if items else cleaned,
    )
