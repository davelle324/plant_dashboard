from __future__ import annotations

import time
import os
from collections.abc import Sequence
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import Log, Plant, User
from .schemas import AskRequest, AskResponse, LogCreate, LogRead, LogUpdate, PlantCreate, PlantRead, PlantUpdate, ReminderRead

app = FastAPI(title="Plant Care API")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).order_by(User.id.asc()))
    if user is None:
        user = User(email="demo@plants.local", password_hash="demo")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def plant_or_404(db: Session, plant_id: int, user_id: int) -> Plant:
    plant = db.scalar(select(Plant).where(Plant.id == plant_id, Plant.user_id == user_id))
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


def log_or_404(db: Session, log_id: int, user_id: int) -> Log:
    log = db.scalar(select(Log).join(Plant).where(Log.id == log_id, Plant.user_id == user_id))
    if log is None:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def startup() -> None:
    last_error: Exception | None = None
    for _ in range(30):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except Exception as exc:  # pragma: no cover - startup resilience
            last_error = exc
            time.sleep(1)
    if last_error is not None:
        raise last_error


@app.get("/plants", response_model=list[PlantRead])
def list_plants(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Sequence[Plant]:
    return db.scalars(select(Plant).where(Plant.user_id == current_user.id).order_by(Plant.created_at.desc())).all()


@app.post("/plants", response_model=PlantRead, status_code=201)
def create_plant(payload: PlantCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Plant:
    plant = Plant(**payload.model_dump(), user_id=current_user.id)
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


@app.get("/plants/{plant_id}", response_model=PlantRead)
def get_plant(plant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Plant:
    return plant_or_404(db, plant_id, current_user.id)


@app.put("/plants/{plant_id}", response_model=PlantRead)
def update_plant(plant_id: int, payload: PlantUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Plant:
    plant = plant_or_404(db, plant_id, current_user.id)
    for key, value in payload.model_dump().items():
        setattr(plant, key, value)
    db.commit()
    db.refresh(plant)
    return plant


@app.delete("/plants/{plant_id}", status_code=204)
def delete_plant(plant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    plant = plant_or_404(db, plant_id, current_user.id)
    db.delete(plant)
    db.commit()


@app.get("/plants/{plant_id}/logs", response_model=list[LogRead])
def list_logs(plant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Sequence[Log]:
    plant_or_404(db, plant_id, current_user.id)
    return db.scalars(select(Log).where(Log.plant_id == plant_id).order_by(Log.created_at.desc())).all()


@app.post("/logs", response_model=LogRead, status_code=201)
def create_log(payload: LogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Log:
    plant_or_404(db, payload.plant_id, current_user.id)
    log = Log(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.put("/logs/{log_id}", response_model=LogRead)
def update_log(log_id: int, payload: LogUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Log:
    log = log_or_404(db, log_id, current_user.id)
    plant_or_404(db, payload.plant_id, current_user.id)
    for key, value in payload.model_dump().items():
        setattr(log, key, value)
    db.commit()
    db.refresh(log)
    return log


@app.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    log = log_or_404(db, log_id, current_user.id)
    db.delete(log)
    db.commit()


def reminder_rows(db: Session, user_id: int) -> list[ReminderRead]:
    plants = db.scalars(select(Plant).where(Plant.user_id == user_id)).all()
    reminders: list[ReminderRead] = []
    now = datetime.now(timezone.utc)
    for plant in plants:
        latest_log = db.scalar(
            select(Log)
            .where(Log.plant_id == plant.id, Log.type == "watering")
            .order_by(Log.created_at.desc())
        )
        last_care = latest_log.created_at if latest_log else plant.created_at
        if last_care.tzinfo is None:
            last_care = last_care.replace(tzinfo=timezone.utc)
        days_since = max((now - last_care).days, 0)
        due_in_days = plant.watering_interval_days - days_since
        reminders.append(
            ReminderRead(
                plant_id=plant.id,
                plant_name=plant.name,
                days_since_last_care=days_since,
                overdue=due_in_days <= 0,
                due_in_days=due_in_days,
            )
        )
    return reminders


@app.get("/reminders", response_model=list[ReminderRead])
def get_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ReminderRead]:
    return [row for row in reminder_rows(db, current_user.id) if row.overdue]


@app.post("/ai/ask", response_model=AskResponse)
def ask_ai(payload: AskRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AskResponse:
    plant_or_404(db, payload.plant_id, current_user.id)
    return AskResponse(
        answer=(
            "AI assistant is reserved for phase 2. "
            f"Question received for plant {payload.plant_id}: {payload.question}"
        )
    )
