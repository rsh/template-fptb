"""Tests for authentication endpoints (register, login, me)."""


def test_register_success(client):
    """Test successful user registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    data = response.get_json()
    assert "token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["username"] == "newuser"


def test_register_duplicate_email(client, sample_user):
    """Test registration with duplicate email fails."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": sample_user.email,
            "username": "different",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "Email already registered" in response.get_json()["error"]


def test_register_duplicate_username(client, sample_user):
    """Test registration with duplicate username fails."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "different@example.com",
            "username": sample_user.username,
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "Username already taken" in response.get_json()["error"]


def test_register_validation_errors(client):
    """Test registration validation errors."""
    # Invalid email
    response = client.post(
        "/api/auth/register",
        json={
            "email": "notanemail",
            "username": "testuser",
            "password": "password123",
        },
    )
    assert response.status_code == 400

    # Username too short
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "username": "ab",  # Min is 3
            "password": "password123",
        },
    )
    assert response.status_code == 400

    # Password too short
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "short",  # Min is 8
        },
    )
    assert response.status_code == 400


def test_login_success(client, sample_user):
    """Test successful login."""
    response = client.post(
        "/api/auth/login",
        json={"email": sample_user.email, "password": "password123"},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["user"]["email"] == sample_user.email


def test_login_invalid_email(client):
    """Test login with non-existent email."""
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.get_json()["error"]


def test_login_invalid_password(client, sample_user):
    """Test login with wrong password."""
    response = client.post(
        "/api/auth/login",
        json={"email": sample_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.get_json()["error"]


def test_login_validation_error(client):
    """Test login with validation errors."""
    # Invalid email format
    response = client.post(
        "/api/auth/login",
        json={"email": "notanemail", "password": "password123"},
    )
    assert response.status_code == 400


def test_get_current_user(client, auth_headers, sample_user):
    """Test getting current user info."""
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["email"] == sample_user.email
    assert data["user"]["username"] == sample_user.username
