# Plugin Manager Installation Guide

## System Requirements

- **Pterodactyl Panel:** v1.11.5 or newer
- **Jexactyl Panel:** v3.1.0 or newer
- **Node.js:** v18.0.0 or later
- **npm:** v9.0.0 or later
- **PHP:** 8.1 or later
- **Disk Space:** ~500MB for dependencies

## Automatic Installation (Recommended)

The automated installation script handles all setup steps automatically.

```bash
sudo curl -Lo auto-install.sh https://raw.githubusercontent.com/chlewtf/plugin-manager-addon/main/auto-install.sh
sudo chmod u+x auto-install.sh
sudo ./auto-install.sh
```

The script will:
1. Download the latest addon files
2. Copy files to your Pterodactyl installation
3. Install Node.js dependencies
4. Build the production frontend
5. Clear the application cache

## Manual Installation (Advanced)

### Step 1: Download Files

```bash
cd /tmp
git clone https://github.com/chlewtf/plugin-manager-addon
cd plugin-manager-addon
```

### Step 2: Copy to Pterodactyl

```bash
cp -R * /var/www/pterodactyl/
cd /var/www/pterodactyl
```

### Step 3: Verify Node.js Version

Ensure Node.js 18+ is installed:

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Check version
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Build the Frontend

```bash
npm run build:production
```

This may take 5-10 minutes depending on your system.

### Step 6: Clear Cache

```bash
php artisan cache:clear
```

## Verification

After installation, verify everything is working:

1. Log into your Pterodactyl Panel
2. Go to any server's file manager
3. Look for a "Plugins" tab in the sidebar
4. Try searching for a plugin (e.g., "EssentialsX")

## Troubleshooting

### Node.js Not Found
```bash
# Install Node.js with nvm (Node Version Manager) - Recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Build Fails with Memory Error
If you get "JavaScript heap out of memory":
```bash
export NODE_OPTIONS=--max-old-space-size=4096
npm run build:production
```

### Permission Denied Errors
```bash
sudo chown -R www-data:www-data /var/www/pterodactyl
sudo chmod -R 755 /var/www/pterodactyl
```

### API Endpoint Not Found
Clear the route cache:
```bash
php artisan route:cache
php artisan cache:clear
```

## Updating

To update to the latest version:

```bash
cd /tmp
git clone https://github.com/chlewtf/plugin-manager-addon
cd plugin-manager-addon
cp -R code/* /var/www/pterodactyl/
cd /var/www/pterodactyl
npm install
npm run build:production
php artisan cache:clear
```

## Support

Need help? Contact chlewtf on Discord or open an issue on GitHub.
