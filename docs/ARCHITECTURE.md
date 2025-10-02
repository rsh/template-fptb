# Architecture Guide

This document explains how the different parts of the application work together.

## Request Flow

Here's what happens when a user creates an item:

```
┌──────────┐      ┌────────────┐      ┌──────────┐      ┌──────────┐
│ Browser  │─────▶│  Frontend  │─────▶│  Backend │─────▶│ Database │
│   UI     │      │ TypeScript │      │  Flask   │      │ Postgres │
└──────────┘      └────────────┘      └──────────┘      └──────────┘
    │                   │                   │                  │
    │ 1. User fills     │                   │                  │
    │    form           │                   │                  │
    │                   │                   │                  │
    │ 2. Submit ────────▶                   │                  │
    │                   │                   │                  │
    │                   │ 3. Validate       │                  │
    │                   │    data           │                  │
    │                   │                   │                  │
    │                   │ 4. POST /api/items│                  │
    │                   │    with JWT ──────▶                  │
    │                   │                   │                  │
    │                   │                   │ 5. Validate JWT  │
    │                   │                   │    token         │
    │                   │                   │                  │
    │                   │                   │ 6. Validate      │
    │                   │                   │    with Pydantic │
    │                   │                   │                  │
    │                   │                   │ 7. Create model  │
    │                   │                   │    instance      │
    │                   │                   │                  │
    │                   │                   │ 8. Save ─────────▶
    │                   │                   │                  │
    │                   │ 9. Return JSON◀───┤ 10. Commit       │
    │                   │    response       │                  │
    │                   │                   │                  │
    │ 11. Update UI ◀───┤                   │                  │
    │     with new      │                   │                  │
    │     item          │                   │                  │
```

## Frontend Architecture

### File Structure
```
frontend/src/
├── index.ts          # Main app entry, routing, state
├── auth.ts           # Authentication state management
├── components.ts     # Reusable UI components (forms, tables)
├── api/
│   ├── client.ts     # API client with all methods
│   ├── types.ts      # TypeScript interfaces
│   └── index.ts      # Re-exports
└── styles.css        # Custom styles
```

### Data Flow

1. **`index.ts`** - Main application
   - Initializes auth state
   - Routes to login or main view
   - Manages application state (items, categories)
   - Handles events (create, edit, delete)

2. **`components.ts`** - Pure rendering
   - Takes data as input
   - Returns HTML elements
   - No state management
   - Reusable across different views

3. **`api/client.ts`** - API communication
   - All backend communication goes through here
   - Type-safe methods
   - Automatic JWT token handling
   - Error handling

4. **`auth.ts`** - Authentication state
   - Tracks current user
   - Checks if authenticated
   - Logout functionality

### Example: Creating an Item

```typescript
// 1. User submits form (index.ts)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  // 2. Call API client (api/client.ts)
  const newItem = await apiClient.createItem({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  // 3. Update local state
  items.push(newItem);

  // 4. Re-render UI (components.ts)
  renderItems();
});
```

## Backend Architecture

### File Structure
```
backend/
├── app.py            # Flask app initialization
├── api.py            # All API routes
├── models.py         # SQLAlchemy models
├── schemas.py        # Pydantic validation
├── auth.py           # JWT utilities & decorators
├── reset_db.py       # Database utilities
└── tests/            # Test files
```

### Request Processing

1. **Request arrives** at Flask route (`api.py`)
2. **Authentication** checked by `@login_required` decorator (`auth.py`)
3. **Validation** performed by Pydantic schema (`schemas.py`)
4. **Business logic** executes in route handler
5. **Database operations** via SQLAlchemy models (`models.py`)
6. **Response** serialized using model's `to_dict()` method
7. **Return** JSON response to frontend

### Example: Item Creation Endpoint

```python
@app.route("/api/items", methods=["POST"])
@login_required  # 1. Check JWT token
@validate_request_json(["title"])  # 2. Check required fields
def create_item(current_user: User):
    # 3. Validate with Pydantic
    data = ItemCreateRequest(**request.get_json())

    # 4. Create model instance
    item = Item(
        title=data.title,
        description=data.description,
        owner_id=current_user.id,
    )

    # 5. Save to database
    db.session.add(item)
    db.session.commit()

    # 6. Return JSON response
    return {"item": item.to_dict()}, 201
```

## Authentication Flow

### Registration
```
1. User fills registration form
2. Frontend validates (length, format)
3. POST /api/auth/register
4. Backend validates with Pydantic
5. Check if email/username exists
6. Hash password with bcrypt
7. Create user in database
8. Generate JWT token
9. Return token + user data
10. Frontend stores token in localStorage
11. Redirect to main app
```

### Login
```
1. User fills login form
2. POST /api/auth/login
3. Find user by email
4. Verify password hash
5. Generate JWT token
6. Return token + user data
7. Frontend stores token
8. Redirect to main app
```

### Protected Requests
```
1. Frontend reads token from localStorage
2. Adds "Authorization: Bearer <token>" header
3. Backend receives request
4. @login_required decorator extracts token
5. Verify token signature and expiration
6. Load user from database
7. Pass user to route handler
8. Route can access current_user
```

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│    User     │         │   Category   │
├─────────────┤         ├──────────────┤
│ id          │         │ id           │
│ email       │         │ name         │
│ username    │         │ description  │
│ password_   │         └──────┬───────┘
│ created_at  │                │
└──────┬──────┘                │
       │                       │
       │ owns                  │
       │                       │
       │                       │
       │         ┌─────────────┴─┐
       │         │     Item      │
       └────────▶├───────────────┤
                 │ id            │
                 │ title         │
                 │ description   │
                 │ owner_id  (FK)│
                 │ category_id(FK)│
                 │ status        │
                 │ created_at    │
                 │ updated_at    │
                 └───────────────┘
```

### Relationships

- **User → Items**: One-to-Many (user owns many items)
- **Category → Items**: One-to-Many (category has many items)
- **Item → User**: Many-to-One (item belongs to one user)
- **Item → Category**: Many-to-One (item has one category)

## Type Safety

### Frontend ↔ Backend Contract

The types in `frontend/src/api/types.ts` must match the data returned by backend models:

```typescript
// Frontend types.ts
export interface Item {
  id: number;
  title: string;
  description: string | null;
  owner: User | null;
  category: Category | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}
```

```python
# Backend models.py
def to_dict(self):
    return {
        "id": self.id,
        "title": self.title,
        "description": self.description,
        "owner": self.owner.to_dict(),
        "category": self.category.to_dict() if self.category else None,
        "status": self.status,
        "created_at": self.created_at.isoformat(),
        "updated_at": self.updated_at.isoformat(),
    }
```

### Validation Layers

1. **Frontend**: TypeScript compile-time checking
2. **Backend**: Pydantic runtime validation
3. **Database**: PostgreSQL constraints

This provides defense in depth - errors are caught at multiple levels.

## Security Considerations

### Password Security
- Passwords never stored in plain text
- Hashed with bcrypt (via werkzeug)
- Minimum 8 characters enforced

### JWT Tokens
- Signed with SECRET_KEY
- Include expiration (24 hours)
- Verified on each protected request
- Stored in localStorage (consider HttpOnly cookies for production)

### SQL Injection
- Prevented by SQLAlchemy ORM
- Never use raw SQL with user input
- Always use parameterized queries

### XSS Protection
- All user input escaped in UI
- `escapeHtml()` function used in components
- Bootstrap handles most escaping automatically

### CORS
- Configured in Flask app
- Restrict origins in production
- Only allow your frontend domain

## Performance Optimization

### Database
- Indexes on foreign keys (email, username)
- Use `db.session.bulk_save_objects()` for batch operations
- Eager loading with `joinedload()` for related data

### Frontend
- Webpack code splitting
- Lazy load routes if app grows
- Debounce search inputs
- Cache API responses when appropriate

### Caching
- Add Redis for session storage (production)
- Cache category list (changes rarely)
- Use ETags for API responses

## Testing Strategy

### Backend Tests (pytest)
- Unit tests for models
- Integration tests for API endpoints
- Test authentication and authorization
- Test validation errors
- Test database constraints

### Frontend Tests (Jest)
- Component rendering tests
- API client tests (mocked)
- Form validation tests
- User interaction tests

### End-to-End Tests
- Consider adding Playwright or Cypress
- Test critical user flows
- Test across browsers

## Deployment Architecture

```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ App 1 │ │ App 2 │  (Flask + Gunicorn)
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
    ┌────▼────┐
    │   RDS   │  (PostgreSQL)
    │ Primary │
    └─────────┘
         │
    ┌────▼────────┐
    │ RDS Replica │  (Read-only)
    └─────────────┘
```

### Frontend Deployment
- Build with `npm run build`
- Serve static files from S3 + CloudFront
- Or use Nginx to serve static files

### Backend Deployment
- Gunicorn WSGI server
- Multiple workers for concurrency
- Auto-scaling based on CPU/memory
- Health checks at `/health` endpoint

## Monitoring & Logging

### Add These in Production

1. **Application Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (New Relic, DataDog)
   - Request logging

2. **Database Monitoring**
   - Query performance
   - Connection pooling
   - Slow query log

3. **Infrastructure Monitoring**
   - Server metrics (CPU, memory, disk)
   - Network monitoring
   - Uptime checks

## Further Reading

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Pydantic](https://docs.pydantic.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)
