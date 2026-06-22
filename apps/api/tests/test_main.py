from __future__ import annotations

import importlib
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

AUTH_HEADERS = {"x-clerk-user-id": "user_123", "x-clerk-user-email": "user@example.com"}
OTHER_HEADERS = {"x-clerk-user-id": "user_456", "x-clerk-user-email": "other@example.com"}

PLANT_PAYLOAD = {
    "name": "Basil",
    "species": "Ocimum basilicum",
    "location": "Kitchen window",
    "watering_interval_days": 7,
}


def load_app(tmp_path: Path):
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_path / 'test.db'}"
    os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")

    import app.db as db_module
    import app.models as models_module
    import app.main as main_module

    importlib.reload(db_module)
    importlib.reload(models_module)
    importlib.reload(main_module)
    return main_module.app, db_module, main_module


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def test_requires_authentication(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        assert client.get("/plants").status_code == 401
        assert client.post("/plants", json=PLANT_PAYLOAD).status_code == 401
        assert client.get("/reminders").status_code == 401


# ---------------------------------------------------------------------------
# Plants — CRUD
# ---------------------------------------------------------------------------

def test_create_plant(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS)
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Basil"
    assert body["species"] == "Ocimum basilicum"
    assert body["location"] == "Kitchen window"
    assert body["watering_interval_days"] == 7
    assert body["user_id"] == 1
    assert "id" in body
    assert "created_at" in body


def test_list_plants_empty(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.get("/plants", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_list_plants_returns_own_only(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS)
        client.post("/plants", json={**PLANT_PAYLOAD, "name": "Mint"}, headers=OTHER_HEADERS)
        r = client.get("/plants", headers=AUTH_HEADERS)
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["Basil"]


def test_get_plant(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS).json()["id"]
        r = client.get(f"/plants/{plant_id}", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert r.json()["name"] == "Basil"


def test_get_plant_not_found(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.get("/plants/999", headers=AUTH_HEADERS)
    assert r.status_code == 404


def test_get_plant_other_user_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS).json()["id"]
        r = client.get(f"/plants/{plant_id}", headers=OTHER_HEADERS)
    assert r.status_code == 404


def test_update_plant(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS).json()["id"]
        r = client.put(
            f"/plants/{plant_id}",
            json={**PLANT_PAYLOAD, "name": "Sweet Basil", "watering_interval_days": 5},
            headers=AUTH_HEADERS,
        )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Sweet Basil"
    assert body["watering_interval_days"] == 5


def test_update_plant_other_user_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS).json()["id"]
        r = client.put(f"/plants/{plant_id}", json=PLANT_PAYLOAD, headers=OTHER_HEADERS)
    assert r.status_code == 404


def test_delete_plant(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS).json()["id"]
        r = client.delete(f"/plants/{plant_id}", headers=AUTH_HEADERS)
        assert r.status_code == 204
        assert client.get(f"/plants/{plant_id}", headers=AUTH_HEADERS).status_code == 404


def test_delete_plant_other_user_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = client.post("/plants", json=PLANT_PAYLOAD, headers=AUTH_HEADERS).json()["id"]
        r = client.delete(f"/plants/{plant_id}", headers=OTHER_HEADERS)
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Logs — CRUD
# ---------------------------------------------------------------------------

def _make_plant(client: TestClient, headers: dict) -> int:
    return client.post("/plants", json=PLANT_PAYLOAD, headers=headers).json()["id"]


def test_create_log(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = client.post(
            "/logs",
            json={"plant_id": plant_id, "type": "watering", "note": "Watered well"},
            headers=AUTH_HEADERS,
        )
    assert r.status_code == 201
    body = r.json()
    assert body["plant_id"] == plant_id
    assert body["type"] == "watering"
    assert body["note"] == "Watered well"
    assert "id" in body
    assert "created_at" in body


def test_create_log_invalid_type(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = client.post(
            "/logs",
            json={"plant_id": plant_id, "type": "singing"},
            headers=AUTH_HEADERS,
        )
    assert r.status_code == 422


def test_create_log_other_user_plant_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = client.post(
            "/logs",
            json={"plant_id": plant_id, "type": "watering"},
            headers=OTHER_HEADERS,
        )
    assert r.status_code == 404


def test_list_logs(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        client.post("/logs", json={"plant_id": plant_id, "type": "watering"}, headers=AUTH_HEADERS)
        client.post("/logs", json={"plant_id": plant_id, "type": "pruning"}, headers=AUTH_HEADERS)
        r = client.get(f"/plants/{plant_id}/logs", headers=AUTH_HEADERS)
    assert r.status_code == 200
    types = [lg["type"] for lg in r.json()]
    assert set(types) == {"watering", "pruning"}


def test_update_log(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        log_id = client.post(
            "/logs", json={"plant_id": plant_id, "type": "watering"}, headers=AUTH_HEADERS
        ).json()["id"]
        r = client.put(
            f"/logs/{log_id}",
            json={"plant_id": plant_id, "type": "fertilizing", "note": "Used liquid feed"},
            headers=AUTH_HEADERS,
        )
    assert r.status_code == 200
    assert r.json()["type"] == "fertilizing"
    assert r.json()["note"] == "Used liquid feed"


def test_update_log_other_user_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        log_id = client.post(
            "/logs", json={"plant_id": plant_id, "type": "watering"}, headers=AUTH_HEADERS
        ).json()["id"]
        plant_id_other = _make_plant(client, OTHER_HEADERS)
        r = client.put(
            f"/logs/{log_id}",
            json={"plant_id": plant_id_other, "type": "watering"},
            headers=OTHER_HEADERS,
        )
    assert r.status_code == 404


def test_delete_log(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        log_id = client.post(
            "/logs", json={"plant_id": plant_id, "type": "watering"}, headers=AUTH_HEADERS
        ).json()["id"]
        r = client.delete(f"/logs/{log_id}", headers=AUTH_HEADERS)
        assert r.status_code == 204
        logs = client.get(f"/plants/{plant_id}/logs", headers=AUTH_HEADERS).json()
    assert logs == []


# ---------------------------------------------------------------------------
# Reminders
# ---------------------------------------------------------------------------

def test_reminders_empty_when_no_plants(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.get("/reminders", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_reminders_overdue_plant(tmp_path):
    app, db_module, main_module = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)

    # backdate creation so the plant is overdue
    db = db_module.SessionLocal()
    try:
        plant = db.get(main_module.Plant, plant_id)
        plant.created_at = datetime.now(timezone.utc) - timedelta(days=10)
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        r = client.get("/reminders", headers=AUTH_HEADERS)
    assert r.status_code == 200
    reminders = r.json()
    assert len(reminders) == 1
    assert reminders[0]["plant_id"] == plant_id
    assert reminders[0]["overdue"] is True
    assert reminders[0]["days_since_last_care"] >= 10


def test_reminders_not_overdue_when_recently_watered(tmp_path):
    app, db_module, main_module = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)

    db = db_module.SessionLocal()
    try:
        plant = db.get(main_module.Plant, plant_id)
        plant.created_at = datetime.now(timezone.utc) - timedelta(days=10)
        db.add(
            main_module.Log(
                plant_id=plant_id,
                type="watering",
                note="Fresh water",
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
            )
        )
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        r = client.get("/reminders", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_reminders_uses_latest_watering_log(tmp_path):
    """Reminders use the most recent watering log, ignoring older ones."""
    app, db_module, main_module = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)

    db = db_module.SessionLocal()
    try:
        plant = db.get(main_module.Plant, plant_id)
        plant.created_at = datetime.now(timezone.utc) - timedelta(days=30)
        db.add(
            main_module.Log(
                plant_id=plant_id,
                type="watering",
                created_at=datetime.now(timezone.utc) - timedelta(days=20),
            )
        )
        db.add(
            main_module.Log(
                plant_id=plant_id,
                type="watering",
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
            )
        )
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        r = client.get("/reminders", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_reminders_isolated_per_user(tmp_path):
    app, db_module, main_module = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        _make_plant(client, OTHER_HEADERS)

    db = db_module.SessionLocal()
    try:
        plant = db.get(main_module.Plant, plant_id)
        plant.created_at = datetime.now(timezone.utc) - timedelta(days=10)
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        r_user = client.get("/reminders", headers=AUTH_HEADERS)
        r_other = client.get("/reminders", headers=OTHER_HEADERS)

    assert len(r_user.json()) == 1
    assert r_other.json() == []


# ---------------------------------------------------------------------------
# Health + CORS
# ---------------------------------------------------------------------------

def test_health(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_cors_allows_local_web_origin(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.options(
            "/plants",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                **AUTH_HEADERS,
            },
        )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "http://localhost:3000"


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------

def _upload_photo(
    client: TestClient,
    plant_id: int,
    headers: dict,
    filename: str = "plant.jpg",
    content: bytes = b"fake-image-bytes",
    content_type: str = "image/jpeg",
):
    return client.post(
        f"/plants/{plant_id}/photos",
        files={"file": (filename, content, content_type)},
        headers=headers,
    )


def test_list_photos_empty(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = client.get(f"/plants/{plant_id}/photos", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_upload_photo(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = _upload_photo(client, plant_id, AUTH_HEADERS)
    assert r.status_code == 201
    body = r.json()
    assert body["plant_id"] == plant_id
    assert "filename" in body
    assert "id" in body
    assert "created_at" in body


def test_upload_photo_appears_in_list(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        _upload_photo(client, plant_id, AUTH_HEADERS)
        r = client.get(f"/plants/{plant_id}/photos", headers=AUTH_HEADERS)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_upload_photo_other_user_plant_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = _upload_photo(client, plant_id, OTHER_HEADERS)
    assert r.status_code == 404


def test_upload_photo_invalid_extension(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        r = _upload_photo(client, plant_id, AUTH_HEADERS, filename="notes.txt", content_type="text/plain")
    assert r.status_code == 400


def test_delete_photo(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        photo_id = _upload_photo(client, plant_id, AUTH_HEADERS).json()["id"]
        r = client.delete(f"/photos/{photo_id}", headers=AUTH_HEADERS)
        assert r.status_code == 204
        photos = client.get(f"/plants/{plant_id}/photos", headers=AUTH_HEADERS).json()
    assert photos == []


def test_delete_photo_other_user_forbidden(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        photo_id = _upload_photo(client, plant_id, AUTH_HEADERS).json()["id"]
        r = client.delete(f"/photos/{photo_id}", headers=OTHER_HEADERS)
    assert r.status_code == 404


def test_delete_plant_cascades_photos(tmp_path):
    app, db_module, main_module = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        _upload_photo(client, plant_id, AUTH_HEADERS)
        client.delete(f"/plants/{plant_id}", headers=AUTH_HEADERS)
        db = db_module.SessionLocal()
        try:
            count = db.query(main_module.Photo).filter_by(plant_id=plant_id).count()
        finally:
            db.close()
    assert count == 0


# ---------------------------------------------------------------------------
# AI
# ---------------------------------------------------------------------------

def test_ai_ask_no_ollama_configured(tmp_path):
    os.environ["OLLAMA_URL"] = ""
    try:
        app, _, _ = load_app(tmp_path)
        with TestClient(app) as client:
            plant_id = _make_plant(client, AUTH_HEADERS)
            r = client.post(
                "/ai/ask",
                json={"plant_id": plant_id, "question": "How is my plant?"},
                headers=AUTH_HEADERS,
            )
        assert r.status_code == 503
        assert "not configured" in r.json()["detail"].lower()
    finally:
        os.environ.pop("OLLAMA_URL", None)


def test_ai_ask_nonexistent_plant(tmp_path):
    os.environ["OLLAMA_URL"] = "http://localhost:11434"
    try:
        app, _, _ = load_app(tmp_path)
        with TestClient(app) as client:
            r = client.post(
                "/ai/ask",
                json={"plant_id": 999, "question": "How is my plant?"},
                headers=AUTH_HEADERS,
            )
        assert r.status_code == 404
    finally:
        os.environ.pop("OLLAMA_URL", None)


def test_ai_ask_requires_auth(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.post("/ai/ask", json={"plant_id": 1, "question": "Hello?"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

def test_analytics_requires_auth(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.get("/analytics")
    assert r.status_code == 401


def test_analytics_empty(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        r = client.get("/analytics", headers=AUTH_HEADERS)
    assert r.status_code == 200
    body = r.json()
    assert body["total_plants"] == 0
    assert body["total_logs"] == 0
    assert body["total_photos"] == 0
    assert body["plant_stats"] == []
    assert len(body["activity_by_week"]) == 12
    assert all(w["count"] == 0 for w in body["activity_by_week"])


def test_analytics_counts(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        client.post("/logs", json={"plant_id": plant_id, "type": "watering"}, headers=AUTH_HEADERS)
        client.post("/logs", json={"plant_id": plant_id, "type": "fertilizing"}, headers=AUTH_HEADERS)
        _upload_photo(client, plant_id, AUTH_HEADERS)
        r = client.get("/analytics", headers=AUTH_HEADERS)
    assert r.status_code == 200
    body = r.json()
    assert body["total_plants"] == 1
    assert body["total_logs"] == 2
    assert body["total_photos"] == 1
    assert body["logs_by_type"]["watering"] == 1
    assert body["logs_by_type"]["fertilizing"] == 1
    assert len(body["plant_stats"]) == 1
    assert body["plant_stats"][0]["plant_name"] == "Basil"
    assert body["plant_stats"][0]["watering_count"] == 1


def test_analytics_isolated_per_user(tmp_path):
    app, _, _ = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)
        client.post("/logs", json={"plant_id": plant_id, "type": "watering"}, headers=AUTH_HEADERS)
        _make_plant(client, OTHER_HEADERS)
        r_user = client.get("/analytics", headers=AUTH_HEADERS)
        r_other = client.get("/analytics", headers=OTHER_HEADERS)
    assert r_user.json()["total_plants"] == 1
    assert r_other.json()["total_plants"] == 1
    assert r_user.json()["total_logs"] == 1
    assert r_other.json()["total_logs"] == 0


def test_analytics_avg_days_between_waterings(tmp_path):
    from datetime import datetime, timedelta, timezone
    app, db_module, main_module = load_app(tmp_path)
    with TestClient(app) as client:
        plant_id = _make_plant(client, AUTH_HEADERS)

    # Insert waterings 7 days apart directly
    now = datetime.now(timezone.utc)
    db = db_module.SessionLocal()
    try:
        db.add(main_module.Log(plant_id=plant_id, type="watering", created_at=now - timedelta(days=14)))
        db.add(main_module.Log(plant_id=plant_id, type="watering", created_at=now - timedelta(days=7)))
        db.add(main_module.Log(plant_id=plant_id, type="watering", created_at=now))
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        r = client.get("/analytics", headers=AUTH_HEADERS)
    stat = r.json()["plant_stats"][0]
    assert stat["watering_count"] == 3
    assert stat["avg_days_between_waterings"] == 7.0
