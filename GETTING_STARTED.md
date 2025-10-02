# Getting Started Guide

Welcome! This guide will help you understand and customize this template for your own project.

## Understanding the Template

This template provides a complete full-stack application with:

### Backend (Flask + PostgreSQL)
- **User authentication** with JWT tokens
- **Database models** with SQLAlchemy ORM
- **API endpoints** with proper validation
- **Tests** with pytest

### Frontend (TypeScript + Bootstrap)
- **Type-safe** TypeScript code
- **Responsive UI** with Bootstrap
- **API client** with full type coverage
- **Modern tooling** (Webpack, Jest, ESLint)

## Quick Orientation

### Key Files to Understand

1. **`backend/models.py`** - Database models
   - User: Handles authentication
   - Category: Example lookup table
   - Item: Example main entity with relationships

2. **`backend/api.py`** - API endpoints
   - Authentication routes (`/api/auth/*`)
   - Category routes (`/api/categories`)
   - Item routes (`/api/items`)

3. **`frontend/src/api/types.ts`** - TypeScript interfaces
   - Mirrors backend models
   - Ensures type safety

4. **`frontend/src/components.ts`** - UI components
   - Reusable forms and tables
   - Following Bootstrap patterns

5. **`frontend/src/index.ts`** - Main application
   - Routing and state management
   - Event handlers

## Customization Checklist

Follow these steps to adapt the template for your project:

### Step 1: Plan Your Data Model

Think about what data your application needs to manage. For example:
- Blog: Posts, Comments, Tags
- E-commerce: Products, Orders, Customers
- Task Manager: Projects, Tasks, Assignments

### Step 2: Update Database Models

Edit `backend/models.py`:

```python
# Keep the User model - it handles authentication
class User(db.Model):
    # ... keep as is

# Replace Category and Item with your own models
class YourModel(db.Model):
    __tablename__ = "your_models"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    # Add your fields

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            # Add your fields
        }
```

### Step 3: Create Validation Schemas

Edit `backend/schemas.py`:

```python
class YourModelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    # Add your fields with validation
```

### Step 4: Add API Endpoints

Edit `backend/api.py`:

```python
@app.route("/api/your-models", methods=["GET"])
@login_required
def get_your_models(current_user: User):
    models = YourModel.query.all()
    return {"models": [m.to_dict() for m in models]}, 200
```

### Step 5: Update Frontend Types

Edit `frontend/src/api/types.ts`:

```typescript
export interface YourModel {
  id: number;
  name: string;
  // Add your fields
}
```

### Step 6: Update API Client

Edit `frontend/src/api/client.ts`:

```typescript
public async getYourModels(): Promise<YourModel[]> {
  const response = await this.request<{ models: YourModel[] }>("/api/your-models");
  return response.models;
}
```

### Step 7: Build UI Components

Edit `frontend/src/components.ts` to create forms and tables for your models.

### Step 8: Update Main App Logic

Edit `frontend/src/index.ts` to load and display your data.

### Step 9: Write Tests

Add tests in `backend/tests/` following the pattern in `test_items.py`.

### Step 10: Update Branding

1. Change app name in `frontend/src/index.html`
2. Update `setup.sh` header
3. Customize `README.md`

## Example: Building a Blog

Here's how you'd adapt this template for a blog:

### 1. Models
```python
class Post(db.Model):
    __tablename__ = "posts"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    # ...

class Comment(db.Model):
    __tablename__ = "comments"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"))
    content = db.Column(db.Text, nullable=False)
    # ...
```

### 2. API Routes
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post with comments
- `POST /api/posts/:id/comments` - Add comment

### 3. Frontend
- Post list component
- Post detail component
- Comment form
- Rich text editor (optional)

## Common Patterns

### Adding a Many-to-Many Relationship

```python
# Association table
user_groups = db.Table('user_groups',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('group_id', db.Integer, db.ForeignKey('groups.id'))
)

class Group(db.Model):
    members = db.relationship('User', secondary=user_groups)
```

### Adding File Uploads

1. Add boto3 for S3 uploads (already in requirements.txt)
2. Create upload endpoint
3. Store file URL in model
4. Add file input in frontend

### Adding Email Notifications

1. Add email library (e.g., Flask-Mail)
2. Create email templates
3. Send on specific events (registration, etc.)

## Development Tips

### Running in Development

Always run both backend and frontend:
```bash
# Terminal 1
cd backend && source venv/bin/activate && python app.py

# Terminal 2
cd frontend && npm run dev
```

### Database Changes

After modifying models:
```bash
cd backend
source venv/bin/activate
python reset_db.py  # WARNING: Deletes all data!
```

For production, use database migrations (consider adding Alembic).

### Debugging

- Backend: Add `print()` statements or use `pdb.set_trace()`
- Frontend: Use browser DevTools, check Console and Network tabs
- Check terminal output for errors

## Next Steps

1. ✅ Run `./setup.sh` to verify everything works
2. ✅ Browse the code to understand the structure
3. ✅ Run the tests: `./check.sh`
4. ✅ Plan your data model
5. ✅ Start customizing!

## Getting Help

- Check the main [README.md](README.md) for architecture details
- Review the example code in `backend/models.py` and `frontend/src/components.ts`
- Look at the test files for usage examples

Happy building! 🚀
