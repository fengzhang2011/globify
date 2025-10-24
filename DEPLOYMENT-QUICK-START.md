# Globify - Quick Deployment Guide

## Quick Start

### 1. Build the Application

```bash
pnpm build
```

This creates a `build/` directory with all static files.

### 2. Deploy to Server

**Option A: Using the deployment script**

```bash
./deploy.sh user@your-server-ip /var/www/globify/build
```

**Option B: Manual rsync**

```bash
rsync -avz --delete build/ user@your-server-ip:/var/www/globify/build/
```

### 3. Configure nginx on Server

```bash
# Copy nginx config
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/globify

# Edit domain name
sudo nano /etc/nginx/sites-available/globify
# Change 'globify.example.com' to your domain

# Enable site
sudo ln -s /etc/nginx/sites-available/globify /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Optional: Setup SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Files Created

- **[svelte.config.js](svelte.config.js)** - Updated to use `@sveltejs/adapter-static` for production builds
- **[src/routes/+layout.ts](src/routes/+layout.ts)** - Enables client-side rendering (SPA mode)
- **[nginx.conf](nginx.conf)** - nginx configuration for serving the application
- **[deploy.sh](deploy.sh)** - Automated deployment script
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide with troubleshooting

## Architecture

Globify is deployed as a **Single Page Application (SPA)**:

- ✅ All rendering happens client-side
- ✅ Data persists locally using IndexedDB (offline-first)
- ✅ Served as static files via nginx
- ✅ No server-side dependencies needed
- ✅ Works completely offline after initial load

## Deployed Apps

After deployment, these apps will be available:

- `/` - Home page with app launcher
- `/okr` - OKR System with timeline
- `/issues` - Issue tracking system
- `/crm` - CRM Pipeline (drag & drop kanban)
- `/sales` - Quotations & Invoices
- `/chat` - Chat application

## Maintenance

**Update deployment:**
```bash
pnpm build
./deploy.sh user@server /var/www/globify/build
```

**Check logs:**
```bash
ssh user@server
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Restart nginx:**
```bash
ssh user@server
sudo systemctl restart nginx
```

## Troubleshooting

### Pages not loading (404 on refresh)
- Ensure `try_files $uri $uri/ /index.html;` is in nginx config
- Run `sudo nginx -t` to test configuration

### IndexedDB not working
- SSL/HTTPS is required for IndexedDB in production
- Setup SSL using certbot (see DEPLOYMENT.md)

### Static assets not loading
- Check file permissions: `sudo chmod -R 755 /var/www/globify/build/`
- Verify ownership: `sudo chown -R www-data:www-data /var/www/globify/build/`

## Production Checklist

- [ ] Run `pnpm build` successfully
- [ ] Upload build files to server
- [ ] Configure nginx with your domain
- [ ] Enable nginx site and test config (`sudo nginx -t`)
- [ ] Reload nginx (`sudo systemctl reload nginx`)
- [ ] Setup SSL certificate with certbot
- [ ] Test all routes work correctly
- [ ] Verify IndexedDB functionality in browser DevTools
- [ ] Test offline functionality

## Need More Details?

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Complete step-by-step instructions
- SSL/HTTPS setup guide
- Firewall configuration
- Performance optimization
- Docker deployment option
- Alternative hosting platforms
- Detailed troubleshooting

## Support

- SvelteKit Docs: https://kit.svelte.dev/docs
- nginx Docs: https://nginx.org/en/docs/
- Certbot: https://certbot.eff.org/docs/
