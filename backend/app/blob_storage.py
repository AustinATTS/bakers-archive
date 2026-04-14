# Abstraction layer for media file storage.

import os
from typing import Optional, Any, Dict
import httpx
import logging

logger = logging.getLogger(__name__)

BLOB_READ_WRITE_TOKEN: Optional[str] = os.environ.get("BLOB_READ_WRITE_TOKEN")
_BLOB_API_VERSION = "7"
_BLOB_BASE_URL = "https://blob.vercel-storage.com"

BLOB_STORAGE_LIMIT_BYTES: int = int(
    os.environ.get("BLOB_STORAGE_LIMIT_BYTES", str(500 * 1024 * 1024))
)

def is_blob_enabled() -> bool:
    return bool(BLOB_READ_WRITE_TOKEN)

async def store_file(pathname: str, data: bytes, content_type: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{_BLOB_BASE_URL}/{pathname}",
            content=data,
            headers={
                "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
                "x-api-version": _BLOB_API_VERSION,
                "content-type": content_type,
            },
            timeout=60.0,
        )
    if resp.status_code not in (200, 201):
        raise RuntimeError(
            f"Vercel Blob upload failed ({resp.status_code}): {resp.text}"
        )
    try:
        body = resp.json()
    except Exception as exc:
        raise RuntimeError(
            f"Vercel Blob returned a non-JSON response: {resp.text[:200]}"
        ) from exc
    url = body.get("url")
    if not url:
        raise RuntimeError(
            "Vercel Blob response did not include a 'url' field."
        )
    return url


async def delete_file(blob_url: str) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BLOB_BASE_URL}/delete",
            json={"urls": [blob_url]},
            headers={
                "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
                "x-api-version": _BLOB_API_VERSION,
            },
            timeout=30.0,
        )
    if resp.status_code not in (200, 404):
        raise RuntimeError(
            f"Vercel Blob delete failed ({resp.status_code}): {resp.text}"
        )

async def get_blob_usage() -> Dict[str, Any]:
    if not BLOB_READ_WRITE_TOKEN:
        return {
            "total_count": 0,
            "total_size_bytes": 0,
            "limit_bytes": BLOB_STORAGE_LIMIT_BYTES,
            "usage_percent": 0.0,
        }

    total_count = 0
    total_size = 0
    cursor: Optional[str] = None

    try:
        async with httpx.AsyncClient() as client:
            while True:
                params: Dict[str, str] = {"limit": "1000"}
                if cursor:
                    params["cursor"] = cursor

                resp = await client.get(
                    _BLOB_BASE_URL,
                    params=params,
                    headers={
                        "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
                        "x-api-version": _BLOB_API_VERSION,
                    },
                    timeout=30.0,
                )
                if resp.status_code != 200:
                    break

                body = resp.json()
                blobs = body.get("blobs", [])
                for blob in blobs:
                    total_count += 1
                    total_size += blob.get("size", 0)

                if body.get("hasMore") and body.get("cursor"):
                    cursor = body["cursor"]
                else:
                    break
    except Exception:
        logger.warning("Failed to fetch Vercel Blob usage data", exc_info=True)

    usage_pct = (
        (total_size / BLOB_STORAGE_LIMIT_BYTES * 100)
        if BLOB_STORAGE_LIMIT_BYTES > 0
        else 0.0
    )
    return {
        "total_count": total_count,
        "total_size_bytes": total_size,
        "limit_bytes": BLOB_STORAGE_LIMIT_BYTES,
        "usage_percent": round(usage_pct, 2),
    }