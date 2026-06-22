from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

LogType = Literal["watering", "pruning", "fertilizing", "notes"]


class PlantBase(BaseModel):
    name: str
    species: str
    location: str
    watering_interval_days: int = Field(ge=1, le=365)


class PlantCreate(PlantBase):
    pass


class PlantUpdate(PlantBase):
    pass


class PlantRead(PlantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    latest_photo: "PhotoRead | None" = None


class LogBase(BaseModel):
    plant_id: int
    type: LogType
    note: str | None = None


class LogCreate(LogBase):
    created_at: datetime | None = None


class LogUpdate(LogBase):
    created_at: datetime | None = None


class LogRead(LogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ReminderRead(BaseModel):
    plant_id: int
    plant_name: str
    days_since_last_care: int
    overdue: bool
    due_in_days: int


class PhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plant_id: int
    filename: str
    created_at: datetime


class AskRequest(BaseModel):
    plant_id: int
    question: str


class AskResponse(BaseModel):
    answer: str


class WeeklyCount(BaseModel):
    week: str
    count: int


class WateringInterval(BaseModel):
    date: str
    days: int


class PlantStat(BaseModel):
    plant_id: int
    plant_name: str
    total_logs: int
    watering_count: int
    days_since_last_watered: int | None
    avg_days_between_waterings: float | None
    watering_intervals: list[WateringInterval] = []


class AnalyticsRead(BaseModel):
    total_plants: int
    total_logs: int
    total_photos: int
    logs_by_type: dict[str, int]
    activity_by_week: list[WeeklyCount]
    plant_stats: list[PlantStat]
