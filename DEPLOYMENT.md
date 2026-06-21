# Revathi Store - Production Deployment Guide

This document outlines the step-by-step instructions required to deploy the Revathi Store Next.js application to a production Linux environment (e.g., Ubuntu 22.04 LTS) connected to a PostgreSQL database.

---

## 1. System Architecture Overview

```
                          ┌────────────────────────┐
                          │     Web Browser        │
                          └──────────┬─────────────┘
                                     │ (HTTPS / Port 443)
                                     ▼
                          ┌────────────────────────┐
                          │   Nginx Reverse Proxy  │
                          └──────────┬─────────────┘
                                     │ (HTTP / Port 3000)
                                     ▼
                          ┌────────────────────────┐
                          │ Next.js App Server     │
                          │   (Managed by PM2)     │
                          └──────────┬─────────────┘
                                     │ (Port 5432)
                                     ▼
                          ┌────────────────────────┐
                          │   PostgreSQL Database  │
                          └────────────────────────┘
```

---

## 2. Server Prerequisites

### 2.1 Install Node.js (LTS version v20.x or v22.x)
```bash
# Clean cache and install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2 Install PostgreSQL
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

### 2.3 Install Nginx & Certbot
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

---

## 3. Database Setup

### 3.1 Create Database and User
Log in to the PostgreSQL prompt:
```bash
sudo -i -u postgres psql
```

Run the following SQL commands to initialize the database and create a dedicated application user:
```sql
CREATE DATABASE revathi_store;
CREATE USER revathi_app WITH ENCRYPTED PASSWORD 'change_this_to_a_strong_password';
GRANT ALL PRIVILEGES ON DATABASE revathi_store TO revathi_app;
-- Exit psql
\q
```

### 3.2 Initialize Schema and Migrations
Clone/pull your repository code to the deployment folder (e.g., `/var/www/revathi-store`). From the project root directory:

1. Import the base database structure:
   ```bash
   psql -U revathi_app -d revathi_store -h localhost -f schema.sql
   ```
   *(Enter the password configured in step 3.1 when prompted).*

2. Run the migration script to apply necessary schema modifications, audits, and seed data:
   ```bash
   node db-migrate.js
   ```

---

## 4. Application Configuration

1. Copy the environment variables template:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and configure your production values:
   ```bash
   nano .env.local
   ```
   
   Ensure you adjust the following parameters:
   - `DB_USER` and `DB_PASSWORD` (configured in step 3.1)
   - `ADMIN_JWT_SECRET` (generate a strong hex string: `openssl rand -hex 32`)
   - `ADMIN_USER` and `ADMIN_PASS` for admin portal access
   - `NEXT_PUBLIC_BASE_URL` (your production domain name, e.g., `https://revathistore.com`)
   - SMS and WhatsApp credentials (Twilio, Infobip, Meta, or Fast2SMS)

---

## 5. Build and Process Management (PM2)

### 5.1 Build the Application
Install dependencies and build the Next.js production bundle:
```bash
npm install --omit=dev
npm run build
```

### 5.2 Configure PM2 for Automatic Restarts
PM2 is a production process manager that keeps your application running in the background and recovers it in case of crashes or system reboots.

1. Install PM2 globally:
   ```bash
   sudo npm install -g pm2
   ```

2. Start the Next.js server using PM2:
   ```bash
   pm2 start npm --name "revathi-store" -- run start
   ```

3. Save the PM2 list and configure it to automatically launch on system boot:
   ```bash
   pm2 save
   pm2 startup systemd
   ```
   *(Copy and paste the command output by `pm2 startup` to complete systemd registration).*

---

## 6. Nginx Web Server Configuration

1. Create an Nginx site configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/revathi-store
   ```

2. Paste the following configuration (replace `yourdomain.com` with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # Gzip Compression
       gzip on;
       gzip_proxied any;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
       gzip_vary on;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Secure upload assets folder
       location /uploads/ {
           alias /var/www/revathi-store/public/uploads/;
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```

3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/revathi-store /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default page if active
   sudo nginx -t                             # Verify syntax is correct
   sudo systemctl restart nginx
   ```

---

## 7. SSL Certificate Setup (HTTPS)

Secure the connection using Let's Encrypt certificates via Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
*Follow the on-screen prompts. Certbot will automatically configure SSL/TLS parameters in your Nginx config and set up auto-renewal cron jobs.*

---

## 8. Post-Deployment Checklist

- [ ] Check PM2 logs: `pm2 logs revathi-store` to verify no server exceptions.
- [ ] Confirm database connection works by loading products on the front page.
- [ ] Navigate to `/admin` and log in using the credentials defined in `.env.local`.
- [ ] Make a test purchase to verify the inventory adjustments and SMS/WhatsApp notifications.
- [ ] Verify that HTTP traffic automatically redirects to HTTPS.
