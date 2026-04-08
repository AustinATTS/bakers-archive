# Admin API routes for The Baker's Archive.

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app import auth, models, storage

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
def get_stats(
        _current_user: Dict[str, Any] = Depends(auth.require_admin),
) -> models.AdminStats:
    recipe_count = len(storage.list_recipe_ids())
    user_count = len(storage.list_users())
    media_count = storage.count_media()
    return models.AdminStats(
        total_recipes=recipe_count,
        total_users=user_count,
        total_media=media_count,
    )