# Pydantic models for The Baker's Archive.

from typing import List, Optional
from pydantic import BaseModel, Field

class RecipeMeta(BaseModel):
    id: str = Field(..., description="Unique recipe identifier")
    name: str = Field(..., description="Recipe name")
    author: str = Field(..., description="Recipe author")
    book: str = Field(default="", description="Source book or reference")
    type: str = Field(..., description="Bread type")
    ingredients: List[str] = Field(default_factory=list, description="List of ingredients")
    tags: List[str] = Field(default_factory=list, description="Searchable tags")

class RecipeCreate(BaseModel):
    name: str = Field(..., description="Recipe name")
    author: str = Field(..., description="Recipe author")
    book: str = Field(default="", description="Source book or reference")
    type: str = Field(..., description="Bread type")
    ingredients: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    recipe_text: str = Field(default="", description="Recipe instructions")
    notes: str = Field(default="", description="Personal notes")

class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    author: Optional[str] = None
    book: Optional[str] = None
    type: Optional[str] = None
    ingredients: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class NoteUpdate(BaseModel):
    content: str = Field(..., description="Notes text content")

class RecipeTextUpdate(BaseModel):
    content: str = Field(..., description="Recipe text content")

class LoginRequest(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")

class Token(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="Bearer", description="Token type")

class UserPublic(BaseModel):
    username: str = Field(..., description="Username")
    is_admin: bool = Field(default=False, description="Whether the user has admin privileges")

class MediaItem(BaseModel):
    id: str = Field(..., description="UUID of the media item")
    recipe_id: str = Field(..., description="Owning recipe ID")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(default="", description="MIME type")
    url: str = Field(..., description="URL to access the media file")
    label: str = Field(default="", description="Optional human-readable label")
    created_at: Optional[str] = Field(default=None, description="ISO8601 creation timestamp")

class AdminUserCreate(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Plain-text password")
    is_admin: bool = Field(default=False, description="Whether the new user is an admin")

class AdminStats(BaseModel):
    total_recipes: int = Field(..., description="Total number of recipes")
    total_users: int = Field(..., description="Total number of users")
    total_media: int = Field(..., description="Total number of media items")
    db_type: str = Field(default="unknown", description="Database backend type (sqlite or postgresql)")
    db_size_bytes: int = Field(default=0, description="Approximate database size in bytes")
    blob_enabled: bool = Field(default=False, description="Whether Vercel Blob storage is configured")
    blob_item_count: int = Field(default=0, description="Number of media items stored in Vercel Blob")
    blob_storage_used_bytes: int = Field(default=0, description="Total bytes used in Vercel Blob storage")
    blob_storage_limit_bytes: int = Field(default=0, description="Vercel Blob storage limit in bytes")
    blob_storage_usage_percent: float = Field(default=0.0, description="Percentage of Blob storage used")
    media_storage_used_bytes: int = Field(default=0, description="Total bytes used by local media files")
    vercel_api_url: str = Field(default="", description="Vercel API project URL if configured")
    vercel_frontend_url: str = Field(default="", description="Vercel frontend project URL if configured")
    vercel_deployment: Optional["VercelDeploymentInfo"] = Field(default=None,
                                                                description="Current Vercel deployment info")

class VercelDeploymentInfo(BaseModel):
    url: str = Field(default="", description="Deployment URL")
    environment: str = Field(default="", description="Deployment environment (production/preview/development)")
    region: str = Field(default="", description="Deployment region")
    git_commit_sha: str = Field(default="", description="Git commit SHA")
    git_commit_message: str = Field(default="", description="Git commit message")
    git_commit_author: str = Field(default="", description="Git commit author")
    git_commit_ref: str = Field(default="", description="Git branch name")
    git_repo: str = Field(default="", description="Git repository slug (owner/repo)")

AdminStats.model_rebuild()