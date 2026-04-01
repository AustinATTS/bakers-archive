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