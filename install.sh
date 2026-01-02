#!/bin/bash
# Weather-App One-Liner Installer for TurnKey NGINX PHP FastCGI
# 
# Usage (with credentials):
# GITHUB_USER="user" GITHUB_TOKEN="token" curl -sSL https://raw.githubusercontent.com/DeNNiiInc/Weather-App/main/install.sh | bash
#
# Or run directly on server after cloning:
# bash install.sh

set -e

# Configuration
APP_NAME="weather-app"
WEB_ROOT="/var/www/${APP_NAME}"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}"
GITHUB_REPO="DeNNiiInc/Weather-App"

# Check for required environment variables or prompt
if [ -z "$GITHUB_USER" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GitHub credentials not provided as environment variables."
    echo "Please set GITHUB_USER and GITHUB_TOKEN, or enter them now:"
    read -p "GitHub Username/Email: " GITHUB_USER
    read -sp "GitHub Token: " GITHUB_TOKEN
    echo ""
fi

# URL encode the username (handle @ symbol)
GITHUB_USER_ENCODED=$(echo "$GITHUB_USER" | sed 's/@/%40/g')

echo "🌤️  Weather-App Installer"
echo "========================="

# Check if PORT is already set, otherwise find an unused one
if [ -z "$PORT" ]; then
    find_unused_port() {
        while true; do
            local p=$(shuf -i 10000-20000 -n 1)
            if ! ss -tuln | grep -q ":${p} "; then
                echo "$p"
                return
            fi
        done
    }
    PORT=$(find_unused_port)
fi

echo "📡 Selected port: ${PORT}"

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing git..."
    apt-get update -qq && apt-get install -y git -qq
fi

# Clone repository
echo "📥 Cloning Weather-App repository..."
rm -rf "${WEB_ROOT}"
mkdir -p "${WEB_ROOT}"
git clone --depth 1 "https://${GITHUB_USER_ENCODED}:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "${WEB_ROOT}"

# Remove sensitive files from web root
rm -f "${WEB_ROOT}/secrets.php"
rm -f "${WEB_ROOT}/secrets.sample.php"
rm -f "${WEB_ROOT}/install.sh"
rm -f "${WEB_ROOT}/generate_install.php"

# Generate initial version.json
echo "📝 Generating version info..."
cd "${WEB_ROOT}"
COMMIT_ID=$(git rev-parse --short HEAD)
COMMIT_TIME=$(git show -s --format=%ct HEAD)
echo "{\"id\": \"$COMMIT_ID\", \"timestamp\": $COMMIT_TIME}" > version.json
cd - > /dev/null

# Setup Auto-Sync (Cron)
echo "🔄 Setting up Auto-Sync..."
SYNC_SCRIPT="${WEB_ROOT}/auto_git_sync.sh"
chmod +x "$SYNC_SCRIPT"
# Run every 5 minutes
CRON_JOB="*/5 * * * * $SYNC_SCRIPT >> /var/log/weather-app-sync.log 2>&1"
(crontab -l 2>/dev/null | grep -v "$SYNC_SCRIPT"; echo "$CRON_JOB") | crontab -

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data "${WEB_ROOT}"
chmod -R 755 "${WEB_ROOT}"

# Create NGINX configuration
echo "⚙️  Configuring NGINX on port ${PORT}..."
cat > "${NGINX_SITE}" << EOF
server {
    listen ${PORT};
    listen [::]:${PORT};
    
    root ${WEB_ROOT};
    index index.html index.php;
    
    server_name _;
    
    # Serve static files with proper caching
    location / {
        try_files \$uri \$uri/ =404;
        
        # Enable gzip compression
        gzip on;
        gzip_types text/css application/javascript application/json;
        
        # Cache static assets
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # PHP processing (if needed)
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
ln -sf "${NGINX_SITE}" "${NGINX_ENABLED}"

# Test and reload NGINX
echo "🔄 Reloading NGINX..."
nginx -t && systemctl reload nginx

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Verify installation
echo ""
echo "✅ Installation Complete!"
echo "========================="
echo "🌐 Access URL: http://${SERVER_IP}:${PORT}/"
echo "📁 Web Root:   ${WEB_ROOT}"
echo "⚙️  NGINX Config: ${NGINX_SITE}"
echo ""
echo "🧪 Testing connection..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/" | grep -q "200"; then
    echo "✅ Server is responding correctly!"
else
    echo "⚠️  Server may need a moment to start. Try accessing the URL in a browser."
fi
