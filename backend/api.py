"""Flask API routes and application setup."""
import os

from flask import Flask, request
from flask_cors import CORS
from pydantic import ValidationError

from auth import generate_token, login_required, validate_request_json
from models import Category, Item, User, db
from schemas import (CategoryCreateRequest, ItemCreateRequest,
                     ItemUpdateRequest, LoginRequest, RegisterRequest)

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
# Category Endpoints
# ============================================================================


@app.route("/api/categories", methods=["GET"])
def get_categories() -> tuple[dict, int]:
    """Get all categories."""
    categories = Category.query.order_by(Category.name).all()
    return {"categories": [cat.to_dict() for cat in categories]}, 200


@app.route("/api/categories", methods=["POST"])
@login_required
@validate_request_json(["name"])
def create_category(current_user: User) -> tuple[dict, int]:
    """Create a new category."""
    try:
        data = CategoryCreateRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    # Check if category already exists
    if Category.query.filter_by(name=data.name).first():
        return {"error": "Category already exists"}, 400

    category = Category(name=data.name, description=data.description)
    db.session.add(category)
    db.session.commit()

    return {"category": category.to_dict()}, 201


# ============================================================================
# Item Endpoints
# ============================================================================


@app.route("/api/items", methods=["GET"])
@login_required
def get_items(current_user: User) -> tuple[dict, int]:
    """Get all items for the current user."""
    items = (
        Item.query.filter_by(owner_id=current_user.id)
        .order_by(Item.created_at.desc())
        .all()
    )
    return {"items": [item.to_dict() for item in items]}, 200


@app.route("/api/items/<int:item_id>", methods=["GET"])
@login_required
def get_item(item_id: int, current_user: User) -> tuple[dict, int]:
    """Get a specific item."""
    item = db.session.get(Item, item_id)
    if not item:
        return {"error": "Item not found"}, 404

    if item.owner_id != current_user.id:
        return {"error": "Unauthorized"}, 403

    return {"item": item.to_dict()}, 200


@app.route("/api/items", methods=["POST"])
@login_required
@validate_request_json(["title"])
def create_item(current_user: User) -> tuple[dict, int]:
    """Create a new item."""
    try:
        data = ItemCreateRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    # Validate category if provided
    if data.category_id:
        category = db.session.get(Category, data.category_id)
        if not category:
            return {"error": "Category not found"}, 404

    item = Item(
        title=data.title,
        description=data.description,
        category_id=data.category_id,
        status=data.status,
        owner_id=current_user.id,
    )
    db.session.add(item)
    db.session.commit()

    return {"item": item.to_dict()}, 201


@app.route("/api/items/<int:item_id>", methods=["PATCH"])
@login_required
def update_item(item_id: int, current_user: User) -> tuple[dict, int]:
    """Update an item."""
    item = db.session.get(Item, item_id)
    if not item:
        return {"error": "Item not found"}, 404

    if item.owner_id != current_user.id:
        return {"error": "Unauthorized"}, 403

    try:
        data = ItemUpdateRequest(**request.get_json())
    except ValidationError as e:
        return {"error": e.errors()}, 400

    # Update fields if provided
    if data.title is not None:
        item.title = data.title
    if data.description is not None:
        item.description = data.description
    if data.category_id is not None:
        category = db.session.get(Category, data.category_id)
        if not category:
            return {"error": "Category not found"}, 404
        item.category_id = data.category_id
    if data.status is not None:
        item.status = data.status

    db.session.commit()

    return {"item": item.to_dict()}, 200


@app.route("/api/items/<int:item_id>", methods=["DELETE"])
@login_required
def delete_item(item_id: int, current_user: User) -> tuple[dict, int]:
    """Delete an item."""
    item = db.session.get(Item, item_id)
    if not item:
        return {"error": "Item not found"}, 404

    if item.owner_id != current_user.id:
        return {"error": "Unauthorized"}, 403

    db.session.delete(item)
    db.session.commit()

    return {"message": "Item deleted successfully"}, 200


# ============================================================================
# Health Check
# ============================================================================


@app.route("/health", methods=["GET"])
def health() -> tuple[dict, int]:
    """Health check endpoint."""
    return {"status": "healthy"}, 200
