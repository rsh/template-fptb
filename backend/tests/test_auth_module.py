"""Tests for auth module (token generation, validation, decorators)."""
from datetime import datetime, timedelta
from typing import Any, Tuple

import jwt
from flask import Flask, jsonify
from flask.testing import FlaskClient

from auth import decode_token, generate_token, validate_request_json
from models import User


def test_generate_token(app: Flask) -> None:
    """Test token generation."""
    with app.app_context():
        user = User(email="test@example.com", username="Test User")
        user.set_password("password123")
        from models import db

        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = generate_token(user_id)
    assert token is not None
    assert isinstance(token, str)

    # Decode and verify token
    import os

    secret = os.getenv("SECRET_KEY", "dev-secret-key")
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    assert payload["user_id"] == user_id
    assert "exp" in payload
    assert "iat" in payload


def test_decode_token_valid(app: Flask) -> None:
    """Test decoding valid token."""
    with app.app_context():
        user = User(email="test@example.com", username="Test User")
        user.set_password("password123")
        from models import db

        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = generate_token(user_id)
    payload = decode_token(token)

    assert payload is not None
    assert payload["user_id"] == user_id


def test_decode_token_expired() -> None:
    """Test decoding expired token."""
    import os

    secret = os.getenv("SECRET_KEY", "dev-secret-key")

    # Create expired token
    expired_payload = {
        "user_id": 1,
        "exp": datetime.utcnow() - timedelta(hours=1),
        "iat": datetime.utcnow() - timedelta(hours=2),
    }
    expired_token = jwt.encode(expired_payload, secret, algorithm="HS256")

    result = decode_token(expired_token)
    assert result is None


def test_decode_token_invalid() -> None:
    """Test decoding invalid token."""
    invalid_token = "invalid.token.here"
    result = decode_token(invalid_token)
    assert result is None


def test_login_required_decorator_success(client: FlaskClient, app: Flask) -> None:
    """Test login_required decorator with valid token."""
    # Create user and get token
    response = client.post(
        "/api/auth/register",
        json={
            "email": "decorator_test@example.com",
            "username": "DecoratorTestUser",
            "password": "password123",
        },
    )
    token = response.get_json()["token"]

    # Test protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200


def test_login_required_decorator_no_token(client: FlaskClient) -> None:
    """Test login_required decorator without token."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "Authentication required" in response.get_json()["error"]


def test_login_required_decorator_invalid_token(client: FlaskClient) -> None:
    """Test login_required decorator with invalid token."""
    headers = {"Authorization": "Bearer invalid.token.here"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401


def test_login_required_decorator_malformed_header(client: FlaskClient) -> None:
    """Test login_required decorator with malformed auth header."""
    headers = {"Authorization": "InvalidFormat token"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401


def test_validate_request_json_decorator(app: Flask) -> None:
    """Test validate_request_json decorator."""
    # Import Flask test client
    from flask import Flask as FlaskApp

    # Create a fresh app for this test
    test_app = FlaskApp(__name__)

    @test_app.route("/test-validate", methods=["POST"])
    @validate_request_json(["field1", "field2"])
    def test_route() -> Tuple[Any, int]:
        return jsonify({"message": "success"}), 200

    test_client = test_app.test_client()

    # Test with valid data
    response = test_client.post(
        "/test-validate", json={"field1": "value1", "field2": "value2"}
    )
    assert response.status_code == 200

    # Test with missing field
    response = test_client.post("/test-validate", json={"field1": "value1"})
    assert response.status_code == 400
    assert "Missing required fields: field2" in response.get_json()["error"]

    # Test with no JSON
    response = test_client.post("/test-validate", data="not json")
    assert response.status_code == 400

    # Test with empty body - Flask returns 400 for empty JSON
    response = test_client.post(
        "/test-validate", headers={"Content-Type": "application/json"}, data=""
    )
    assert response.status_code == 400
