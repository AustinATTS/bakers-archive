# Abstraction layer for media file storage.

import os
from typing import Optional
import httpx

BLOB_READ_WRITE_TOKEN: Optional[str] = os.environ.get("BLOB_READ_WRITE_TOKEN")
_BLOB_API_VERSION = "7"
_BLOB_BASE_URL = "https://5hjirotlmd6hrivk.public.blob.vercel-storage.com"

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