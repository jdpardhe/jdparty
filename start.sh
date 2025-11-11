#!/bin/bash

# JDParty One-Shot Build and Run Script
# This script builds and starts the entire JDParty application

set -e  # Exit on error

echo "🎉 JDParty - Build and Run Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "packages/server/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: packages/server/.env not found${NC}"
    echo "Creating from .env.example..."
    cp packages/server/.env.example packages/server/.env
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Please edit packages/server/.env and add your Spotify credentials!${NC}"
    echo ""
    read -p "Press Enter to continue after updating .env, or Ctrl+C to exit..."
fi

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
pnpm clean || true
echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install
echo ""

# Build all packages
echo -e "${BLUE}🔨 Building all packages...${NC}"
echo "  Building shared package..."
pnpm --filter @jdparty/shared build

echo "  Building server package..."
pnpm --filter @jdparty/server build

echo "  Building PWA package..."
pnpm --filter @jdparty/pwa build

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""

# Ask user what to run
echo "What would you like to run?"
echo "  1) Development mode (all services with hot reload)"
echo "  2) Production mode (server only)"
echo "  3) Server only (development)"
echo "  4) PWA only (development)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Starting JDParty in development mode...${NC}"
        echo ""
        echo "Server will run on: http://localhost:8080"
        echo "PWA will run on: http://localhost:3000"
        echo ""
        pnpm dev
        ;;
    2)
        echo ""
        echo -e "${GREEN}🚀 Starting JDParty server (production)...${NC}"
        echo ""
        echo "Server running on: http://localhost:8080"
        echo ""
        cd packages/server && NODE_ENV=production node dist/index.js
        ;;
    3)
        echo ""
        echo -e "${GREEN}🚀 Starting JDParty server (development)...${NC}"
        echo ""
        pnpm server
        ;;
    4)
        echo ""
        echo -e "${GREEN}🚀 Starting JDParty PWA (development)...${NC}"
        echo ""
        pnpm pwa
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac
