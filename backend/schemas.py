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


class TodoCreateRequest(BaseModel):
    """Schema for creating a todo."""

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    importance: int = Field(default=2, ge=1, le=4)
    urgency: int = Field(default=2, ge=1, le=4)
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed)$")


class TodoUpdateRequest(BaseModel):
    """Schema for updating a todo."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    importance: Optional[int] = Field(None, ge=1, le=4)
    urgency: Optional[int] = Field(None, ge=1, le=4)
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")
