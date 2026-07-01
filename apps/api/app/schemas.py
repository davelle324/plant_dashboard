"""Pydantic schemas for request/response validation and serialisation."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

LogType = Literal["watering", "pruning", "fertilizing", "notes"]


class PlantBase(BaseModel):
    """Shared fields for plant create/update requests."""

    name: str = Field(max_length=100)
    species: str = Field(max_length=100)
    location: str = Field(max_length=100)
    watering_interval_days: int = Field(ge=1, le=365)


class PlantCreate(PlantBase):
    """Payload for creating a new plant."""


class PlantUpdate(PlantBase):
    """Payload for updating an existing plant."""


class PlantRead(PlantBase):
    """Plant data returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    latest_photo: "PhotoRead | None" = None


class LogBase(BaseModel):
    """Shared fields for log create/update requests."""

    plant_id: int
    type: LogType
    note: str | None = Field(None, max_length=2000)


class LogCreate(LogBase):
    """Payload for creating a new care log entry."""

    created_at: datetime | None = None


class LogUpdate(LogBase):
    """Payload for updating an existing care log entry."""

    created_at: datetime | None = None


class LogRead(LogBase):
    """Log data returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ReminderRead(BaseModel):
    """A watering reminder for a single plant."""

    plant_id: int
    plant_name: str
    days_since_last_care: int
    overdue: bool
    due_in_days: int


class PhotoRead(BaseModel):
    """Photo data returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    plant_id: int
    filename: str
    caption: str | None = None
    created_at: datetime


class PhotoCaptionUpdate(BaseModel):
    """Payload for updating a photo caption."""

    caption: str | None = Field(None, max_length=500)


class PhotoWithPlant(PhotoRead):
    """Photo with its associated plant name (used in gallery endpoints)."""

    plant_name: str


class AskRequest(BaseModel):
    """Payload for an AI care question."""

    plant_id: int
    question: str = Field(max_length=500)


class AskResponse(BaseModel):
    """AI answer returned by the /ai/ask endpoint."""

    answer: str


class WeeklyCount(BaseModel):
    """Care event count for a single ISO week."""

    week: str
    count: int


class WateringInterval(BaseModel):
    """Days between two consecutive watering events."""

    date: str
    days: int


class PlantStat(BaseModel):
    """Per-plant analytics summary."""

    plant_id: int
    plant_name: str
    total_logs: int
    watering_count: int
    days_since_last_watered: int | None
    avg_days_between_waterings: float | None
    watering_intervals: list[WateringInterval] = []


class AnalyticsRead(BaseModel):
    """Full analytics response for the current user."""

    total_plants: int
    total_logs: int
    total_photos: int
    logs_by_type: dict[str, int]
    activity_by_week: list[WeeklyCount]
    plant_stats: list[PlantStat]


# ---------------------------------------------------------------------------
# Social — public profiles, following, feed
# ---------------------------------------------------------------------------

class PublicUserRead(BaseModel):
    """A user as seen by others. Email is intentionally omitted for privacy."""

    id: int
    display_name: str
    plant_count: int
    photo_count: int
    follower_count: int
    following_count: int
    is_following: bool
    is_self: bool


class FeedItem(BaseModel):
    """A photo in the Following feed, with its plant and owner attached."""

    id: int
    plant_id: int
    filename: str
    caption: str | None = None
    created_at: datetime
    plant_name: str
    owner_id: int
    owner_display_name: str
