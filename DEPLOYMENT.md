# Globify - Nginx Deployment Guide

This guide walks you through deploying your Globify SvelteKit application to a server with nginx.

## Architecture Overview

Globify is configured as a **Single Page Application (SPA)** with:
- **Client-side rendering only** (no SSR)
- **Offline-first** with IndexedDB for data persistence
- **Static file serving** via nginx
- **SPA fallback routing** for client-side navigation

## Prerequisites

- Ubuntu/Debian server with root or sudo access
- Domain name pointed to your server (optional but recommended)
- Node.js 18+ and pnpm installed locally for building

## Step 1: Build the Application

On your local machine or CI/CD pipeline:

```bash
# Install dependencies if not already done
pnpm install

# Build for production
pnpm build
```

This creates a `build/` directory with all static files ready for deployment.

**Verify the build:**
```bash
ls -la build/
# You should see: index.html, _app/, and other static assets
```

## Step 2: Server Setup

### 2.1 Install nginx

```bash
# Update package lists
sudo apt update

# Install nginx
sudo apt install nginx -y

# Start nginx and enable it to start on boot
sudo systemctl start nginx
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

### 2.2 Create Application Directory

```bash
# Create directory for your application
sudo mkdir -p /var/www/globify

# Set proper ownership (replace 'youruser' with your username)
sudo chown -R $USER:$USER /var/www/globify
```

## Step 3: Deploy Build Files

### Option A: Using rsync (Recommended)

From your local machine, sync the build directory to the server:

```bash
# Replace 'user@your-server-ip' with your actual server details
rsync -avz --delete build/ user@your-server-ip:/var/www/globify/build/
```

### Option B: Using scp

```bash
# Compress the build directory
tar -czf build.tar.gz build/

# Copy to server
scp build.tar.gz user@your-server-ip:/var/www/globify/

# On the server, extract:
ssh user@your-server-ip
cd /var/www/globify
tar -xzf build.tar.gz
rm build.tar.gz
```

### Option C: Using Git (for automated deployments)

```bash
# On the server:
cd /var/www/globify
git clone https://github.com/yourusername/globify.git .

# Install dependencies and build
pnpm install
pnpm build
```

## Step 4: Configure nginx

### 4.1 Copy nginx Configuration

Copy the provided `nginx.conf` to nginx's sites-available directory:

```bash
# From your local machine, copy the config
scp nginx.conf user@your-server-ip:/tmp/globify-nginx.conf

# On the server:
sudo mv /tmp/globify-nginx.conf /etc/nginx/sites-available/globify
```

### 4.2 Update Domain Name

Edit the configuration file:

```bash
sudo nano /etc/nginx/sites-available/globify
```

Replace `globify.example.com` with your actual domain name (or use `_` for default site).

### 4.3 Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/globify /etc/nginx/sites-enabled/

# Optional: Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 5: SSL/HTTPS Setup (Recommended)

### 5.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obtain SSL Certificate

```bash
# Replace with your domain and email
sudo certbot --nginx -d globify.example.com -d www.globify.example.com --email your@email.com --agree-tos --no-eff-email
```

Certbot will automatically:
- Obtain the certificate
- Update your nginx configuration
- Set up auto-renewal

### 5.3 Test Auto-renewal

```bash
sudo certbot renew --dry-run
```

## Step 6: Verify Deployment

1. **Check nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Check nginx error logs if issues occur:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Visit your site:**
   - HTTP: `http://your-domain.com` or `http://your-server-ip`
   - HTTPS: `https://your-domain.com` (after SSL setup)

4. **Test all routes:**
   - `/` - Home page with app launcher
   - `/okr` - OKR System
   - `/issues` - Issues tracker
   - `/crm` - CRM Pipeline
   - `/sales` - Sales & Invoices
   - `/chat` - Chat application

5. **Test browser features:**
   - IndexedDB should work (check browser DevTools → Application → IndexedDB)
   - All data should persist after page refresh
   - Client-side navigation should work smoothly

## Step 7: Firewall Configuration (if applicable)

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status
```

## Maintenance & Updates

### Updating the Application

When you make changes and need to redeploy:

```bash
# On your local machine:
# 1. Build the new version
pnpm build

# 2. Sync to server
rsync -avz --delete build/ user@your-server-ip:/var/www/globify/build/

# No nginx reload needed for static file changes
# Browser cache may need clearing for users to see changes immediately
```

### Monitoring Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### nginx Commands Reference

```bash
# Test configuration
sudo nginx -t

# Reload configuration (graceful, no downtime)
sudo systemctl reload nginx

# Restart nginx (brief downtime)
sudo systemctl restart nginx

# Stop nginx
sudo systemctl stop nginx

# Start nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

## Troubleshooting

### Issue: 404 errors on page refresh

**Cause:** nginx not configured to fallback to index.html for SPA routes

**Solution:** Verify the `try_files $uri $uri/ /index.html;` directive is present in your nginx config.

### Issue: Static assets not loading

**Cause:** Incorrect root path or file permissions

**Solution:**
```bash
# Check root path in nginx config
grep "root" /etc/nginx/sites-available/globify

# Verify files exist
ls -la /var/www/globify/build/

# Fix permissions
sudo chown -R www-data:www-data /var/www/globify/build/
sudo chmod -R 755 /var/www/globify/build/
```

### Issue: IndexedDB not working

**Cause:** Browser security restrictions require HTTPS for IndexedDB in production

**Solution:** Set up SSL/HTTPS following Step 5.

### Issue: Changes not appearing

**Cause:** Browser caching

**Solution:**
- Hard refresh: Ctrl+Shift+R (Chrome/Firefox) or Cmd+Shift+R (Mac)
- Clear browser cache
- Add cache busting to build files (SvelteKit does this automatically with `/_app/immutable/`)

## Performance Optimization

### Enable gzip Compression

Already included in the provided nginx.conf, but verify:

```bash
sudo nano /etc/nginx/sites-available/globify
# Ensure gzip directives are present
```

### Add HTTP/2 Support

HTTP/2 is automatically enabled when using SSL (HTTPS).

### Optimize Cache Headers

The provided configuration already includes optimal cache headers:
- Static assets (JS, CSS, images): cached for 1 year
- Immutable SvelteKit files: cached for 1 year
- HTML files: no cache (always fetch latest)

## Production Checklist

- [ ] Build application with `pnpm build`
- [ ] Upload build files to `/var/www/globify/build/`
- [ ] Configure nginx with correct domain name
- [ ] Enable nginx site configuration
- [ ] Test nginx configuration with `sudo nginx -t`
- [ ] Reload nginx with `sudo systemctl reload nginx`
- [ ] Set up SSL certificate with certbot
- [ ] Test auto-renewal with `sudo certbot renew --dry-run`
- [ ] Configure firewall to allow HTTP/HTTPS
- [ ] Test all routes and functionality
- [ ] Verify IndexedDB works in browser DevTools
- [ ] Set up monitoring/logging (optional)
- [ ] Configure automated deployment pipeline (optional)

## Alternative Deployment Options

### Docker Deployment

If you prefer Docker, create a `Dockerfile`:

```dockerfile
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SvelteKit app
COPY build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t globify:latest .
docker run -d -p 80:80 globify:latest
```

### Static Hosting Services

Since Globify is a static SPA, you can also deploy to:
- **Netlify:** `netlify deploy --prod --dir=build`
- **Vercel:** `vercel --prod`
- **Cloudflare Pages:** Connect your Git repository
- **GitHub Pages:** Requires additional configuration for SPA routing

## Support

For issues with:
- **SvelteKit:** https://kit.svelte.dev/docs
- **nginx:** https://nginx.org/en/docs/
- **Certbot:** https://certbot.eff.org/docs/

## Environment-Specific Configuration

If you need different configurations for different environments, create multiple nginx configs:

```bash
/etc/nginx/sites-available/globify-staging
/etc/nginx/sites-available/globify-production
```

Enable the appropriate one based on your deployment target.
