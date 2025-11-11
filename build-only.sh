#!/bin/bash

# JDParty Build Only Script
set -e

echo "🔨 Building JDParty..."
echo ""

# Build in order
echo "1/3 Building shared..."
pnpm --filter @jdparty/shared build

echo "2/3 Building server..."
pnpm --filter @jdparty/server build

echo "3/3 Building PWA..."
pnpm --filter @jdparty/pwa build

echo ""
echo "✅ All packages built successfully!"
echo ""
echo "To run:"
echo "  Development: ./quick-start.sh"
echo "  Production:  cd packages/server && node dist/index.js"
