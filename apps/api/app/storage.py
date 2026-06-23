"""Photo storage abstraction.

Two backends share one interface so the rest of the app never cares where files
live:

* ``LocalStorage`` — writes to a directory on disk (default for local dev / Docker).
  Photos are served by FastAPI's ``StaticFiles`` mount, exactly as before.
* ``S3Storage`` — any S3-compatible object store (Cloudflare R2, Backblaze B2,
  Supabase Storage, AWS S3). Photos are served by redirecting to a presigned URL
  (or a public CDN URL if ``S3_PUBLIC_BASE_URL`` is set).

The backend is chosen at import time from environment variables: if ``S3_BUCKET``
is set, S3 is used; otherwise local disk. Object keys are ``"{plant_id}/{filename}"``
in both backends, so switching providers never rewrites keys.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Protocol, runtime_checkable

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/uploads"))


@runtime_checkable
class Storage(Protocol):
    is_local: bool

    def save(self, key: str, content: bytes, content_type: str | None = None) -> None: ...

    def delete(self, key: str) -> None: ...


class LocalStorage:
    """Stores files under ``base_dir`` on local disk."""

    is_local = True

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir

    def save(self, key: str, content: bytes, content_type: str | None = None) -> None:
        dest = self.base_dir / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)

    def delete(self, key: str) -> None:
        (self.base_dir / key).unlink(missing_ok=True)

    def path(self, key: str) -> Path:
        return self.base_dir / key


class S3Storage:
    """Stores files in an S3-compatible bucket via boto3."""

    is_local = False

    def __init__(
        self,
        *,
        bucket: str,
        endpoint_url: str | None,
        region: str,
        access_key: str | None,
        secret_key: str | None,
        public_base_url: str | None = None,
    ) -> None:
        import boto3  # imported lazily so local dev doesn't need boto3 installed

        self.bucket = bucket
        self.public_base_url = public_base_url
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

    def save(self, key: str, content: bytes, content_type: str | None = None) -> None:
        extra = {"ContentType": content_type} if content_type else {}
        self.client.put_object(Bucket=self.bucket, Key=key, Body=content, **extra)

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def url(self, key: str, expires: int = 3600) -> str:
        # A public bucket / CDN domain serves objects directly; otherwise sign a
        # short-lived GET URL.
        if self.public_base_url:
            return f"{self.public_base_url.rstrip('/')}/{key}"
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires,
        )


def get_storage() -> Storage:
    """Pick the storage backend from the environment (S3 if configured, else local)."""
    bucket = os.getenv("S3_BUCKET")
    if bucket:
        return S3Storage(
            bucket=bucket,
            endpoint_url=os.getenv("S3_ENDPOINT_URL") or None,
            region=os.getenv("S3_REGION", "auto"),
            access_key=os.getenv("S3_ACCESS_KEY_ID") or None,
            secret_key=os.getenv("S3_SECRET_ACCESS_KEY") or None,
            public_base_url=os.getenv("S3_PUBLIC_BASE_URL") or None,
        )
    return LocalStorage(UPLOAD_DIR)
