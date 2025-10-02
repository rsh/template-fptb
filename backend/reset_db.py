"""Reset database - drops all tables and recreates them."""
from sqlalchemy import inspect, text

from api import app
from models import db

if __name__ == "__main__":
    with app.app_context():
        print("Dropping all tables...")
        # Get database inspector to find all tables
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        if tables:
            # Drop all tables that exist (handles foreign keys from old schema)
            for table in tables:
                db.session.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            db.session.commit()
            print(f"  Dropped {len(tables)} tables")

        print("Creating all tables...")
        db.create_all()
        print("✓ Database schema recreated successfully!")
