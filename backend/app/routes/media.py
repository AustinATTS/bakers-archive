# Media upload/management routes for The Baker's Archive.

import logging
import os
import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app import auth, models, storage
from app.blob_storage import delete_file, is_blob_enabled, store_file

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024

_ALLOWED_MIME_PREFIXES = ("image/", "video/", "application/pdf", "text/plain")

def _allowed_content_type(ct: str) -> bool:
    return any(ct.startswith(p) for p in _ALLOWED_MIME_PREFIXES)

def _safe_filename(filename: str) -> str:
    return os.path.basename(filename).replace("..", "").strip() or "upload"

def _media_url(item: Dict[str, Any]) -> str:
    key = item.get("storage_key", "")
    if key.startswith("https://"):
        return key
    api_url = os.environ.get("NEXT_PUBLIC_API_URL", "").rstrip("/")
    return f"{api_url}/media/{item['recipe_id']}/{item['filename']}"

@router.get("/{recipe_id}/media", response_model=List[models.MediaItem])
def list_media(recipe_id: str) -> List[models.MediaItem]:
    storage.validate_recipe_id(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    items = storage.list_media(recipe_id)
    return [
        models.MediaItem(
            **{k: v for k, v in item.items() if k != "storage_key"},
            url=_media_url(item),
        )
        for item in items
    ]

@router.post("/{recipe_id}/media", response_model=models.MediaItem, status_code=201)
async def upload_media(
    recipe_id: str,
    file: UploadFile = File(...),
    label: str = Form(default=""),
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> models.MediaItem:
    storage.validate_recipe_id(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")

    content_type = file.content_type or "application/octet-stream"
    if not _allowed_content_type(content_type):
        raise HTTPException(
            status_code=400,
            detail=f"File type '{content_type}' is not allowed. "
                   "Permitted: images, videos, PDFs, and plain text.",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB size limit.",
        )

    safe_name = _safe_filename(file.filename or "upload")
    media_id = str(uuid.uuid4())
    stored_name = f"{media_id}_{safe_name}"

    if is_blob_enabled():
        blob_path = f"recipes/{recipe_id}/{stored_name}"
        try:
            blob_url = await store_file(blob_path, data, content_type)
        except RuntimeError as exc:
            logger.error("Vercel Blob upload failed: %s", exc)
            raise HTTPException(
                status_code=502,
                detail="Failed to upload file to storage. Please try again later.",
            )

        item = storage.create_media(
            media_id=media_id,
            recipe_id=recipe_id,
            filename=stored_name,
            content_type=content_type,
            storage_key=blob_url,
            label=label,
        )
        url = blob_url
    else:
        dest_dir = storage.media_dir_for_recipe(recipe_id)
        dest_path = os.path.realpath(os.path.join(dest_dir, stored_name))
        if not dest_path.startswith(os.path.realpath(dest_dir) + os.sep):
            raise HTTPException(status_code=400, detail="Invalid file path.")

        with open(dest_path, "wb") as fh:
            fh.write(data)

        item = storage.create_media(
            media_id=media_id,
            recipe_id=recipe_id,
            filename=stored_name,
            content_type=content_type,
            storage_key=dest_path,
            label=label,
        )
        api_url = os.environ.get("NEXT_PUBLIC_API_URL", "").rstrip("/")
        url = f"{api_url}/media/{recipe_id}/{stored_name}"

    return models.MediaItem(
        **{k: v for k, v in item.items() if k != "storage_key"},
        url=url,
    )


@router.delete("/{recipe_id}/media/{media_id}", status_code=204)
async def delete_media(
    recipe_id: str,
    media_id: str,
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> None:
    storage.validate_recipe_id(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")

    storage_key = storage.delete_media(media_id)
    if storage_key is None:
        raise HTTPException(status_code=404, detail=f"Media item '{media_id}' not found")

    if storage_key and storage_key.startswith("https://"):
        try:
            await delete_file(storage_key)
        except RuntimeError:
            logger.warning(
                "Failed to delete blob %s for media %s; DB row already removed.",
                storage_key,
                media_id,
                exc_info=True,
            )
    elif storage_key and os.path.isfile(storage_key):
        try:
            os.remove(storage_key)
        except OSError:
            pass

media_file_router = APIRouter()

@media_file_router.get("/{recipe_id}/{filename}")
def serve_media_file(recipe_id: str, filename: str) -> FileResponse:
    storage.validate_recipe_id(recipe_id)
    safe_name = _safe_filename(filename)
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename")

    media_dir = os.path.join(storage.MEDIA_DIR, recipe_id)
    file_path = os.path.join(media_dir, safe_name)

    resolved = os.path.realpath(file_path)
    if not resolved.startswith(os.path.realpath(storage.MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path")

    if not os.path.isfile(resolved):
        raise HTTPException(status_code=404, detail="Media file not found")

    return FileResponse(resolved)