#!/bin/bash

# Teardown script - stops all running services and cleans up

set -e

echo "================================"
echo "Teardown Services"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop Flask backend
echo -e "${BLUE}Stopping Flask backend...${NC}"
FLASK_PIDS=$(pgrep -f "python.*app.py" || true)
if [ -n "$FLASK_PIDS" ]; then
    echo "Found Flask processes: $FLASK_PIDS"
    kill $FLASK_PIDS 2>/dev/null || true
    sleep 1
    # Force kill if still running
    kill -9 $FLASK_PIDS 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Flask backend stopped"
else
    echo -e "${YELLOW}⚠${NC} No Flask backend process found"
fi

# Stop webpack dev server
echo -e "${BLUE}Stopping webpack dev server...${NC}"
WEBPACK_PIDS=$(pgrep -f "webpack.*dev" || true)
if [ -n "$WEBPACK_PIDS" ]; then
    echo "Found webpack processes: $WEBPACK_PIDS"
    kill $WEBPACK_PIDS 2>/dev/null || true
    sleep 1
    # Force kill if still running
    kill -9 $WEBPACK_PIDS 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Webpack dev server stopped"
else
    echo -e "${YELLOW}⚠${NC} No webpack dev server process found"
fi

# Stop Node processes (catch-all for frontend)
echo -e "${BLUE}Stopping Node processes...${NC}"
NODE_PIDS=$(pgrep -f "node.*frontend" || true)
if [ -n "$NODE_PIDS" ]; then
    echo "Found Node processes: $NODE_PIDS"
    kill $NODE_PIDS 2>/dev/null || true
    sleep 1
    kill -9 $NODE_PIDS 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Node processes stopped"
else
    echo -e "${YELLOW}⚠${NC} No Node processes found"
fi

# Optionally stop PostgreSQL container
echo ""
echo -e "${BLUE}PostgreSQL container status:${NC}"
if docker ps | grep -q template-fptb-db; then
    echo "PostgreSQL container is running"
    read -p "Do you want to stop the PostgreSQL container? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop template-fptb-db
        echo -e "${GREEN}✓${NC} PostgreSQL container stopped"
    else
        echo -e "${YELLOW}⚠${NC} PostgreSQL container left running"
    fi
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL container is not running"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Teardown complete!${NC}"
echo -e "${GREEN}================================${NC}"
