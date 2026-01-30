#!/bin/bash
echo "Starting Railway deployment..."

# Install Python3 for code execution
echo "Installing Python3..."
apt-get update && apt-get install -y python3

# Install server dependencies only
echo "Installing server dependencies..."
cd server && npm install --production

echo "Setup complete. Starting server..."
node index.js