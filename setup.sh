#!/bin/bash

# Quick setup script for Flask + TypeScript Web Application
# Sets up the entire development environment

set -e  # Exit on error

# Parse arguments
RESET_DB=false
for arg in "$@"; do
    if [ "$arg" == "--reset-db" ]; then
        RESET_DB=true
    fi
done

echo "================================"
echo "Web Application Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker is not installed. You'll need to install PostgreSQL manually${NC}"
fi

echo -e "${GREEN}✓${NC} Prerequisites check passed"
echo ""

# Backend setup
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${YELLOW}⚠${NC} Virtual environment already exists"
fi

# Install dependencies
echo "Installing Python dependencies..."
./venv/bin/pip install --upgrade pip -q
./venv/bin/pip install -r requirements-dev.txt -q
echo -e "${GREEN}✓${NC} Python dependencies installed"

# Create .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql://dbadmin:devpassword@localhost:5432/appdb
SECRET_KEY=dev-secret-key-change-in-production
EOF
    echo -e "${GREEN}✓${NC} .env file created"
else
    echo -e "${YELLOW}⚠${NC} .env file already exists"
fi

cd ..
echo ""

# Frontend setup
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --silent
echo -e "${GREEN}✓${NC} Node.js dependencies installed"

cd ..
echo ""

# Git hooks setup
echo -e "${BLUE}Setting up git hooks...${NC}"
if [ -d ".git" ]; then
    echo "Copying git hooks..."
    cp infrastructure/git-hooks/* .git/hooks/
    chmod +x .git/hooks/*
    echo -e "${GREEN}✓${NC} Git hooks installed"
else
    echo -e "${YELLOW}⚠${NC} Not a git repository, skipping git hooks setup"
fi
echo ""

# Docker setup
if command -v docker &> /dev/null; then
    echo -e "${BLUE}Setting up PostgreSQL database...${NC}"

    # Handle --reset-db option
    if [ "$RESET_DB" = true ]; then
        if docker ps -a | grep -q template-fptb-db; then
            echo "Removing existing database container..."
            docker rm -f template-fptb-db
            echo -e "${GREEN}✓${NC} Existing container removed"
        fi
    fi

    # Check if container already exists
    if docker ps -a | grep -q template-fptb-db; then
        echo -e "${YELLOW}⚠${NC} Database container already exists"

        # Check if it's running
        if docker ps | grep -q template-fptb-db; then
            echo -e "${GREEN}✓${NC} Database is running"
        else
            echo "Starting existing database container..."
            docker start template-fptb-db
            echo -e "${GREEN}✓${NC} Database started"
        fi
    else
        echo "Creating and starting PostgreSQL container..."
        docker run --name template-fptb-db \
            -e POSTGRES_PASSWORD=devpassword \
            -e POSTGRES_USER=dbadmin \
            -e POSTGRES_DB=appdb \
            -p 5432:5432 \
            -d postgres:15

        echo "Waiting for database to be ready..."
        sleep 3
        echo -e "${GREEN}✓${NC} Database is running"
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker not available. Please install PostgreSQL manually:"
    echo "  https://www.postgresql.org/download/"
fi
echo ""

# Summary
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo -e "${GREEN}Backend setup:${NC}"
echo "  - Virtual environment created"
echo "  - Dependencies installed"
echo "  - .env file created"
echo ""
echo -e "${GREEN}Frontend setup:${NC}"
echo "  - Dependencies installed"
echo ""
echo -e "${GREEN}Git hooks setup:${NC}"
if [ -d ".git" ]; then
    echo "  - Pre-commit hooks installed"
else
    echo "  - Skipped (not a git repository)"
fi
echo ""
echo -e "${GREEN}Database setup:${NC}"
if command -v docker &> /dev/null && docker ps | grep -q template-fptb-db; then
    echo "  - PostgreSQL container running on port 5432"
else
    echo "  - Please set up PostgreSQL manually"
fi
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # Windows: venv\\Scripts\\activate"
echo "   python app.py"
echo ""
echo "2. Start the frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser to:"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "4. Create an account and start using the application!"
echo ""
