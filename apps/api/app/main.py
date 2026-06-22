from __future__ import annotations

import os
import shutil
import time
import uuid
from collections.abc import Sequence
from datetime import datetime, timezone  # noqa: F401 – timezone used in create_log/update_log
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import Log, Photo, Plant, User
from .schemas import (
    AskRequest,
    AskResponse,
    LogCreate,
    LogRead,
    LogUpdate,
    PhotoRead,
    PlantCreate,
    PlantRead,
    PlantUpdate,
    ReminderRead,
)

app = FastAPI(title="Plant Care API")

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/uploads"))
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
AI_MODEL = os.getenv("AI_MODEL", "qwen2.5:0.5b")
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

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


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    clerk_user_id = request.headers.get("x-clerk-user-id")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = db.scalar(select(User).where(User.clerk_user_id == clerk_user_id))
    if user is None:
        user = User(
            clerk_user_id=clerk_user_id,
            email=request.headers.get("x-clerk-user-email"),
            password_hash="clerk",
        )
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


def photo_or_404(db: Session, photo_id: int, user_id: int) -> Photo:
    photo = db.scalar(select(Photo).join(Plant).where(Photo.id == photo_id, Plant.user_id == user_id))
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def startup() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    last_error: Exception | None = None
    for _ in range(30):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except Exception as exc:  # pragma: no cover
            last_error = exc
            time.sleep(1)
    if last_error is not None:
        raise last_error


app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR), check_dir=False), name="uploads")


# ---------------------------------------------------------------------------
# Plants
# ---------------------------------------------------------------------------

@app.get("/plants", response_model=list[PlantRead])
def list_plants(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Plant]:
    plants = list(db.scalars(select(Plant).where(Plant.user_id == current_user.id).order_by(Plant.created_at.desc())).all())
    if plants:
        plant_ids = [p.id for p in plants]
        latest_subq = (
            select(Photo.plant_id, func.max(Photo.id).label("max_id"))
            .where(Photo.plant_id.in_(plant_ids))
            .group_by(Photo.plant_id)
            .subquery()
        )
        latest_photos = db.scalars(select(Photo).join(latest_subq, Photo.id == latest_subq.c.max_id)).all()
        photo_map = {p.plant_id: p for p in latest_photos}
        for plant in plants:
            plant.latest_photo = photo_map.get(plant.id)
    return plants


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


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------

@app.get("/plants/{plant_id}/logs", response_model=list[LogRead])
def list_logs(plant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Sequence[Log]:
    plant_or_404(db, plant_id, current_user.id)
    return db.scalars(select(Log).where(Log.plant_id == plant_id).order_by(Log.created_at.desc())).all()


@app.post("/logs", response_model=LogRead, status_code=201)
def create_log(payload: LogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Log:
    plant_or_404(db, payload.plant_id, current_user.id)
    log = Log(
        **payload.model_dump(exclude={"created_at"}),
        created_at=payload.created_at if payload.created_at else datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.put("/logs/{log_id}", response_model=LogRead)
def update_log(log_id: int, payload: LogUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Log:
    log = log_or_404(db, log_id, current_user.id)
    plant_or_404(db, payload.plant_id, current_user.id)
    for key, value in payload.model_dump(exclude={"created_at"}).items():
        setattr(log, key, value)
    if payload.created_at is not None:
        log.created_at = payload.created_at
    db.commit()
    db.refresh(log)
    return log


@app.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    log = log_or_404(db, log_id, current_user.id)
    db.delete(log)
    db.commit()


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------

@app.get("/plants/{plant_id}/photos", response_model=list[PhotoRead])
def list_photos(plant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Sequence[Photo]:
    plant_or_404(db, plant_id, current_user.id)
    return db.scalars(select(Photo).where(Photo.plant_id == plant_id).order_by(Photo.created_at.desc())).all()


@app.post("/plants/{plant_id}/photos", response_model=PhotoRead, status_code=201)
async def upload_photo(
    plant_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Photo:
    plant_or_404(db, plant_id, current_user.id)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")

    plant_dir = UPLOAD_DIR / str(plant_id)
    plant_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{ext}"
    with open(plant_dir / filename, "wb") as dest:
        shutil.copyfileobj(file.file, dest)

    photo = Photo(plant_id=plant_id, filename=filename)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@app.delete("/photos/{photo_id}", status_code=204)
def delete_photo(photo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    photo = photo_or_404(db, photo_id, current_user.id)
    path = UPLOAD_DIR / str(photo.plant_id) / photo.filename
    path.unlink(missing_ok=True)
    db.delete(photo)
    db.commit()


# ---------------------------------------------------------------------------
# Reminders
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# AI
# ---------------------------------------------------------------------------

@app.post("/ai/ask", response_model=AskResponse)
def ask_ai(payload: AskRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AskResponse:
    plant = plant_or_404(db, payload.plant_id, current_user.id)

    recent_logs = db.scalars(
        select(Log).where(Log.plant_id == plant.id).order_by(Log.created_at.desc()).limit(10)
    ).all()

    log_lines = "\n".join(
        f"- {log.type} on {log.created_at.date()}" + (f": {log.note}" if log.note else "")
        for log in recent_logs
    ) or "No care history yet."

    prompt = (
        f"You are a concise plant care assistant.\n\n"
        f"Plant: {plant.name} ({plant.species})\n"
        f"Location: {plant.location}\n"
        f"Watering interval: every {plant.watering_interval_days} days\n\n"
        f"Recent care history:\n{log_lines}\n\n"
        f"Question: {payload.question}\n\n"
        f"Answer in 2-3 sentences."
    )

    if not OLLAMA_URL:
        raise HTTPException(status_code=503, detail="AI service not configured. Install Ollama (https://ollama.com) and restart.")

    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": AI_MODEL, "prompt": prompt, "stream": False},
            timeout=60.0,
        )
        response.raise_for_status()
        return AskResponse(answer=response.json()["response"].strip())
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="AI service is not running. Start Ollama and pull a model.")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=503, detail=f"Ollama error: {exc.response.text}")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")
