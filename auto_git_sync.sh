#!/bin/bash

# Configuration
WEB_DIR="/var/www/weather-app"
BRANCH="main"

# Navigate to directory
cd "$WEB_DIR" || exit 1

# Reset and pull latest changes
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH

# Update version.json
COMMIT_ID=$(git rev-parse --short HEAD)
COMMIT_TIME=$(git show -s --format=%ct HEAD)
echo "{\"id\": \"$COMMIT_ID\", \"timestamp\": $COMMIT_TIME}" > version.json

# Ensure permissions are correct
chown -R www-data:www-data "$WEB_DIR"
