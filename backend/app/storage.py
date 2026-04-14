# Database storage utilities for The Baker's Archive.

import json
import os
import re
import shutil
from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional
from sqlalchemy import Column, String, Text, create_engine, Boolean, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////tmp/archive.db")

_connect_args: Dict[str, Any] = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_BUNDLE_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")

class Base(DeclarativeBase):
    pass

class RecipeRow(Base):
    __tablename__ = "recipes"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    author = Column(String, nullable=False, default="")
    book = Column(String, nullable=False, default="")
    type = Column(String, nullable=False, default="")
    ingredients = Column(Text, nullable=False, default="[]")
    tags = Column(Text, nullable=False, default="[]")
    recipe_text = Column(Text, nullable=False, default="")
    notes = Column(Text, nullable=False, default="")

class UserRow(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)

class MediaRow(Base):
    __tablename__ = "media"

    id = Column(String, primary_key=True)
    recipe_id = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False, default="")
    storage_key = Column(String, nullable=False, default="")
    label = Column(String, nullable=False, default="")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

@contextmanager
def _session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    Base.metadata.create_all(bind=engine)

def ensure_recipes_dir() -> None:
    """..."""

def _validate_recipe_id(recipe_id: str) -> None:
    if not recipe_id or not _SAFE_ID_RE.match(recipe_id):
        raise ValueError(
            f"Invalid recipe ID '{recipe_id}': must contain only "
            "alphanumerics, hyphens, and underscores."
        )

def validate_recipe_id(recipe_id: str) -> None:
    _validate_recipe_id(recipe_id)

def recipe_exists(recipe_id: str) -> bool:
    try:
        _validate_recipe_id(recipe_id)
    except ValueError:
        return False
    with _session() as db:
        return db.get(RecipeRow, recipe_id) is not None

def list_recipe_ids() -> List[str]:
    with _session() as db:
        return [row.id for row in db.query(RecipeRow).all()]

def read_meta(recipe_id: str) -> Optional[Dict[str, Any]]:
    _validate_recipe_id(recipe_id)
    with _session() as db:
        row = db.get(RecipeRow, recipe_id)
        if row is None:
            return None
        return {
            "id": row.id,
            "name": row.name,
            "author": row.author,
            "book": row.book,
            "type": row.type,
            "ingredients": json.loads(row.ingredients or "[]"),
            "tags": json.loads(row.tags or "[]"),
        }

def write_meta(recipe_id: str, data: Dict[str, Any]) -> None:
    _validate_recipe_id(recipe_id)
    with _session() as db:
        row = db.get(RecipeRow, recipe_id)
        if row is None:
            row = RecipeRow(
                id=recipe_id,
                name=data.get("name", ""),
                author=data.get("author", ""),
                book=data.get("book", ""),
                type=data.get("type", ""),
                ingredients=json.dumps(data.get("ingredients", [])),
                tags=json.dumps(data.get("tags", [])),
            )
            db.add(row)
        else:
            row.name = data.get("name", row.name)
            row.author = data.get("author", row.author)
            row.book = data.get("book", row.book)
            row.type = data.get("type", row.type)
            row.ingredients = json.dumps(
                data.get("ingredients", json.loads(row.ingredients or "[]"))
            )
            row.tags = json.dumps(
                data.get("tags", json.loads(row.tags or "[]"))
            )
        db.commit()

def read_text_file(recipe_id: str, filename: str) -> Optional[str]:
    _validate_recipe_id(recipe_id)
    with _session() as db:
        row = db.get(RecipeRow, recipe_id)
        if row is None:
            return None
        if filename == "recipe.txt":
            return row.recipe_text or ""
        if filename == "notes.txt":
            return row.notes or ""
        return None

def write_text_file(recipe_id: str, filename: str, content: str) -> None:
    _validate_recipe_id(recipe_id)
    with _session() as db:
        row = db.get(RecipeRow, recipe_id)
        if row is None:
            raise ValueError(f"Recipe '{recipe_id}' does not exist.")
        if filename == "recipe.txt":
            row.recipe_text = content
        elif filename == "notes.txt":
            row.notes = content
        db.commit()

def delete_recipe_dir(recipe_id: str) -> None:
    _validate_recipe_id(recipe_id)
    with _session() as db:
        row = db.get(RecipeRow, recipe_id)
        if row is not None:
            db.delete(row)
            db.commit()

def get_user(username: str) -> Optional[Dict[str, Any]]:
    with _session() as db:
        row = db.get(UserRow, username)
        if row is None:
            return None
        return {"username": row.username, "hashed_password": row.hashed_password, "is_admin": bool(row.is_admin)}

def list_users() -> List[Dict[str, Any]]:
    with _session() as db:
        return [
            {"username": row.username, "is_admin": bool(row.is_admin)}
            for row in db.query(UserRow).all()
        ]

def upsert_user(username: str, hashed_password: str, is_admin: bool = False) -> None:
    with _session() as db:
        row = db.get(UserRow, username)
        if row is None:
            db.add(UserRow(username=username, hashed_password=hashed_password, is_admin=is_admin))
        else:
            row.hashed_password = hashed_password
            row.is_admin = is_admin
        db.commit()

def delete_user(username: str) -> bool:
    with _session as db:
        row = db.get(UserRow, username)
        if row is None:
            return False
        db.delete(row)
        db.commit()
        return True

_MEDIA_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "media")
MEDIA_DIR = os.environ.get("MEDIA_DIR", _MEDIA_DATA_DIR)

def media_dir_for_recipe(recipe_id: str) -> str:
    _validate_recipe_id(recipe_id)

    base = os.path.realpath(MEDIA_DIR)
    path = os.path.realpath(os.path.join(base, recipe_id))
    if not path.startswith(base + os.sep) and path != base:
        raise ValueError(f"Invalid recipe_id produces unsafe path: {recipe_id!r}")
    os.makedirs(path, exist_ok=True)
    return path

def create_media(
        media_id: str,
        recipe_id: str,
        filename: str,
        content_type: str,
        storage_key: str,
        label: str = "",
) -> Dict[str, Any]:
    with _session() as db:
        row = MediaRow(
            id=media_id,
            recipe_id=recipe_id,
            filename=filename,
            content_type=content_type,
            storage_key=storage_key,
            label=label,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return _media_row_to_dict(row)

def list_media(recipe_id: str) -> List[Dict[str, Any]]:
    with _session() as db:
        rows = db.query(MediaRow).filter(MediaRow.recipe_id == recipe_id).all()
        return [_media_row_to_dict(r) for r in rows]

def get_media(media_id: str) -> Optional[Dict[str, Any]]:
    with _session() as db:
        row = db.get(MediaRow, media_id)
        if row is None:
            return None
        return _media_row_to_dict(row)

def delete_media(media_id: str) -> Optional[str]:
    with _session() as db:
        row = db.get(MediaRow, media_id)
        if row is None:
            return None
        key = row.storage_key
        db.delete(row)
        db.commit()
        return key

def count_media() -> int:
    with _session() as db:
        return
    db.query(MediaRow).count()

def _media_row_to_dict(row: MediaRow) -> Dict[str, Any]:
    return {
        "id": row.id,
        "recipe_id": row.recipe_id,
        "filename": row.filename,
        "content_type": row.content_type,
        "storage_key": row.storage_key,
        "label": row.label,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }

def seed_data_from_bundle() -> None:
    bundle_recipes = os.path.join(_BUNDLE_DATA_DIR, "recipes")
    if not os.path.isdir(bundle_recipes):
        return
    for entry in os.listdir(bundle_recipes):
        src = os.path.join(bundle_recipes, entry)
        if not os.path.isdir(src):
            continue
        meta_path = os.path.join(src, "meta.json")
        if not os.path.isfile(meta_path):
            continue
        with open(meta_path, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
        recipe_id = meta.get("id")
        if not recipe_id:
            continue
        with _session() as db:
            if db.get(RecipeRow, recipe_id) is not None:
                continue
        recipe_text = ""
        recipe_txt_path = os.path.join(src, "recipe.txt")
        if os.path.isfile(recipe_txt_path):
            with open(recipe_txt_path, "r", encoding="utf-8") as fh:
                recipe_text = fh.read()
        notes = ""
        notes_path = os.path.join(src, "notes.txt")
        if os.path.isfile(notes_path):
            with open(notes_path, "r", encoding="utf-8") as fh:
                notes = fh.read()
        with _session() as db:
            db.add(
                RecipeRow(
                    id=recipe_id,
                    name=meta.get("name", ""),
                    author=meta.get("author", ""),
                    book=meta.get("book", ""),
                    type=meta.get("type", ""),
                    ingredients=json.dumps(meta.get("ingredients", [])),
                    tags=json.dumps(meta.get("tags", [])),
                    recipe_text=recipe_text,
                    notes=notes,
                )
            )
            db.commit()