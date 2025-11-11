#!/bin/bash

# JDParty Quick Start - No prompts, just build and run
set -e

echo "🎉 JDParty Quick Start"
echo "====================="
echo ""

# Create .env if missing
if [ ! -f "packages/server/.env" ]; then
    echo "⚠️  Creating .env from template..."
    cp packages/server/.env.example packages/server/.env
    echo "⚠️  Remember to add your Spotify credentials to packages/server/.env"
    echo ""
fi

# Install and build
echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building packages..."
pnpm build

echo ""
echo "✅ Build complete!"
echo ""
echo "🚀 Starting JDParty web interface in development mode..."
echo ""
echo "   Server: http://localhost:8080"
echo "   PWA:    http://localhost:3000"
echo ""
echo "   To run the desktop app, use 'pnpm run desktop' in a separate terminal."
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start development mode for web components
pnpm --filter="@jdparty/server" --filter="@jdparty/pwa" dev
