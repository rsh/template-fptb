"""Flask API routes and application setup."""
import os

from flask import Flask, request
from flask_cors import CORS
from pydantic import ValidationError

from auth import generate_token, login_required, validate_request_json
from models import Todo, User, db
from schemas import (LoginRequest, RegisterRequest, TodoCreateRequest,
                     TodoUpdateRequest)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://dbadmin:devpassword@localhost:5432/appdb"
)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
db.init_app(app)


# ============================================================================
# Authentication Endpoints
# ============================================================================


@app.route("/api/auth/register", methods=["POST"])
@validate_request_json(["email", "username", "password"])
def register() -> tuple[dict, int]:
    """Register a new user."""
    try:
        data = RegisterRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    # Check if user already exists
    if User.query.filter_by(email=data.email).first():
        return {"error": "Email already registered"}, 400

    if User.query.filter_by(username=data.username).first():
        return {"error": "Username already taken"}, 400

    # Create new user
    user = User(email=data.email, username=data.username)
    user.set_password(data.password)

    db.session.add(user)
    db.session.commit()

    # Generate token
    token = generate_token(user.id)

    return {
        "message": "User registered successfully",
        "token": token,
        "user": user.to_dict(include_email=True),
    }, 201


@app.route("/api/auth/login", methods=["POST"])
@validate_request_json(["email", "password"])
def login() -> tuple[dict, int]:
    """Login user."""
    try:
        data = LoginRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    user = User.query.filter_by(email=data.email).first()
    if not user or not user.check_password(data.password):
        return {"error": "Invalid email or password"}, 401

    token = generate_token(user.id)

    return {
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(include_email=True),
    }, 200


@app.route("/api/auth/me", methods=["GET"])
@login_required
def get_current_user_info(current_user: User) -> tuple[dict, int]:
    """Get current user information."""
    return {"user": current_user.to_dict(include_email=True)}, 200


# ============================================================================
# Todo Endpoints
# ============================================================================


@app.route("/api/todos", methods=["GET"])
@login_required
def get_todos(current_user: User) -> tuple[dict, int]:
    """Get all todos for the current user, sorted by priority."""
    todos = (
        Todo.query.filter_by(owner_id=current_user.id)
        .order_by(
            # Sort by priority score (importance 60%, urgency 40%)
            (Todo.importance * 0.6 + Todo.urgency * 0.4).desc(),
            Todo.created_at.asc(),
        )
        .all()
    )
    return {"todos": [todo.to_dict() for todo in todos]}, 200


@app.route("/api/todos/<int:todo_id>", methods=["GET"])
@login_required
def get_todo(todo_id: int, current_user: User) -> tuple[dict, int]:
    """Get a specific todo."""
    todo = db.session.get(Todo, todo_id)
    if not todo:
        return {"error": "Todo not found"}, 404

    if todo.owner_id != current_user.id:
        return {"error": "Unauthorized"}, 403

    return {"todo": todo.to_dict()}, 200


@app.route("/api/todos", methods=["POST"])
@login_required
@validate_request_json(["title"])
def create_todo(current_user: User) -> tuple[dict, int]:
    """Create a new todo."""
    try:
        data = TodoCreateRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    todo = Todo(
        title=data.title,
        description=data.description,
        importance=data.importance,
        urgency=data.urgency,
        status=data.status,
        owner_id=current_user.id,
    )
    db.session.add(todo)
    db.session.commit()

    return {"todo": todo.to_dict()}, 201


@app.route("/api/todos/<int:todo_id>", methods=["PATCH"])
@login_required
def update_todo(todo_id: int, current_user: User) -> tuple[dict, int]:
    """Update a todo."""
    todo = db.session.get(Todo, todo_id)
    if not todo:
        return {"error": "Todo not found"}, 404

    if todo.owner_id != current_user.id:
        return {"error": "Unauthorized"}, 403

    try:
        data = TodoUpdateRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    # Update fields if provided
    if data.title is not None:
        todo.title = data.title
    if data.description is not None:
        todo.description = data.description
    if data.importance is not None:
        todo.importance = data.importance
    if data.urgency is not None:
        todo.urgency = data.urgency
    if data.status is not None:
        todo.status = data.status

    db.session.commit()

    return {"todo": todo.to_dict()}, 200


@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
@login_required
def delete_todo(todo_id: int, current_user: User) -> tuple[dict, int]:
    """Delete a todo."""
    todo = db.session.get(Todo, todo_id)
    if not todo:
        return {"error": "Todo not found"}, 404

    if todo.owner_id != current_user.id:
        return {"error": "Unauthorized"}, 403

    db.session.delete(todo)
    db.session.commit()

    return {"message": "Todo deleted successfully"}, 200


# ============================================================================
# Health Check
# ============================================================================


@app.route("/health", methods=["GET"])
def health() -> tuple[dict, int]:
    """Health check endpoint."""
    return {"status": "healthy"}, 200
