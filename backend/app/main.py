# Main FastAPI application module for The Baker's Archive.

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import recipes

app = FastAPI(
    title="The Baker's Archive",
    description="API for managing bread recipes",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])

@app.get("/")
def root():
    return {"message": "The Baker's Archive API", "version": "0.1.0"}