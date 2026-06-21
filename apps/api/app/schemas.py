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


class LogBase(BaseModel):
    plant_id: int
    type: LogType
    note: str | None = None


class LogCreate(LogBase):
    pass


class LogUpdate(LogBase):
    pass


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


class AskRequest(BaseModel):
    plant_id: int
    question: str


class AskResponse(BaseModel):
    answer: str
