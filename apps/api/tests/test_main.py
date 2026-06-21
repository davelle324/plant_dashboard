from __future__ import annotations

import importlib
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi.testclient import TestClient


def load_app(tmp_path: Path):
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_path / 'test.db'}"

    import app.db as db_module
    import app.models as models_module
    import app.main as main_module

    importlib.reload(db_module)
    importlib.reload(models_module)
    importlib.reload(main_module)
    return main_module.app, db_module, main_module


def test_create_plant(tmp_path):
    app, _db, _main = load_app(tmp_path)

    with TestClient(app) as client:
        response = client.post(
            "/plants",
            json={
                "name": "Basil",
                "species": "Ocimum basilicum",
                "location": "Kitchen window",
                "watering_interval_days": 7,
            },
            headers={"Origin": "http://localhost:3000"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Basil"
    assert body["species"] == "Ocimum basilicum"
    assert body["location"] == "Kitchen window"
    assert body["watering_interval_days"] == 7
    assert body["user_id"] == 1


def test_cors_allows_local_web_origin(tmp_path):
    app, _db, _main = load_app(tmp_path)

    with TestClient(app) as client:
        response = client.options(
            "/plants",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_reminders_use_latest_watering_log(tmp_path):
    app, db_module, main_module = load_app(tmp_path)

    with TestClient(app) as client:
        create_response = client.post(
            "/plants",
            json={
                "name": "Mint",
                "species": "Mentha spicata",
                "location": "Patio",
                "watering_interval_days": 7,
            },
        )
        plant_id = create_response.json()["id"]

    db = db_module.SessionLocal()
    try:
        plant = db.get(main_module.Plant, plant_id)
        assert plant is not None
        plant.created_at = datetime.now(timezone.utc) - timedelta(days=10)
        db.add(
            main_module.Log(
                plant_id=plant_id,
                type="watering",
                note="Watered after repotting",
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
            )
        )
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        response = client.get("/reminders")

    assert response.status_code == 200
    assert response.json() == []
