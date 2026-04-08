# Authentication API routes for The Baker's Archive.

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from app import auth, models

router = APIRouter()

@router.post("/login", response_model=models.Token)
def login(login_request: models.LoginRequest) -> Dict[str, Any]:
    user = auth.authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.create_access_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=models.UserPublic)
def get_me(current_user: Dict[str, Any] = Depends(auth.get_current_user)) -> Dict[str, Any]:
    return {"username": current_user["username"]}