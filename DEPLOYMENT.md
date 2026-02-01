# Deployment Guide

This guide covers deployment options for VisionCheck AI, including the recommended Vercel setup and alternative configurations.

## Table of Contents

1. [Quick Start (Vercel)](#quick-start-vercel)
2. [Architecture Overview](#architecture-overview)
3. [Vercel Deployment](#vercel-deployment)
4. [Alternative Deployments](#alternative-deployments)
5. [Security Headers](#security-headers)
6. [HTTPS Enforcement](#https-enforcement)
7. [Environment Variables](#environment-variables)

---

## Quick Start (Vercel)

The fastest way to deploy VisionCheck AI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time will prompt for project setup)
vercel

# Set your OpenAI API key
vercel env add OPENAI_API_KEY
```

That's it! Vercel will automatically:
- Build the React frontend
- Deploy the serverless API functions from `/api`
- Configure security headers from `vercel.json`

---

## Architecture Overview

VisionCheck AI uses Vercel's unified deployment model:

```
┌─────────────┐     ┌─────────────────────────────────┐
│   Browser   │────▶│           Vercel                │
│             │     │  ┌─────────────────────────────┐│
└─────────────┘     │  │  Static Files (React SPA)   ││
                    │  └─────────────────────────────┘│
                    │  ┌─────────────────────────────┐│     ┌─────────────┐
                    │  │  Serverless Functions       ││────▶│   OpenAI    │
                    │  │  /api/chat, /api/analyze    ││     │     API     │
                    │  └─────────────────────────────┘│     └─────────────┘
                    └─────────────────────────────────┘
```

**Components:**
- **Frontend**: React SPA built with Vite, served as static files
- **API**: Serverless functions in `/api` directory that proxy requests to OpenAI

---

## Vercel Deployment

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. An [OpenAI API key](https://platform.openai.com/api-keys)

### Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deploy via GitHub

1. Push your code to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Vercel auto-detects the Vite framework
4. Add your environment variable before deploying

### Add OpenAI API Key

**Via CLI:**
```bash
vercel env add OPENAI_API_KEY
# Enter your key when prompted
# Select environments: Production, Preview, Development
```

**Via Dashboard:**
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add `OPENAI_API_KEY` with your API key
4. Select environments and save

### Local Development

For local development, the Vite dev server proxies API requests to a local Express server:

```bash
# Terminal 1: Start the local API server
cd server
npm install
cp .env.example .env  # Add your OPENAI_API_KEY
npm run dev

# Terminal 2: Start the frontend
npm run dev
```

Or use Vercel CLI for local development with serverless functions:

```bash
vercel dev
```

---

## Alternative Deployments

For platforms other than Vercel, you'll need to deploy the Express API server separately.

### Netlify (Frontend) + Separate API

Netlify can host the frontend, but you'll need to deploy the API server elsewhere (Railway, Render, Fly.io, etc.).

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
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://your-api-server.com; font-src 'self'"

[[redirects]]
  from = "/api/*"
  to = "https://your-api-server.com/api/:splat"
  status = 200
```

### Custom Server (Nginx + Express API)

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

    # API proxy to Express server
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

### Express API Server (for non-Vercel deployments)

The `server/` directory contains a standalone Express server for platforms that don't support serverless functions.

```bash
cd server
npm install
cp .env.example .env  # Add your OPENAI_API_KEY
npm start
```

#### Process Manager (PM2)

```bash
npm i -g pm2
pm2 start server/index.js --name visioncheck-api
pm2 startup
pm2 save
```

#### Docker

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
docker run -d -p 3001:3001 -e OPENAI_API_KEY=your_key visioncheck-api
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

The `vercel.json` file in the project root configures security headers and routing:

```json
{
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "..." }
      ]
    }
  ]
}
```

API routes in `/api` are automatically deployed as serverless functions.

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

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys) |
| `PORT` | No | Express server port (default: 3001, only for non-Vercel deployments) |

### Setting Variables by Platform

| Platform | Method |
|----------|--------|
| **Vercel** | Dashboard → Settings → Environment Variables, or `vercel env add` |
| **Netlify** | Dashboard → Site settings → Environment variables |
| **Railway** | Dashboard → Variables |
| **Docker** | `-e OPENAI_API_KEY=your_key` or `--env-file` |
| **Local** | Create `.env` file from `.env.example` |

### Production Checklist

- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] `OPENAI_API_KEY` environment variable set
- [ ] API endpoints accessible (`/api/health` returns `{"status":"ok","apiKeyConfigured":true}`)
- [ ] Rate limiting configured (recommended for production)
- [ ] Error monitoring set up (Sentry, etc.)

---

## Troubleshooting

### API returns "OpenAI API key not configured"

**Vercel:**
1. Check Settings → Environment Variables in your Vercel dashboard
2. Ensure `OPENAI_API_KEY` is set for the correct environment (Production/Preview)
3. Redeploy after adding the variable

**Local/Express:**
1. Check that `server/.env` exists and contains `OPENAI_API_KEY`
2. Restart the API server after adding the key
3. Verify with: `curl http://localhost:3001/api/health`

### Camera not working

1. Ensure site is served over HTTPS
2. Check browser permissions
3. Test in incognito mode

### CORS errors (non-Vercel deployments)

If frontend and API are on different domains:

```javascript
// server/index.js
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}))
```

### Vercel function timeout

For long-running requests, you may need to upgrade to a Pro plan or optimize the request. The default timeout is 10 seconds on the Hobby plan.

---

## Support

For issues or questions, please open a GitHub issue.
