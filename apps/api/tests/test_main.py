from __future__ import annotations

import importlib
import os
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
    return main_module.app, main_module


def test_create_plant(tmp_path):
    app, _main = load_app(tmp_path)

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
    app, _main = load_app(tmp_path)

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
