#!/bin/bash
echo "Starting Railway full-stack deployment..."

# Install Python3 for code execution
echo "Installing Python3..."
apt-get update -qq && apt-get install -y python3 --no-install-recommends

# Build React frontend with memory optimization
echo "Building React frontend..."
export NODE_OPTIONS="--max-old-space-size=1024"
export CI=false
cd client && npm ci --silent && npm run build --silent

# Install server dependencies
echo "Installing server dependencies..."
cd ../server && npm ci --production --silent

echo "Full-stack setup complete. Starting server..."
node index.js