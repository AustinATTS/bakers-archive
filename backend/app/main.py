# Main FastAPI application module for The Baker's Archive.

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.routes import recipes
from app.routes import auth as auth_routes
from app import auth, storage

ALLOWED_ORIGINS_RAW = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://frontend:3000",
)
_ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_RAW.split(",") if o.strip()]

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    storage.init_db()
    storage.seed_data_from_bundle()
    auth.ensure_admin_user()
    yield

app = FastAPI(
    title="The Baker's Archive",
    description="API for managing bread recipes",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])

@app.get("/")
def root():
    return {"message": "The Baker's Archive API", "version": "0.2.0"}