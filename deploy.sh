#!/bin/bash

# Globify Deployment Script
# Usage: ./deploy.sh [user@server] [/path/to/deploy]

set -e

echo "🚀 Globify Deployment Script"
echo "=============================="

# Check if build directory exists
if [ ! -d "build" ]; then
  echo "❌ Build directory not found. Running build..."
  pnpm build
fi

# Default values
SERVER=${1:-"user@your-server"}
DEPLOY_PATH=${2:-"/var/www/globify/build"}

echo ""
echo "📦 Deployment Configuration:"
echo "   Server: $SERVER"
echo "   Path: $DEPLOY_PATH"
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled."
  exit 1
fi

echo ""
echo "📤 Syncing files to server..."
rsync -avz --delete build/ "$SERVER:$DEPLOY_PATH/"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is now deployed to: $SERVER"
echo ""
echo "Next steps:"
echo "1. Verify nginx is running: ssh $SERVER 'sudo systemctl status nginx'"
echo "2. Check nginx config: ssh $SERVER 'sudo nginx -t'"
echo "3. Reload nginx if needed: ssh $SERVER 'sudo systemctl reload nginx'"
echo "4. Visit your site to confirm it's working"
echo ""
