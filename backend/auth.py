"""Authentication utilities and decorators."""
import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional, TypeVar, cast

import jwt
from flask import jsonify, request

from models import User, db

F = TypeVar("F", bound=Callable[..., Any])

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
TOKEN_EXPIRATION_HOURS = 24


def generate_token(user_id: int) -> str:
    """Generate JWT token for user."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return cast(Dict[str, Any], payload)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user() -> Optional[User]:
    """Get current user from request token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None

    user = db.session.get(User, payload["user_id"])
    return user


def login_required(f: F) -> F:
    """Decorator to require authentication."""

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs, current_user=user)

    return cast(F, decorated_function)


def validate_request_json(required_fields: list[str]) -> Callable[[F], F]:
    """Decorator to validate required JSON fields."""

    def decorator(f: F) -> F:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            if not request.is_json:
                return jsonify({"error": "Content-Type must be application/json"}), 400

            data = request.get_json()
            if not data:
                return jsonify({"error": "Request body is required"}), 400

            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                fields_str = ", ".join(missing_fields)
                return (
                    jsonify({"error": f"Missing required fields: {fields_str}"}),
                    400,
                )

            return f(*args, **kwargs)

        return cast(F, decorated_function)

    return decorator
