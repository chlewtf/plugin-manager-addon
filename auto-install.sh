#!/bin/bash
# Copyright (c) 2026 chlewtf

set -e

echo "======================================"
echo "Plugin Manager Addon - Auto Installer"
echo "======================================"
echo ""

# Update system packages
echo "[1/8] Updating system packages..."
apt update
apt -y upgrade

# Install required tools
echo "[2/8] Installing required tools..."
apt install -y curl git

# Set Panel to maintenance mode
echo "[3/8] Setting panel to maintenance mode..."
cd /var/www/pterodactyl || exit
php artisan down

# Download files
echo "[4/8] Downloading addon files..."
cd /tmp || exit
rm -rf plugin-manager-addon
git clone https://github.com/chlewtf/plugin-manager-addon
cp -R plugin-manager-addon/code/* /var/www/pterodactyl/

# Install Node.js 18 LTS
echo "[5/8] Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify Node.js version
echo "[6/8] Verifying Node.js installation..."
NODE_VERSION=$(node -v)
echo "Installed: $NODE_VERSION"

# Build Panel
echo "[7/8] Building panel frontend (this may take several minutes)..."
cd /var/www/pterodactyl || exit
npm install --legacy-peer-deps
npm run build:production

# Assign permissions and cleanup
echo "[8/8] Setting permissions..."
chown -R www-data:www-data /var/www/pterodactyl
chmod -R 755 /var/www/pterodactyl
php artisan cache:clear

# Complete
clear
php artisan up
echo ""
echo "======================================"
echo "✅ Installation Complete!"
echo "======================================"
echo ""
echo "Plugin Manager Addon v1.0 has been successfully installed."
echo "Author: chlewtf"
echo ""
echo "Next steps:"
echo "  1. Log into your Pterodactyl Panel"
echo "  2. Navigate to any server"
echo "  3. Look for the 'Plugins' tab in the sidebar"
echo "  4. Search for a plugin (e.g., 'EssentialsX')"
echo ""
echo "For more information, visit:"
echo "  https://github.com/chlewtf/plugin-manager-addon"
echo ""
