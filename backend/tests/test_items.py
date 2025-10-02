"""Tests for item endpoints."""
from models import Item, User


def test_create_item(client, auth_headers, sample_user):
    """Test creating an item."""
    response = client.post(
        "/api/items",
        json={"title": "Test Item", "description": "A test item", "status": "active"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["item"]["title"] == "Test Item"
    assert data["item"]["status"] == "active"


def test_get_items(client, auth_headers, sample_user, db_session):
    """Test getting all items for a user."""
    # Create some items
    item1 = Item(title="Item 1", owner_id=sample_user.id, status="active")
    item2 = Item(title="Item 2", owner_id=sample_user.id, status="inactive")
    db_session.add_all([item1, item2])
    db_session.commit()

    response = client.get("/api/items", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["items"]) == 2


def test_update_item(client, auth_headers, sample_user, db_session):
    """Test updating an item."""
    item = Item(title="Original Title", owner_id=sample_user.id, status="active")
    db_session.add(item)
    db_session.commit()

    response = client.patch(
        f"/api/items/{item.id}",
        json={"title": "Updated Title", "status": "archived"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["item"]["title"] == "Updated Title"
    assert data["item"]["status"] == "archived"


def test_delete_item(client, auth_headers, sample_user, db_session):
    """Test deleting an item."""
    item = Item(title="To Delete", owner_id=sample_user.id, status="active")
    db_session.add(item)
    db_session.commit()
    item_id = item.id

    response = client.delete(f"/api/items/{item_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify item is deleted
    assert Item.query.get(item_id) is None


def test_cannot_access_other_users_item(client, db_session):
    """Test that users cannot access items owned by others."""
    # Create two users
    user1 = User(email="user1@example.com", username="user1")
    user1.set_password("password123")
    user2 = User(email="user2@example.com", username="user2")
    user2.set_password("password123")
    db_session.add_all([user1, user2])
    db_session.commit()

    # User 1 creates an item
    item = Item(title="User 1 Item", owner_id=user1.id, status="active")
    db_session.add(item)
    db_session.commit()

    # User 2 tries to access it
    login_response = client.post(
        "/api/auth/login",
        json={"email": "user2@example.com", "password": "password123"},
    )
    token = login_response.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/items/{item.id}", headers=headers)
    assert response.status_code == 403


def test_get_item_not_found(client, auth_headers):
    """Test getting a non-existent item."""
    response = client.get("/api/items/99999", headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.get_json()["error"]


def test_create_item_with_invalid_category(client, auth_headers):
    """Test creating an item with invalid category."""
    response = client.post(
        "/api/items",
        json={"title": "Item", "category_id": 99999},
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "Category not found" in response.get_json()["error"]


def test_create_item_validation_error(client, auth_headers):
    """Test creating an item with validation errors."""
    # Title too long
    response = client.post(
        "/api/items",
        json={"title": "x" * 201},  # Max is 200
        headers=auth_headers,
    )
    assert response.status_code == 400

    # Invalid status
    response = client.post(
        "/api/items",
        json={"title": "Item", "status": "invalid_status"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_update_item_not_found(client, auth_headers):
    """Test updating a non-existent item."""
    response = client.patch(
        "/api/items/99999",
        json={"title": "Updated"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_update_item_unauthorized(client, db_session):
    """Test that users cannot update other users' items."""
    user1 = User(email="user1@example.com", username="user1")
    user1.set_password("password123")
    user2 = User(email="user2@example.com", username="user2")
    user2.set_password("password123")
    db_session.add_all([user1, user2])
    db_session.commit()

    item = Item(title="User 1 Item", owner_id=user1.id, status="active")
    db_session.add(item)
    db_session.commit()

    # User 2 tries to update it
    login_response = client.post(
        "/api/auth/login",
        json={"email": "user2@example.com", "password": "password123"},
    )
    token = login_response.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.patch(
        f"/api/items/{item.id}",
        json={"title": "Hacked"},
        headers=headers,
    )
    assert response.status_code == 403


def test_update_item_with_invalid_category(client, auth_headers, sample_user, db_session):
    """Test updating an item with invalid category."""
    item = Item(title="Item", owner_id=sample_user.id, status="active")
    db_session.add(item)
    db_session.commit()

    response = client.patch(
        f"/api/items/{item.id}",
        json={"category_id": 99999},
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "Category not found" in response.get_json()["error"]


def test_update_item_validation_error(client, auth_headers, sample_user, db_session):
    """Test updating an item with validation errors."""
    item = Item(title="Item", owner_id=sample_user.id, status="active")
    db_session.add(item)
    db_session.commit()

    # Invalid status
    response = client.patch(
        f"/api/items/{item.id}",
        json={"status": "invalid_status"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_delete_item_not_found(client, auth_headers):
    """Test deleting a non-existent item."""
    response = client.delete("/api/items/99999", headers=auth_headers)
    assert response.status_code == 404


def test_delete_item_unauthorized(client, db_session):
    """Test that users cannot delete other users' items."""
    user1 = User(email="user1@example.com", username="user1")
    user1.set_password("password123")
    user2 = User(email="user2@example.com", username="user2")
    user2.set_password("password123")
    db_session.add_all([user1, user2])
    db_session.commit()

    item = Item(title="User 1 Item", owner_id=user1.id, status="active")
    db_session.add(item)
    db_session.commit()

    # User 2 tries to delete it
    login_response = client.post(
        "/api/auth/login",
        json={"email": "user2@example.com", "password": "password123"},
    )
    token = login_response.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete(f"/api/items/{item.id}", headers=headers)
    assert response.status_code == 403
