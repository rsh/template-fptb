"""Pydantic schemas for request/response validation."""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    username: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        """Validate username is alphanumeric."""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError(
                "Username must be alphanumeric (underscores and hyphens allowed)"
            )
        return v


class LoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class ItemCreateRequest(BaseModel):
    """Schema for creating an item."""

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[int] = None
    status: str = Field(default="active", pattern="^(active|inactive|archived)$")


class ItemUpdateRequest(BaseModel):
    """Schema for updating an item."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|archived)$")


class CategoryCreateRequest(BaseModel):
    """Schema for creating a category."""

    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
