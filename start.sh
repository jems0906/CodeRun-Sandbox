#!/bin/bash
echo "Starting Railway backend deployment..."

# Install Python3 for code execution
echo "Installing Python3..."
apt-get update -qq && apt-get install -y python3 --no-install-recommends

# Install server dependencies only
echo "Installing server dependencies..."
cd server && npm ci --production --silent

echo "Backend setup complete. Starting server..."
node index.js