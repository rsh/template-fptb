"""Tests for Todo API endpoints."""
import pytest

from models import Todo, User, db

# ============================================================================
# GET /api/todos - List todos
# ============================================================================


def test_get_todos_empty(client, auth_headers):
    """Test getting todos when user has none."""
    response = client.get("/api/todos", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["todos"] == []


def test_get_todos_unauthorized(client):
    """Test getting todos without authentication."""
    response = client.get("/api/todos")
    assert response.status_code == 401


def test_get_todos_sorted_by_priority(client, sample_user, auth_headers, app):
    """Test todos are sorted by priority score (importance 60%, urgency 40%)."""
    with app.app_context():
        # Get the user_id within the app context
        user = User.query.filter_by(email="test@example.com").first()
        user_id = user.id

        # Create todos with different priorities
        # Todo 1: importance=3, urgency=2 -> priority = 3*0.6 + 2*0.4 = 2.6
        todo1 = Todo(
            title="High importance, medium urgency",
            importance=3,
            urgency=2,
            owner_id=user_id,
        )
        # Todo 2: importance=2, urgency=3 -> priority = 2*0.6 + 3*0.4 = 2.4
        todo2 = Todo(
            title="Medium importance, high urgency",
            importance=2,
            urgency=3,
            owner_id=user_id,
        )
        # Todo 3: importance=4, urgency=4 -> priority = 4*0.6 + 4*0.4 = 4.0
        todo3 = Todo(
            title="Critical everything",
            importance=4,
            urgency=4,
            owner_id=user_id,
        )
        # Todo 4: importance=1, urgency=1 -> priority = 1*0.6 + 1*0.4 = 1.0
        todo4 = Todo(title="Low everything", importance=1, urgency=1, owner_id=user_id)

        db.session.add_all([todo1, todo2, todo3, todo4])
        db.session.commit()

    response = client.get("/api/todos", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    todos = data["todos"]

    assert len(todos) == 4
    # Should be sorted by priority descending
    assert todos[0]["title"] == "Critical everything"
    assert todos[0]["priority_score"] == pytest.approx(4.0)
    assert todos[1]["title"] == "High importance, medium urgency"
    assert todos[1]["priority_score"] == pytest.approx(2.6)
    assert todos[2]["title"] == "Medium importance, high urgency"
    assert todos[2]["priority_score"] == pytest.approx(2.4)
    assert todos[3]["title"] == "Low everything"
    assert todos[3]["priority_score"] == pytest.approx(1.0)


def test_get_todos_only_own(client, sample_user, app, auth_headers):
    """Test users can only see their own todos."""
    with app.app_context():
        # Create other user
        other_user = User(email="other@example.com", username="otheruser")
        other_user.set_password("password123")
        db.session.add(other_user)
        db.session.commit()

        # Get user IDs
        user = User.query.filter_by(email="test@example.com").first()
        user_id = user.id
        other_user_id = other_user.id

        # Create todo for main user
        todo1 = Todo(title="My todo", owner_id=user_id)
        # Create todo for other user
        todo2 = Todo(title="Other user's todo", owner_id=other_user_id)

        db.session.add_all([todo1, todo2])
        db.session.commit()

    response = client.get("/api/todos", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    todos = data["todos"]

    assert len(todos) == 1
    assert todos[0]["title"] == "My todo"


# ============================================================================
# GET /api/todos/<id> - Get specific todo
# ============================================================================


def test_get_todo_success(client, sample_user, auth_headers, app):
    """Test getting a specific todo."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(
            title="Test Todo",
            description="Test description",
            importance=3,
            urgency=2,
            status="in_progress",
            owner_id=user.id,
        )
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.get(f"/api/todos/{todo_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    todo_data = data["todo"]

    assert todo_data["title"] == "Test Todo"
    assert todo_data["description"] == "Test description"
    assert todo_data["importance"] == 3
    assert todo_data["urgency"] == 2
    assert todo_data["status"] == "in_progress"
    assert todo_data["importance_label"] == "High"
    assert todo_data["urgency_label"] == "Medium"
    assert todo_data["priority_score"] == pytest.approx(2.6)


def test_get_todo_not_found(client, auth_headers):
    """Test getting a non-existent todo."""
    response = client.get("/api/todos/9999", headers=auth_headers)
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_get_todo_unauthorized_no_token(client, sample_user, app):
    """Test getting a todo without authentication."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test Todo", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.get(f"/api/todos/{todo_id}")
    assert response.status_code == 401


def test_get_todo_unauthorized_wrong_owner(client, sample_user, app, auth_headers):
    """Test users cannot access other users' todos."""
    with app.app_context():
        # Create other user
        other_user = User(email="other@example.com", username="otheruser")
        other_user.set_password("password123")
        db.session.add(other_user)
        db.session.commit()

        # Create todo owned by other user
        todo = Todo(title="Other user's todo", owner_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    # Try to access with main user's token
    response = client.get(f"/api/todos/{todo_id}", headers=auth_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert data["error"] == "Unauthorized"


# ============================================================================
# POST /api/todos - Create todo
# ============================================================================


def test_create_todo_minimal(client, auth_headers):
    """Test creating a todo with minimal required fields."""
    response = client.post(
        "/api/todos", headers=auth_headers, json={"title": "New Todo"}
    )
    assert response.status_code == 201
    data = response.get_json()
    todo = data["todo"]

    assert todo["title"] == "New Todo"
    assert todo["description"] is None
    assert todo["importance"] == 2  # Default
    assert todo["urgency"] == 2  # Default
    assert todo["status"] == "pending"  # Default


def test_create_todo_full(client, auth_headers):
    """Test creating a todo with all fields."""
    response = client.post(
        "/api/todos",
        headers=auth_headers,
        json={
            "title": "Complete Todo",
            "description": "Detailed description",
            "importance": 4,
            "urgency": 3,
            "status": "in_progress",
        },
    )
    assert response.status_code == 201
    data = response.get_json()
    todo = data["todo"]

    assert todo["title"] == "Complete Todo"
    assert todo["description"] == "Detailed description"
    assert todo["importance"] == 4
    assert todo["urgency"] == 3
    assert todo["status"] == "in_progress"
    assert todo["importance_label"] == "Critical"
    assert todo["urgency_label"] == "High"


def test_create_todo_missing_title(client, auth_headers):
    """Test creating a todo without required title."""
    response = client.post(
        "/api/todos", headers=auth_headers, json={"description": "No title"}
    )
    assert response.status_code == 400


def test_create_todo_invalid_importance(client, auth_headers):
    """Test creating a todo with invalid importance value."""
    response = client.post(
        "/api/todos",
        headers=auth_headers,
        json={"title": "Test", "importance": 5},  # Max is 4
    )
    assert response.status_code == 400


def test_create_todo_invalid_urgency(client, auth_headers):
    """Test creating a todo with invalid urgency value."""
    response = client.post(
        "/api/todos",
        headers=auth_headers,
        json={"title": "Test", "urgency": 0},  # Min is 1
    )
    assert response.status_code == 400


def test_create_todo_unauthorized(client):
    """Test creating a todo without authentication."""
    response = client.post("/api/todos", json={"title": "Test"})
    assert response.status_code == 401


# ============================================================================
# PATCH /api/todos/<id> - Update todo
# ============================================================================


def test_update_todo_title(client, sample_user, auth_headers, app):
    """Test updating todo title."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Original Title", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.patch(
        f"/api/todos/{todo_id}",
        headers=auth_headers,
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["todo"]["title"] == "Updated Title"


def test_update_todo_status(client, sample_user, auth_headers, app):
    """Test updating todo status."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", status="pending", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.patch(
        f"/api/todos/{todo_id}", headers=auth_headers, json={"status": "completed"}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["todo"]["status"] == "completed"


def test_update_todo_priority(client, sample_user, auth_headers, app):
    """Test updating todo importance and urgency."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", importance=1, urgency=1, owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.patch(
        f"/api/todos/{todo_id}",
        headers=auth_headers,
        json={"importance": 4, "urgency": 4},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["todo"]["importance"] == 4
    assert data["todo"]["urgency"] == 4
    assert data["todo"]["priority_score"] == pytest.approx(4.0)


def test_update_todo_partial(client, sample_user, auth_headers, app):
    """Test partial update (only some fields)."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(
            title="Original",
            description="Original desc",
            importance=2,
            owner_id=user.id,
        )
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    # Only update description
    response = client.patch(
        f"/api/todos/{todo_id}",
        headers=auth_headers,
        json={"description": "Updated description"},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["todo"]["title"] == "Original"  # Unchanged
    assert data["todo"]["description"] == "Updated description"
    assert data["todo"]["importance"] == 2  # Unchanged


def test_update_todo_not_found(client, auth_headers):
    """Test updating a non-existent todo."""
    response = client.patch(
        "/api/todos/9999", headers=auth_headers, json={"title": "Updated"}
    )
    assert response.status_code == 404


def test_update_todo_unauthorized_no_token(client, sample_user, app):
    """Test updating a todo without authentication."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.patch(f"/api/todos/{todo_id}", json={"title": "Updated"})
    assert response.status_code == 401


def test_update_todo_unauthorized_wrong_owner(client, sample_user, app, auth_headers):
    """Test users cannot update other users' todos."""
    with app.app_context():
        other_user = User(email="other@example.com", username="otheruser")
        other_user.set_password("password123")
        db.session.add(other_user)
        db.session.commit()

        todo = Todo(title="Other user's todo", owner_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.patch(
        f"/api/todos/{todo_id}", headers=auth_headers, json={"title": "Hacked!"}
    )
    assert response.status_code == 403


def test_update_todo_invalid_validation(client, sample_user, auth_headers, app):
    """Test updating with invalid data."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.patch(
        f"/api/todos/{todo_id}",
        headers=auth_headers,
        json={"importance": 10},  # Invalid value
    )
    assert response.status_code == 400


# ============================================================================
# DELETE /api/todos/<id> - Delete todo
# ============================================================================


def test_delete_todo_success(client, sample_user, auth_headers, app):
    """Test deleting a todo."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="To be deleted", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.delete(f"/api/todos/{todo_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "deleted successfully" in data["message"]

    # Verify todo is actually deleted
    with app.app_context():
        deleted_todo = db.session.get(Todo, todo_id)
        assert deleted_todo is None


def test_delete_todo_not_found(client, auth_headers):
    """Test deleting a non-existent todo."""
    response = client.delete("/api/todos/9999", headers=auth_headers)
    assert response.status_code == 404


def test_delete_todo_unauthorized_no_token(client, sample_user, app):
    """Test deleting a todo without authentication."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.delete(f"/api/todos/{todo_id}")
    assert response.status_code == 401


def test_delete_todo_unauthorized_wrong_owner(client, sample_user, app, auth_headers):
    """Test users cannot delete other users' todos."""
    with app.app_context():
        other_user = User(email="other@example.com", username="otheruser")
        other_user.set_password("password123")
        db.session.add(other_user)
        db.session.commit()

        todo = Todo(title="Other user's todo", owner_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.delete(f"/api/todos/{todo_id}", headers=auth_headers)
    assert response.status_code == 403

    # Verify todo was not deleted
    with app.app_context():
        existing_todo = db.session.get(Todo, todo_id)
        assert existing_todo is not None


# ============================================================================
# Additional edge cases
# ============================================================================


def test_todo_includes_owner_info(client, sample_user, auth_headers, app):
    """Test that todo includes owner information."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.get(f"/api/todos/{todo_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    todo_data = data["todo"]

    assert "owner" in todo_data
    assert todo_data["owner"]["username"] == "testuser"
    assert "email" not in todo_data["owner"]  # Email should not be included


def test_todo_includes_svg_icons(client, sample_user, auth_headers, app):
    """Test that todo includes SVG icons for importance and urgency."""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        todo = Todo(title="Test", importance=3, urgency=2, owner_id=user.id)
        db.session.add(todo)
        db.session.commit()
        todo_id = todo.id

    response = client.get(f"/api/todos/{todo_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    todo_data = data["todo"]

    assert "importance_icon" in todo_data
    assert "urgency_icon" in todo_data
    assert "<svg" in todo_data["importance_icon"]
    assert "<svg" in todo_data["urgency_icon"]
    # High importance should have red square
    assert "#F44336" in todo_data["importance_icon"]
    # Medium urgency should have orange triangle
    assert "#FF7811" in todo_data["urgency_icon"]


def test_create_multiple_todos_same_user(client, sample_user, auth_headers):
    """Test creating multiple todos for the same user."""
    # Create first todo
    response1 = client.post(
        "/api/todos", headers=auth_headers, json={"title": "Todo 1"}
    )
    assert response1.status_code == 201

    # Create second todo
    response2 = client.post(
        "/api/todos", headers=auth_headers, json={"title": "Todo 2"}
    )
    assert response2.status_code == 201

    # List todos
    response3 = client.get("/api/todos", headers=auth_headers)
    assert response3.status_code == 200
    data = response3.get_json()
    assert len(data["todos"]) == 2
