# Overview

A modern addon for Pterodactyl Panel and Jexactyl Panel that enables server administrators to search and install Spigot plugins directly from the panel dashboard.

## Requirements

- Pterodactyl Panel v1.11.5 or later / Jexactyl v3.1.0 or later
- Node.js 18.0.0 or later
- npm 9.0.0 or later (or yarn 3.0.0+)
- PHP 8.1 or later

## Installation

Check [INSTALL.md](INSTALL.MD) for installation.

## API Endpoints

All endpoints require authentication and proper permissions.

### Search Plugins
- **POST** `/api/client/servers/{server}/plugins`
- **Parameters:** 
  - `query` (string, required): Search query
  - `page` (integer, optional, default: 1): Page number for pagination
  - `limit` (integer, optional, default: 20): Results per page

### Install Plugin
- **POST** `/api/client/servers/{server}/plugins/install/{id}`
- **Required Permission:** `file.create`
- **Parameters:**
  - `id` (integer, required): Plugin ID from Spigot

## Configuration

The addon uses Pterodactyl's native permission system. Users need the `file.create` permission to install plugins.

## Troubleshooting

### "Couldn't find any results for that query"
- Verify your internet connection
- Check if the Spigot API is accessible
- Try a simpler search query

### Plugins not installing
- Ensure the server has a `plugins` directory
- Check server file permissions
- Verify you have the `file.create` permission

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear panel cache: `php artisan cache:clear`
- Ensure Node.js 18+ is installed: `node --version`

## License 📄

Licensed under MIT. Chle and contributors. All rights reserved.