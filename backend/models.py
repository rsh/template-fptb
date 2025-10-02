"""Database models - example template with User and domain models."""
from datetime import datetime
from typing import Any, Dict, List, cast

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


class User(db.Model):  # type: ignore  # db.Model lacks type stubs
    """User model for authentication and profile management."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships - customize based on your domain
    items = cast(
        List["Item"],
        db.relationship("Item", back_populates="owner", cascade="all, delete-orphan"),
    )

    def set_password(self, password: str) -> None:
        """Hash and set user password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Check if provided password matches hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email: bool = False) -> Dict[str, Any]:
        """Convert user to dictionary."""
        data: Dict[str, Any] = {
            "id": self.id,
            "username": self.username,
            "created_at": self.created_at.isoformat(),
        }
        if include_email:
            data["email"] = self.email
        return data


class Category(db.Model):  # type: ignore  # db.Model lacks type stubs
    """Example category model - demonstrates a simple lookup table."""

    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    items = cast(
        List["Item"],
        db.relationship("Item", back_populates="category"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert category to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
        }


class Item(db.Model):  # type: ignore  # db.Model lacks type stubs
    """Example item model - demonstrates a typical domain entity with relationships."""

    __tablename__ = "items"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="active")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    category = cast("Category", db.relationship("Category", back_populates="items"))
    owner = cast("User", db.relationship("User", back_populates="items"))

    def to_dict(self) -> Dict[str, Any]:
        """Convert item to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category.to_dict() if self.category else None,
            "owner": self.owner.to_dict() if self.owner else None,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
