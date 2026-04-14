# Recipe API routes for The Baker's Archive.

import os
import re
import uuid
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Query, Depends

from app import models, storage, auth

router = APIRouter()

def _validate_recipe_id_safe(recipe_id: str) -> None:
    try:
        storage.validate_recipe_id(recipe_id)
    except ValueError as exception:
        raise HTTPException(status_code=400, detail=str(exception)) from exception

def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    return slug

@router.get("", response_model=List[models.RecipeMeta])
def list_recipes() -> List[models.RecipeMeta]:
    recipe_ids = storage.list_recipe_ids()
    recipes = []
    for recipe_id in recipe_ids:
        meta = storage.read_meta(recipe_id)
        if meta:
            recipes.append(models.RecipeMeta(**meta))
    return recipes

@router.get("/search", response_model=List[models.RecipeMeta])
def search_recipes(
        query: Optional[str] = Query(None, description="Text query"),
        type: Optional[str] = Query(None, description="Filer by bread type"),
        author: Optional[str] = Query(None, description="Filter by author"),
        tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
) -> List[models.RecipeMeta]:
    all_recipes = list_recipes()
    results = []

    tag_list = [tag.strip().lower() for tag in tags.split(",")] if tags else []

    for recipe in all_recipes:
        if type and recipe.type.lower() != type.lower():
            continue
        if author and recipe.author.lower() != author.lower():
            continue
        if tag_list and not any(tag in [recipe_tag.lower() for recipe_tag in recipe.tags] for tag in tag_list):
            continue
        if query:
            query_lower = query.lower()
            in_name = query_lower in recipe.name.lower()
            in_ingredients = any(query_lower in ingredients.lower() for ingredients in recipe.ingredients)
            in_tags = any(query_lower in tag.lower() for tag in recipe.tags)
            if not (in_name or in_ingredients or in_tags):
                continue
        results.append(recipe)

    return results

@router.get("/{recipe_id}", response_model=models.RecipeMeta)
def get_recipe(recipe_id: str) -> models.RecipeMeta:
    _validate_recipe_id_safe(recipe_id)
    meta = storage.read_meta(recipe_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    return models.RecipeMeta(**meta)

@router.get("/{recipe_id}/recipe")
def get_recipe_text(recipe_id: str) -> dict:
    _validate_recipe_id_safe(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    content = storage.read_text_file(recipe_id, "recipe.txt") or ""
    return {"content": content}

@router.get("/{recipe_id}/notes")
def get_recipe_notes(recipe_id: str) -> dict:
    _validate_recipe_id_safe(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    content = storage.read_text_file(recipe_id, "notes.txt") or ""
    return {"content": content}

@router.put("/{recipe_id}/notes")
def update_notes(
    recipe_id: str,
    note_update: models.NoteUpdate,
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> dict:
    _validate_recipe_id_safe(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    storage.write_text_file(recipe_id, "notes.txt", note_update.content)
    return {"message": "Notes updated successfully"}

@router.put("/{recipe_id}/recipe")
def update_recipe_text(
    recipe_id: str,
    recipe_update: models.RecipeTextUpdate,
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> dict:
    _validate_recipe_id_safe(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    storage.write_text_file(recipe_id, "recipe.txt", recipe_update.content)
    return {"message": "Recipe updated successfully"}

@router.put("/{recipe_id}/meta", response_model=models.RecipeMeta)
def update_recipe_meta(
    recipe_id: str,
    recipe_update: models.RecipeUpdate,
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> models.RecipeMeta:
    _validate_recipe_id_safe(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    update_data: Dict[str, Any] = {}
    if recipe_update.name is not None:
        update_data["name"] = recipe_update.name
    if recipe_update.author is not None:
        update_data["author"] = recipe_update.author
    if recipe_update.book is not None:
        update_data["book"] = recipe_update.book
    if recipe_update.type is not None:
        update_data["type"] = recipe_update.type
    if recipe_update.ingredients is not None:
        update_data["ingredients"] = recipe_update.ingredients
    if recipe_update.tags is not None:
        update_data["tags"] = recipe_update.tags
    if update_data:
        storage.write_meta(recipe_id, update_data)
    meta = storage.read_meta(recipe_id)
    if not meta:
        raise HTTPException(status_code=500, detail="Failed to read recipe after update")
    return models.RecipeMeta(**meta)

@router.post("", response_model=models.RecipeMeta, status_code=201)
def create_recipe(
    recipe_create: models.RecipeCreate,
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> models.RecipeMeta:
    recipe_id = _slugify(recipe_create.name) or str(uuid.uuid4())
    if storage.recipe_exists(recipe_id):
        recipe_id = f"{recipe_id}-{str(uuid.uuid4())[:8]}"
    _validate_recipe_id_safe(recipe_id)

    meta_data = {
        "id": recipe_id,
        "name": recipe_create.name,
        "author": recipe_create.author,
        "book": recipe_create.book,
        "type": recipe_create.type,
        "ingredients": recipe_create.ingredients,
        "tags": recipe_create.tags,
    }
    storage.write_meta(recipe_id, meta_data)
    storage.write_text_file(recipe_id, "recipe.txt", recipe_create.recipe_text)
    storage.write_text_file(recipe_id, "notes.txt", recipe_create.notes)

    return models.RecipeMeta(**meta_data)

@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(
    recipe_id: str,
    _current_user: Dict[str, Any] = Depends(auth.get_current_user),
) -> None:
    _validate_recipe_id_safe(recipe_id)
    if not storage.recipe_exists(recipe_id):
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found")
    storage.delete_recipe_dir(recipe_id)