# Web Application Template

A production-ready full-stack web application template with **Flask (Python) backend** and **TypeScript frontend**, featuring authentication, database models, and CRUD operations.

## 🚀 Quick Start

```bash
# Run the setup script - it handles everything!
./setup.sh

# Start the backend (in one terminal)
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py

# Start the frontend (in another terminal)
cd frontend
npm run dev

# Open your browser to http://localhost:3000
```

## 📁 Project Structure

```
.
├── backend/                 # Flask API server
│   ├── models.py           # SQLAlchemy database models
│   ├── api.py              # API routes and endpoints
│   ├── auth.py             # JWT authentication utilities
│   ├── schemas.py          # Pydantic validation schemas
│   ├── app.py              # Application entry point
│   ├── reset_db.py         # Database reset utility
│   └── tests/              # Backend tests
├── frontend/               # TypeScript + Bootstrap frontend
│   └── src/
│       ├── index.ts        # Main application logic
│       ├── components.ts   # Reusable UI components
│       ├── auth.ts         # Authentication state
│       └── api/            # API client library
│           ├── client.ts   # Type-safe API client
│           └── types.ts    # TypeScript interfaces
├── infrastructure/         # Terraform deployment configs
├── docs/                   # Documentation
├── setup.sh               # One-command setup script
└── check.sh               # Run all tests and checks
```

## 🏗️ Architecture Overview

### Backend (Flask + PostgreSQL)

- **Flask** web framework with **SQLAlchemy** ORM
- **JWT authentication** with secure password hashing
- **Pydantic** for request/response validation
- **PostgreSQL** database with Docker support
- Full test coverage with **pytest**

### Frontend (TypeScript + Bootstrap)

- **TypeScript** for type safety
- **Bootstrap 5** for responsive UI
- **Webpack** for bundling and dev server
- **Jest** for testing
- Type-safe API client with full backend integration

### Database Models

The template includes 3 example models demonstrating common patterns:

1. **User** - Authentication and user management
   - Email, username, password (hashed)
   - JWT token generation
   - Relationships to user-owned entities

2. **Category** - Simple lookup table pattern
   - Demonstrates one-to-many relationships
   - Shared across multiple users

3. **Item** - Main domain entity pattern
   - User ownership
   - Foreign key relationships
   - Status field (enum-style)
   - Full CRUD operations

## 🎯 Key Features

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- Protected API endpoints
- Session management

### CRUD Operations
- Create, read, update, delete for Items
- Category management
- User profile access
- Proper error handling

### Type Safety
- Backend: Pydantic schemas for validation
- Frontend: TypeScript interfaces
- End-to-end type checking

### Testing
- Backend: pytest with fixtures
- Frontend: Jest with Testing Library
- Run all tests: `./check.sh`

## 📝 Customizing for Your Project

### 1. Define Your Domain Models

Edit `backend/models.py` to create your own models. The template provides:
- `User` - Keep this for authentication
- `Category` - Example lookup table (customize or remove)
- `Item` - Example entity (customize to your needs)

### 2. Update API Endpoints

Edit `backend/api.py` to add/modify endpoints:

```python
@app.route("/api/your-resource", methods=["POST"])
@login_required
def create_resource(current_user: User) -> tuple[dict, int]:
    # Your logic here
    return {"resource": resource.to_dict()}, 201
```

### 3. Add Validation Schemas

Edit `backend/schemas.py` for request validation:

```python
class YourResourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    # Add your fields
```

### 4. Update Frontend Types

Edit `frontend/src/api/types.ts`:

```typescript
export interface YourResource {
  id: number;
  name: string;
  // Add your fields
}
```

### 5. Add API Client Methods

Edit `frontend/src/api/client.ts`:

```typescript
public async createYourResource(data: YourResourceCreate): Promise<YourResource> {
  return this.request("/api/your-resource", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

### 6. Build UI Components

Edit `frontend/src/components.ts` to create forms and views for your resources.

## 🧪 Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest

# Frontend tests
cd frontend
npm test

# Run all checks (tests, linting, type-checking)
./check.sh
```

### Database Management

```bash
# Reset database (WARNING: deletes all data)
cd backend
source venv/bin/activate
python reset_db.py
```

### Code Quality

```bash
# Backend
cd backend
mypy .                    # Type checking
black .                   # Format code
flake8                    # Linting

# Frontend
cd frontend
npm run lint              # ESLint
npm run format            # Prettier
npm run type-check        # TypeScript
```

## 🔒 Security Notes

- Change `SECRET_KEY` in production (use environment variable)
- Use HTTPS in production
- Update CORS settings in `api.py` for production
- Never commit `.env` files
- Use strong passwords (min 8 chars enforced)

## 🌐 Deployment

The template includes Terraform configurations in `infrastructure/` for deploying to cloud providers.

### Environment Variables

Create `.env` file in backend:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
SECRET_KEY=your-secret-key-here
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (requires auth)

### Items

- `GET /api/items` - List user's items (requires auth)
- `GET /api/items/:id` - Get item details (requires auth)
- `POST /api/items` - Create item (requires auth)
- `PATCH /api/items/:id` - Update item (requires auth)
- `DELETE /api/items/:id` - Delete item (requires auth)

## 🤝 Contributing

This is a template - customize it for your needs! The structure is designed to be:
- **Easy to understand** - Clear separation of concerns
- **Easy to extend** - Add new models and endpoints
- **Production-ready** - Includes testing, linting, deployment

## 📄 License

ISC
