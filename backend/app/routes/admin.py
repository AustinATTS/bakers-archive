# Admin API routes for The Baker's Archive.

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
import os

from app import auth, models, storage
from app.blob_storage import is_blob_enabled, get_blob_usage
router = APIRouter()

@router.get("/users", response_model=List[models.UserPublic])
def list_users(
        _current_user: Dict[str, Any] = Depends(auth.require_admin),
) -> List[models.UserPublic]:
    return [
        models.UserPublic(username=u["username"], is_admin=u.get("is_admin", False))
        for u in storage.list_users()
    ]

@router.post("/users", response_model=models.UserPublic, status_code=201)
def create_user(
        user_create: models.AdminUserCreate,
        _current_user: Dict[str, Any] = Depends(auth.require_admin),
) -> models.UserPublic:
    if storage.get_user(user_create.username) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{user_create.username}' already exists.",
        )
    hashed = auth.pwd_context.hash(user_create.password)
    storage.upsert_user(user_create.username, hashed, is_admin=user_create.is_admin)
    return models.UserPublic(username=user_create.username, is_admin=user_create.is_admin)

@router.delete("/users/{username}", status_code=204)
def delete_user(
        username: str,
        current_user: Dict[str, Any] = Depends(auth.require_admin),
) -> None:
    if username == current_user["username"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )
    deleted = storage.delete_user(username)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{username}' not found.")

@router.get("/stats", response_model=models.AdminStats)
async def get_stats(
        _current_user: Dict[str, Any] = Depends(auth.require_admin),
) -> models.AdminStats:
    recipe_count = len(storage.list_recipe_ids())
    user_count = len(storage.list_users())
    media_count = storage.count_media() or 0
    blob_count = storage.count_blob_media() if is_blob_enabled() else 0
    db_size = storage.get_db_size_bytes()
    db_type = storage.get_db_type()
    media_storage = storage.get_media_storage_size_bytes()
    vercel_api_url = os.environ.get("VERCEL_API_PROJECT_URL", "")
    vercel_frontend_url = os.environ.get("VERCEL_FRONTEND_PROJECT_URL", "")

    blob_usage = await get_blob_usage()

    vercel_deployment = None
    if os.environ.get("VERCEL"):
        vercel_url = os.environ.get("VERCEL_URL", "")
        vercel_deployment = models.VercelDeploymentInfo(
            url=f"https://{vercel_url}" if vercel_url else "",
            environment=os.environ.get("VERCEL_ENV", ""),
            region=os.environ.get("VERCEL_REGION", ""),
            git_commit_sha=os.environ.get("VERCEL_GIT_COMMIT_SHA", ""),
            git_commit_message=os.environ.get("VERCEL_GIT_COMMIT_MESSAGE", ""),
            git_commit_author=os.environ.get("VERCEL_GIT_COMMIT_AUTHOR_NAME", ""),
            git_commit_ref=os.environ.get("VERCEL_GIT_COMMIT_REF", ""),
            git_repo=(
                f"{os.environ.get('VERCEL_GIT_REPO_OWNER', '')}"
                f"/{os.environ.get('VERCEL_GIT_REPO_SLUG', '')}"
                if os.environ.get("VERCEL_GIT_REPO_SLUG")
                else ""
            ),
        )
    return models.AdminStats(
        total_recipes=recipe_count,
        total_users=user_count,
        total_media=media_count,
        db_type=db_type,
        db_size_bytes=db_size,
        blob_enabled=is_blob_enabled(),
        blob_item_count=blob_count,
        blob_storage_used_bytes=blob_usage["total_size_bytes"],
        blob_storage_limit_bytes=blob_usage["limit_bytes"],
        blob_storage_usage_percent=blob_usage["usage_percent"],
        media_storage_used_bytes=media_storage,
        vercel_api_url=vercel_api_url,
        vercel_frontend_url=vercel_frontend_url,
        vercel_deployment=vercel_deployment,
    )