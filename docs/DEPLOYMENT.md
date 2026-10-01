# Deployment Guide

This guide covers deploying the B.L. Diagnostic Center application to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Google Sheets Setup](#google-sheets-setup)
- [Firebase Setup](#firebase-setup)
- [SMS Provider Setup](#sms-provider-setup)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- npm or bun package manager
- Google Cloud account with Google Sheets API access
- Firebase project with Firestore enabled
- SMS provider account (MSG91, Fast2SMS, or Twilio)
- PostgreSQL database (optional, if using PostgreSQL)
- Domain name configured
- SSL certificate (for production)

## Environment Configuration

### 1. Create Production Environment File

Create `.env.production` in the project root:

```bash
cp .env.example .env.production
```

### 2. Configure Production Variables

Edit `.env.production` with production values:

```bash
# Runtime Environment
NODE_ENV="production"
PORT="3000"
APP_URL="https://your-domain.com"
ALLOWED_ORIGINS="https://your-domain.com"

# SMS Provider
SMS_PROVIDER="MSG91"
SMS_API_KEY="your-production-api-key"
SMS_SENDER_ID="BLDIAG"
SMS_TEMPLATE_ID="your-template-id"

# OTP Security (Generate secure secrets)
OTP_SECRET="generate-64-char-random-secret-here"
SESSION_SECRET="generate-64-char-random-secret-here"
OTP_EXPIRY_SECONDS="300"
OTP_RESEND_COOLDOWN_SECONDS="30"
OTP_MAX_ATTEMPTS="5"
OTP_RATE_LIMIT_WINDOW_MS="600000"
OTP_MAX_SENDS_PER_WINDOW="6"
ADMIN_MOBILE_NUMBERS="+919649183422,+919876543210"

# Firebase Configuration
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
VITE_FIREBASE_APP_ID="your-firebase-app-id"
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"

# Google Maps
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Google Sheets (Service Account - Recommended)
GOOGLE_PROJECT_ID="your-gcp-project-id"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GOOGLE_SHEETS_SYNC_ENABLED="true"
GOOGLE_SHEETS_MAX_RETRY_ATTEMPTS="5"
GOOGLE_SHEETS_RETRY_BACKOFF_MS="3000"

# PostgreSQL (if using)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="120"

# Logging
LOG_LEVEL="info"
ENABLE_AUDIT_LOGGING="true"
BACKUP_RETENTION_DAYS="30"
```

### 3. Generate Secure Secrets

Use a secure method to generate secrets:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Build Process

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Build for Production

```bash
npm run build
```

This creates:
- `dist/` directory with optimized static assets
- Minified JavaScript and CSS
- Optimized bundle sizes

### 3. Verify Build

```bash
npm run preview
```

Test the production build locally at `http://localhost:4173`

## Deployment Options

### Option 1: VPS / Cloud Server (Recommended)

#### Using PM2 (Process Manager)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create PM2 ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bl-diagnostic',
    script: './server.ts',
    interpreter: 'node',
    interpreter_args: '-r tsx/esm',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

4. Monitor:
```bash
pm2 status
pm2 logs bl-diagnostic
pm2 monit
```

#### Using systemd

Create `/etc/systemd/system/bl-diagnostic.service`:

```ini
[Unit]
Description=B.L. Diagnostic Center
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bl-diagnostic
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node -r tsx/esm server.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable bl-diagnostic
sudo systemctl start bl-diagnostic
sudo systemctl status bl-diagnostic
```

### Option 2: Docker Deployment

#### Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "-r", "tsx/esm", "server.ts"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Build and Run

```bash
docker-compose build
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Vercel (Frontend Only)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

Note: Backend needs separate deployment (e.g., Railway, Render, or VPS).

#### Railway (Full Stack)

1. Install Railway CLI:
```bash
npm install -g railway
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Configure environment variables in Railway dashboard.

#### Render

1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Configure start command: `npm run start`
4. Add environment variables in dashboard
5. Deploy

### Option 4: PaaS (Platform as a Service)

#### Heroku

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Create app:
```bash
heroku create bl-diagnostic
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
# Set other variables...
```

4. Deploy:
```bash
git push heroku main
```

## Google Sheets Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Sheets API:
   - Navigate to APIs & Services > Library
   - Search for "Google Sheets API"
   - Click Enable

### 2. Create Service Account (Recommended)

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details
4. Click "Create and Continue"
5. Skip granting access (we'll do this later)
6. Click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download and secure the key file
6. Copy `private_key` and `client_email` to `.env.production`

### 4. Share Spreadsheet with Service Account

1. Open your Google Sheets spreadsheet
2. Click "Share"
3. Paste service account email
4. Grant "Editor" permissions
5. Click "Send"

### 5. Initialize Spreadsheet Tabs

The system will automatically create required tabs on first sync, or you can create them manually:

Required tabs:
- Users
- Patients
- Bookings
- Home Collection
- Leads
- Tests
- Packages
- Time Slots
- Sync Logs

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Follow setup wizard
4. Enable Firestore Database
5. Set Firestore rules (see `firestore.rules`)

### 2. Get Firebase Configuration

1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Add Web app
4. Copy configuration values to `.env.production`

### 3. Deploy Firestore Rules

```bash
firebase login
firebase deploy --only firestore:rules
```

### 4. Firestore Security Rules

Copy the rules from `firestore.rules` to Firebase Console > Firestore > Rules.

## SMS Provider Setup

### MSG91

1. Sign up at [MSG91](https://msg91.com)
2. Get API key from dashboard
3. Create DLT template (for India)
4. Get template ID
5. Configure in `.env.production`:
```bash
SMS_PROVIDER="MSG91"
SMS_API_KEY="your-msg91-api-key"
SMS_SENDER_ID="BLDIAG"
SMS_TEMPLATE_ID="your-template-id"
```

### Fast2SMS

1. Sign up at [Fast2SMS](https://fast2sms.com)
2. Get API key from dashboard
3. Configure in `.env.production`:
```bash
SMS_PROVIDER="FAST2SMS"
SMS_API_KEY="your-fast2sms-api-key"
SMS_SENDER_ID="FSTSMS"
```

### Twilio

1. Sign up at [Twilio](https://twilio.com)
2. Get Account SID and Auth Token
3. Purchase phone number
4. Configure in `.env.production`:
```bash
SMS_PROVIDER="TWILIO"
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
```

## Database Setup

### PostgreSQL (Optional)

If using PostgreSQL as primary database:

1. Create database:
```sql
CREATE DATABASE bl_diagnostic_prod;
```

2. Run migrations:
```bash
npx prisma migrate deploy
```

3. Seed initial data:
```bash
npx prisma db seed
```

### Firebase Firestore (Primary)

1. Firestore is configured in Firebase setup
2. No additional setup required
3. Collections are created automatically

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Using Cloudflare

1. Point domain to Cloudflare
2. Enable SSL/TLS in Cloudflare dashboard
3. Set to "Full" mode

### Using Nginx Reverse Proxy

Create Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "B.L. Diagnostic Center Production Server",
  "environment": "production"
}
```

### 2. Configure Google Sheets

1. Access admin panel at `https://your-domain.com/#admin`
2. Navigate to "Google Sheets Sync"
3. Enter spreadsheet URL or ID
4. Click "Connect"
5. Verify tabs are created

### 3. Initial Data Sync

1. In admin panel, navigate to "Google Sheets Sync"
2. Click "Initial Sync"
3. Verify data appears in Google Sheets

### 4. Test Authentication

1. Navigate to login page
2. Enter test mobile number
3. Verify OTP is sent (check sandbox OTP in dev mode)
4. Verify login creates user in Firestore
5. Verify user syncs to Google Sheets

### 5. Test Booking Flow

1. Navigate to tests page
2. Select a test
3. Complete booking
4. Verify booking created in Firestore
5. Verify booking syncs to Google Sheets

## Monitoring

### Application Monitoring

#### PM2 Monitoring

```bash
pm2 monit
pm2 logs bl-diagnostic
```

#### Health Endpoint

Monitor `/api/health` endpoint:
- Uptime
- Google Sheets connection status
- Database connectivity

### Log Management

#### Configure Log Rotation

Create `/etc/logrotate.d/bl-diagnostic`:

```
/var/www/bl-diagnostic/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

#### Centralized Logging

Consider using:
- Papertrail
- Loggly
- Datadog
- Cloud Logging (if using GCP)

### Error Tracking

Integrate error tracking:
- Sentry
- Rollbar
- Bugsnag

### Performance Monitoring

- Google Analytics (frontend)
- New Relic (full stack)
- Datadog APM

## Backup Strategy

### Firebase Firestore

- Enable automatic backups in Firebase Console
- Export data regularly:
```bash
firebase firestore:export --backup-path ./backups
```

### Google Sheets

- Google Sheets has built-in version history
- Export regularly as Excel/CSV
- Use Google Takeout for full backup

### Database Backups

If using PostgreSQL:
```bash
pg_dump bl_diagnostic_prod > backup_$(date +%Y%m%d).sql
```

Automate with cron:
```bash
0 2 * * * pg_dump bl_diagnostic_prod > /backups/daily_$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx, HAProxy, or cloud LB)
2. Deploy multiple instances
3. Use external session store (Redis)
4. Configure shared database

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Enable caching
4. Use CDN for static assets

## Security Checklist

- [ ] Environment variables secured
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Secrets not in version control
- [ ] Database access restricted
- [ ] Regular backups configured
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Dependencies updated regularly

## Troubleshooting

### Common Issues

#### Server Won't Start

Check logs:
```bash
pm2 logs bl-diagnostic
# or
journalctl -u bl-diagnostic
```

Common causes:
- Port already in use
- Environment variables missing
- Database connection failed
- Dependency issues

#### Google Sheets Sync Fails

1. Check credentials in `.env`
2. Verify service account has spreadsheet access
3. Check Google Sheets API quota
4. Review sync logs in "Sync Logs" tab

#### OTP Not Sending

1. Verify SMS provider API key
2. Check SMS provider account balance
3. Verify mobile number format
4. Check rate limits
5. Review SMS provider dashboard

#### Database Connection Failed

1. Verify connection string
2. Check database server status
3. Verify network connectivity
4. Check firewall rules

#### Build Errors

1. Clear node_modules:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Clear build cache:
```bash
npm run clean
```

3. Check Node.js version:
```bash
node --version  # Should be 18+
```

## Maintenance

### Regular Tasks

- Weekly: Review logs and errors
- Monthly: Update dependencies
- Monthly: Review and rotate secrets
- Quarterly: Review and optimize database
- Quarterly: Review backup strategy

### Dependency Updates

```bash
npm audit
npm audit fix
npm update
```

### Database Maintenance

- Index optimization
- Query performance review
- Data cleanup (old logs, etc.)

## Support

For deployment support:
- Email: bldiagnosticcentre@gmail.com
- Phone: +91 9649183422
- Address: Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033
