#!/bin/bash
echo "Starting Railway deployment..."

# Install Python3 for code execution
echo "Installing Python3..."
apt-get update -q && apt-get install -y python3 --no-install-recommends

# Build React frontend with memory limits
echo "Building React frontend..."
export NODE_OPTIONS="--max-old-space-size=1024"
cd client && npm ci --production=false --silent && npm run build --silent

# Install server dependencies
echo "Installing server dependencies..."
cd ../server && npm ci --production --silent

echo "Setup complete. Starting server..."
node index.js