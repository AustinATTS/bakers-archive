# Authentication utilities for The Baker's Archive

import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging

from app import storage

SECRET_KEY = os.environ.get("SECRET_KEY", "some-super-long-random-string")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

if SECRET_KEY == "some-super-long-random-string":
    logging.warning(
        "The Baker's Archive: SECRET_KEY is set to the default insecure value. "
        "Set the SECRET_KEY environment variable to a strong random string before deploying to production. "
    )

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

def _users_path() -> str:
    storage.ensure_recipes_dir()
    return os.path.join(storage.DATA_DIR, "users.json")

def _load_users() -> Dict[str, Any]:
    path = _users_path()
    if not os.path.isfile(path):
        return {}
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)

def _save_users(users: Dict[str, Any]) -> None:
    path = _users_path()
    with open(path, "w", encoding="utf-8") as file:
        json.dump(users, file, indent=2, ensure_ascii=False)

def ensure_admin_user() -> None:
    if not ADMIN_PASSWORD:
        return
    users = _load_users()
    if ADMIN_USERNAME not in users:
        users[ADMIN_USERNAME] = {
            "username": ADMIN_USERNAME,
            "password": pwd_context.hash(ADMIN_PASSWORD),
        }
        _save_users(users)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    users = _load_users()
    user = users.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user

def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise JWTError("Missing sub claim")
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    users = _load_users()
    user = users.get(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user