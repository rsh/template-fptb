"""Flask application entry point - kept for backward compatibility."""

# Import the actual Flask app from api.py
from api import app

if __name__ == "__main__":
    from models import db

    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
