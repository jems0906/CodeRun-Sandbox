#!/bin/bash
echo "Starting Railway deployment..."

# Install Python3 for code execution
echo "Installing Python3..."
apt-get update && apt-get install -y python3

# Build React frontend
echo "Building React frontend..."
cd client && npm install && npm run build

# Install server dependencies
echo "Installing server dependencies..."
cd ../server && npm install --production

echo "Setup complete. Starting full-stack server..."
node index.js