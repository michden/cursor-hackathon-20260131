# Deployment Guide

This guide covers the deployment requirements for VisionCheck AI, including security headers, HTTPS enforcement, and API server configuration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Deployment](#frontend-deployment)
3. [API Server Deployment](#api-server-deployment)
4. [Security Headers](#security-headers)
5. [HTTPS Enforcement](#https-enforcement)
6. [Environment Variables](#environment-variables)

---

## Architecture Overview

VisionCheck AI consists of two components:

1. **Frontend (React SPA)** - Static files served by any web server or CDN
2. **API Server (Node.js/Express)** - Proxies requests to OpenAI API

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Frontend   │     │   OpenAI    │
│             │     │   (Vite)    │     │     API     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       ▲
       │            ┌─────────────┐            │
       └───────────▶│ API Server  │────────────┘
                    │  (Express)  │
                    └─────────────┘
```

---

## Frontend Deployment

### Build the Application

```bash
npm run build
```

This creates a `dist/` folder with static files.

### Deployment Options

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Create `vercel.json` for security headers (see [Security Headers](#security-headers)).

#### Netlify

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com; font-src 'self'"
```

#### Custom Server (Nginx)

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/visioncheck/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com; font-src 'self'" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## API Server Deployment

### Install Dependencies

```bash
cd server
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

### Process Manager (PM2)

```bash
# Install PM2
npm i -g pm2

# Start server
pm2 start server/index.js --name visioncheck-api

# Auto-start on reboot
pm2 startup
pm2 save
```

### Docker Deployment

Create `server/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

Build and run:

```bash
docker build -t visioncheck-api ./server
docker run -d -p 3001:3001 --env-file server/.env visioncheck-api
```

---

## Security Headers

### Required Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS |
| `Content-Security-Policy` | See below | Controls resource loading |

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' https://api.openai.com;
font-src 'self';
media-src 'self';
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### Vercel Configuration

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com; font-src 'self'" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-api-server.com/api/:path*" }
  ]
}
```

---

## HTTPS Enforcement

HTTPS is required for:
- Secure data transmission
- Camera access (getUserMedia requires HTTPS)
- PWA installation

### Enforcement Methods

1. **Hosting Provider** - Enable "Force HTTPS" in dashboard (Vercel, Netlify)
2. **Nginx** - Redirect HTTP to HTTPS (see config above)
3. **HSTS Header** - Browsers remember to use HTTPS

### Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d example.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Environment Variables

### Frontend (Vite)

No environment variables required. All API calls go through the proxy.

### API Server

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PORT` | No | Server port (default: 3001) |

### Production Checklist

- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] OPENAI_API_KEY set on API server
- [ ] API server running and accessible
- [ ] Frontend build deployed
- [ ] API proxy configured (if using separate domains)
- [ ] CORS configured if needed
- [ ] Rate limiting configured (recommended)
- [ ] Error monitoring set up (Sentry, etc.)

---

## Troubleshooting

### API returns "OpenAI API key not configured"

1. Check that `server/.env` exists and contains `OPENAI_API_KEY`
2. Restart the API server after adding the key
3. Verify with: `curl http://localhost:3001/api/health`

### Camera not working

1. Ensure site is served over HTTPS
2. Check browser permissions
3. Test in incognito mode

### CORS errors

If frontend and API are on different domains:

```javascript
// server/index.js
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}))
```

---

## Support

For issues or questions, please open a GitHub issue.
