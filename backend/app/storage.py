# File-based storage utilities for The Baker's Archive.

import json
import os
import re
import shutil
from typing import Any, Dict, List, Optional

DATA_DIR = "/tmp/data"
RECIPES_DIR = os.path.join(DATA_DIR, "recipes")

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")

def _validate_recipe_id(recipe_id: str) -> None:
    if not recipe_id or not _SAFE_ID_RE.match(recipe_id):
        raise ValueError(
            f"Invalid recipe ID '{recipe_id}': must contain only "
            "alphanumerics, hyphens, and underscores"
        )

def ensure_recipes_dir() -> None:
    os.makedirs(RECIPES_DIR, exist_ok=True)

def get_recipe_dir(recipe_id: str) -> str:
    _validate_recipe_id(recipe_id)
    recipes_base = os.path.realpath(RECIPES_DIR)
    recipe_dir = os.path.realpath(os.path.join(recipes_base, recipe_id))
    if not recipe_dir.startswith(recipes_base + os.sep):
        raise ValueError(
            f"Invalid recipe ID '{recipe_id}': resolves outside the recipes directory."
        )
    return recipe_dir

def recipe_exists(recipe_id: str) -> bool:
    try:
        return os.path.isdir(get_recipe_dir(recipe_id))
    except ValueError:
        return False

def list_recipe_ids() -> List[str]:
    ensure_recipes_dir()
    return [
        entry
        for entry in os.listdir(RECIPES_DIR)
        if os.path.isdir(os.path.join(RECIPES_DIR, entry))
    ]

def read_meta(recipe_id: str) -> Optional[Dict[str, Any]]:
    meta_path = os.path.join(get_recipe_dir(recipe_id), "meta.json")
    if not os.path.isfile(meta_path):
        return None
    with open(meta_path, "r", encoding="utf-8") as file:
        return json.load(file)

def write_meta(recipe_id: str, data: Dict[str, Any]) -> None:
    recipe_dir = get_recipe_dir(recipe_id)
    os.makedirs(recipe_dir, exist_ok=True)
    meta_path = os.path.join(recipe_dir, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

def read_text_file(recipe_id: str, filename: str) -> Optional[str]:
    file_path = os.path.join(get_recipe_dir(recipe_id), filename)
    if not os.path.isfile(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

def write_text_file(recipe_id: str, filename: str, content: str) -> None:
    recipe_dir = get_recipe_dir(recipe_id)
    os.makedirs(recipe_dir, exist_ok=True)
    file_path = os.path.join(recipe_dir, filename)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)

def delete_recipe_dir(recipe_id: str) -> None:
    recipe_dir = get_recipe_dir(recipe_id)
    if os.path.isdir(recipe_dir):
        shutil.rmtree(recipe_dir)