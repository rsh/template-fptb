"""Tests for category endpoints."""
from models import Category


def test_get_categories_empty(client):
    """Test getting categories when none exist."""
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.get_json()
    assert data["categories"] == []


def test_get_categories(client, db_session):
    """Test getting all categories."""
    cat1 = Category(name="Technology", description="Tech items")
    cat2 = Category(name="Books", description="Book items")
    db_session.add_all([cat1, cat2])
    db_session.commit()

    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["categories"]) == 2
    # Should be ordered by name
    assert data["categories"][0]["name"] == "Books"
    assert data["categories"][1]["name"] == "Technology"


def test_create_category(client, auth_headers):
    """Test creating a category."""
    response = client.post(
        "/api/categories",
        json={"name": "Electronics", "description": "Electronic devices"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["category"]["name"] == "Electronics"
    assert data["category"]["description"] == "Electronic devices"


def test_create_category_without_description(client, auth_headers):
    """Test creating a category without description."""
    response = client.post(
        "/api/categories",
        json={"name": "Sports"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["category"]["name"] == "Sports"
    assert data["category"]["description"] is None


def test_create_category_duplicate(client, auth_headers, db_session):
    """Test creating a duplicate category fails."""
    cat = Category(name="Existing", description="Already exists")
    db_session.add(cat)
    db_session.commit()

    response = client.post(
        "/api/categories",
        json={"name": "Existing"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "already exists" in response.get_json()["error"]


def test_create_category_requires_auth(client):
    """Test creating a category requires authentication."""
    response = client.post(
        "/api/categories",
        json={"name": "NoAuth"},
    )
    assert response.status_code == 401


def test_create_category_validation_error(client, auth_headers):
    """Test creating a category with validation errors."""
    # Missing name
    response = client.post(
        "/api/categories",
        json={"description": "No name provided"},
        headers=auth_headers,
    )
    assert response.status_code == 400

    # Name too long
    response = client.post(
        "/api/categories",
        json={"name": "x" * 101},  # Max is 100
        headers=auth_headers,
    )
    assert response.status_code == 400
