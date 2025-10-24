"""Database models - example template with User and domain models."""
from datetime import datetime, timezone
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
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    todos = cast(
        List["Todo"],
        db.relationship("Todo", back_populates="owner", cascade="all, delete-orphan"),
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


class Todo(db.Model):  # type: ignore  # db.Model lacks type stubs
    """Todo model with importance and urgency prioritization."""

    __tablename__ = "todos"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="pending")

    # Importance and Urgency: 1=Low, 2=Medium, 3=High, 4=Critical
    importance = db.Column(db.Integer, nullable=False, default=2)
    urgency = db.Column(db.Integer, nullable=False, default=2)

    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner = cast("User", db.relationship("User", back_populates="todos"))

    # Add check constraints for importance and urgency values
    __table_args__ = (
        db.CheckConstraint("importance BETWEEN 1 AND 4", name="check_importance"),
        db.CheckConstraint("urgency BETWEEN 1 AND 4", name="check_urgency"),
    )

    def priority_score(self) -> float:
        """Calculate weighted priority score (importance 60%, urgency 40%)."""
        return (self.importance * 0.6) + (self.urgency * 0.4)

    @staticmethod
    def get_level_name(level: int) -> str:
        """Get name for importance/urgency level."""
        levels = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
        return levels.get(level, "Medium")

    @staticmethod
    def get_level_icon(level: int) -> str:
        """Get SVG icon for importance/urgency level."""
        icons = {
            1: (
                '<svg width="16" height="16" viewBox="0 0 16 16" '
                'xmlns="http://www.w3.org/2000/svg">'
                '<circle cx="8" cy="8" r="7" fill="#FFC107"/></svg>'
            ),  # Low - yellow circle
            2: (
                '<svg width="16" height="16" viewBox="0 0 16 16" '
                'xmlns="http://www.w3.org/2000/svg">'
                '<path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>'
            ),  # Medium - deep orange triangle
            3: (
                '<svg width="16" height="16" viewBox="0 0 16 16" '
                'xmlns="http://www.w3.org/2000/svg">'
                '<rect x="2" y="2" width="12" height="12" fill="#F44336"/>'
                "</svg>"
            ),  # High - red square
            4: (
                '<svg width="16" height="16" viewBox="0 0 16 16" '
                'xmlns="http://www.w3.org/2000/svg">'
                '<path d="M8 1 L10 6 L15 7 L11 11 L12 16 L8 13 L4 16 '
                'L5 11 L1 7 L6 6 Z" fill="#2196F3"/></svg>'
            ),  # Critical - blue star
        }
        return icons.get(
            level,
            (
                '<svg width="16" height="16" viewBox="0 0 16 16" '
                'xmlns="http://www.w3.org/2000/svg">'
                '<path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>'
            ),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert todo to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "owner": self.owner.to_dict() if self.owner else None,
            "status": self.status,
            "importance": self.importance,
            "urgency": self.urgency,
            "importance_label": self.get_level_name(self.importance),
            "urgency_label": self.get_level_name(self.urgency),
            "importance_icon": self.get_level_icon(self.importance),
            "urgency_icon": self.get_level_icon(self.urgency),
            "priority_score": self.priority_score(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
