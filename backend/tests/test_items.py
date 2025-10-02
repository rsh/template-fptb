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
