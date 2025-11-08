#!/bin/bash
set -e

echo "Starting backend server..."

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Error: Virtual environment not found at backend/venv"
    echo "Please run ./setup.sh first"
    exit 1
fi

# Check if PostgreSQL is running
if ! docker ps | grep -q postgres; then
    echo "PostgreSQL container not running. Starting it..."
    docker start template-fptb-db 2>/dev/null || \
    docker run -d \
        --name template-fptb-db \
        -e POSTGRES_PASSWORD=devpassword \
        -e POSTGRES_USER=dbadmin \
        -e POSTGRES_DB=appdb \
        -p 5432:5432 \
        postgres:15
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
fi

# Activate virtual environment and start Flask
cd backend
source venv/bin/activate

# Set environment variables (use existing .env if present)
export FLASK_APP=app.py
export FLASK_ENV=development
if [ -f ".env" ]; then
    echo "Loading environment from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    # Fallback to default values matching setup.sh
    export DATABASE_URL=postgresql://dbadmin:devpassword@localhost:5432/appdb
    export SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    echo "Generated new SECRET_KEY for this session"
fi

# Initialize database if needed
echo "Initializing database..."
python -c "from app import app, db; app.app_context().push(); db.create_all()" 2>/dev/null || true

# Start Flask server
echo "Starting Flask on http://localhost:5000"
python app.py
