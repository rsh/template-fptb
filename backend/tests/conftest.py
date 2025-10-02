"""Pytest configuration and fixtures."""
import os
from typing import Generator

import pytest
from flask import Flask
from flask.testing import FlaskClient

# Set test environment before importing app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key"

from api import \
    app as \
    flask_app  # noqa: E402 - imports after setting test environment variables
from models import (  # noqa: E402 - imports after setting test environment variables
    User, db)


@pytest.fixture
def app() -> Generator[Flask, None, None]:
    """Create application for testing."""
    flask_app.config["TESTING"] = True
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    """Create test client."""
    return app.test_client()


@pytest.fixture
def sample_user(app: Flask) -> Generator[User, None, None]:
    """Create and return a sample user."""
    with app.app_context():
        user = User(email="test@example.com", username="testuser")
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        yield user


@pytest.fixture
def auth_headers(sample_user: User, client: FlaskClient) -> dict[str, str]:
    """Return auth headers for the sample user."""
    # Login to get token
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    data = response.get_json()
    token = data["token"]

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def db_session(app: Flask):
    """Provide db session for tests."""
    with app.app_context():
        yield db.session
