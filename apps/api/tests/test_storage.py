"""Tests for the storage backends (LocalStorage, S3Storage) and db engine config."""
# pylint: disable=import-outside-toplevel
from __future__ import annotations

import importlib
from unittest.mock import MagicMock, patch


def _fresh_storage_module():
    import app.storage as storage_module

    return importlib.reload(storage_module)


def test_local_storage_is_default(tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    storage_module = _fresh_storage_module()

    storage = storage_module.get_storage()
    assert isinstance(storage, storage_module.LocalStorage)
    assert storage.is_local is True


def test_local_storage_save_delete_roundtrip(tmp_path):
    from app.storage import LocalStorage

    storage = LocalStorage(tmp_path)
    key = "7/photo.jpg"
    storage.save(key, b"\xff\xd8\xff bytes", content_type="image/jpeg")

    saved = tmp_path / "7" / "photo.jpg"
    assert saved.exists()
    assert saved.read_bytes() == b"\xff\xd8\xff bytes"
    assert storage.path(key) == saved

    storage.delete(key)
    assert not saved.exists()
    # Deleting a missing key is a no-op, not an error.
    storage.delete(key)


def test_s3_storage_selected_when_bucket_set(monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "plants-photos")
    monkeypatch.setenv("S3_ENDPOINT_URL", "https://example.r2.cloudflarestorage.com")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "key")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "secret")
    storage_module = _fresh_storage_module()

    storage = storage_module.get_storage()
    assert isinstance(storage, storage_module.S3Storage)
    assert storage.is_local is False
    assert storage.bucket == "plants-photos"

    # Reset so other test modules see the default backend again.
    monkeypatch.delenv("S3_BUCKET", raising=False)
    _fresh_storage_module()


def test_s3_public_base_url_builds_direct_url(monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "plants-photos")
    monkeypatch.setenv("S3_PUBLIC_BASE_URL", "https://cdn.example.com")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "key")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "secret")
    storage_module = _fresh_storage_module()

    storage = storage_module.get_storage()
    # With a public base URL we serve a direct (CDN) URL, no presigning needed.
    assert storage.url("7/photo.jpg") == "https://cdn.example.com/7/photo.jpg"

    monkeypatch.delenv("S3_BUCKET", raising=False)
    _fresh_storage_module()


def test_s3_storage_save_delete_and_presigned_url():
    """S3Storage save, delete, and presigned-URL methods exercise with mocked boto3."""
    from app.storage import S3Storage

    mock_client = MagicMock()
    with patch("boto3.client", return_value=mock_client):
        storage = S3Storage(
            bucket="test-bucket",
            endpoint_url="https://example.r2.cloudflarestorage.com",
            region="auto",
            access_key="key",
            secret_key="secret",
        )

    # save with content_type
    storage.save("7/photo.jpg", b"imgdata", content_type="image/jpeg")
    mock_client.put_object.assert_called_with(
        Bucket="test-bucket", Key="7/photo.jpg", Body=b"imgdata", ContentType="image/jpeg"
    )

    # save without content_type (extra dict should be empty)
    storage.save("7/photo.jpg", b"imgdata")
    mock_client.put_object.assert_called_with(
        Bucket="test-bucket", Key="7/photo.jpg", Body=b"imgdata"
    )

    # delete
    storage.delete("7/photo.jpg")
    mock_client.delete_object.assert_called_with(Bucket="test-bucket", Key="7/photo.jpg")

    # presigned URL (no public_base_url set)
    mock_client.generate_presigned_url.return_value = "https://signed.example.com/7/photo.jpg"
    url = storage.url("7/photo.jpg")
    assert url == "https://signed.example.com/7/photo.jpg"
    mock_client.generate_presigned_url.assert_called_with(
        "get_object",
        Params={"Bucket": "test-bucket", "Key": "7/photo.jpg"},
        ExpiresIn=3600,
    )


def test_db_non_sqlite_branch(monkeypatch):
    """db.py skips check_same_thread when DATABASE_URL is not SQLite."""
    import app.db as db_module

    # Use psycopg dialect (psycopg v3 is installed); create_engine is lazy — no connection attempt.
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@localhost/testdb")
    try:
        importlib.reload(db_module)
        assert "check_same_thread" not in db_module.engine_kwargs
    finally:
        monkeypatch.setenv("DATABASE_URL", "sqlite:///./plants.db")
        importlib.reload(db_module)
