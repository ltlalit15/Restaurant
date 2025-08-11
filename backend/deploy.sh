#!/bin/bash
echo "Universal Backend Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "Error: server.js not found. Please run from backend directory."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the server
echo "Starting server on port ${PORT:-3001}..."
npm start
