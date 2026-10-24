from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TaskCategory(str, Enum):
    PERSONAL = "personal"
    SOCIAL = "social"
    PROFESSIONAL = "professional"


class TaskPriority(str, Enum):
    P1_CRITICAL = "p1"
    P2_HIGH = "p2"
    P3_ROUTINE = "p3"


class SubCategory(str, Enum):
    HYDRATION = "hydration"
    MEDICATION = "medication"
    EXERCISE = "exercise"
    MANIFESTATION = "manifestation"
    CONTENT_POST = "content_post"
    NETWORKING = "networking"
    IDEA_CAPTURE = "idea_capture"
    TRADING = "trading"
    DEV_SPRINT = "dev_sprint"
    CLIENT_OPS = "client_ops"
    GENERAL = "general"


class TaskItemBase(BaseModel):
    title: str = Field(..., max_length=120)
    category: TaskCategory
    sub_category: SubCategory
    priority: TaskPriority = TaskPriority.P3_ROUTINE
    due_at: Optional[datetime] = None
    context_trigger: Optional[str] = Field(
        None, description="Dynamic rule like 'market_open_minus_15' or 'post_workout'"
    )


class VoiceIngestPayload(BaseModel):
    raw_transcript: str
    audio_duration_seconds: float = 0
    device_timestamp: datetime


class ParsedTasksResponse(BaseModel):
    parsed_items: List[TaskItemBase]
    unresolved_notes: Optional[str] = None
