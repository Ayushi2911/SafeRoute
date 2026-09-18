# SafeRoute — Production Deployment Guide

This document provides complete, step-by-step instructions for deploying the **SafeRoute** Smart Public Safety & Emergency Assistance Platform to production environments (e.g., AWS, Render, Railway, Vercel, VPS, or cloud Kubernetes/Docker clusters).

---

## Architecture Overview

```
   ┌──────────────────────┐
   │   Frontend Client    │  (React 19 + Vite SPA)
   │  Vercel / Netlify /  │
   │  AWS S3 + CloudFront │
   └──────────┬───────────┘
              │ HTTPS API Requests (VITE_API_BASE_URL)
              ▼
   ┌──────────────────────┐
   │   Backend API Node   │  (Node.js + Express)
   │  Render / Railway /  │
   │  AWS ECS / VPS       │
   └──────┬────────┬──────┘
          │        │
          │        ▼
          │  ┌───────────────────────────┐
          │  │     External Services     │
          │  │  OSRM Routing Engine      │
          │  │  OpenStreetMap Map Tiles  │
          │  └───────────────────────────┘
          ▼
   ┌──────────────────────┐
   │    MySQL Database    │  (Amazon RDS / Aiven / Local)
   │  Port: 3306          │
   └──────────────────────┘
```

---

## 1. Database Configuration (MySQL)

SafeRoute utilizes a relational MySQL database containing verified incidents, emergency services directory, risk zones, and user records.

### Step 1.1: Provision Database
- Deploy a managed MySQL 8.0+ instance (e.g., AWS RDS, DigitalOcean Managed Database, PlanetScale, or Railway MySQL).
- Ensure network access allows inbound connections from your backend IP or VPC security group.

### Step 1.2: Import Schema and Seed Data
Execute the provided SQL migration file on your production database:
```bash
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < database/saferoute.sql
```

Verify tables created:
- `users`
- `incidents`
- `emergency_services`
- `risk_zones`
- `sos_requests`

---

## 2. Backend Deployment (Node.js & Express)

The backend server can be hosted on platforms such as **Render**, **Railway**, **Heroku**, **AWS App Runner**, or an **Ubuntu VPS / EC2**.

### Step 2.1: Required Backend Environment Variables
Set the following environment variables in your hosting provider's dashboard (refer to `server/.env.example`):

| Variable | Description | Example Value |
|---|---|---|
| `NODE_ENV` | Application environment mode | `production` |
| `PORT` | HTTP port for Express (set automatically by most PaaS) | `5000` or assigned port |
| `CLIENT_URL` | Allowed frontend origin for CORS | `https://saferoute.yourdomain.com` |
| `DB_HOST` | MySQL database host | `db.production.example.com` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_USER` | MySQL database username | `saferoute_admin` |
| `DB_PASSWORD` | MySQL database password | *(Strong Secret Password)* |
| `DB_NAME` | MySQL database name | `saferoute` |
| `JWT_SECRET` | Secret key for signing administrative sessions | *(High-entropy random 64-char string)* |
| `OSRM_BASE_URL` | Base URL for OSRM driving engine | `https://router.project-osrm.org` (or self-hosted) |

### Step 2.2: Build and Run Backend
On your hosting service or server:
```bash
cd server
npm install --omit=dev
node server.js
```
*Tip: Use `pm2` for process management and auto-restart on virtual machines:*
```bash
npm install -g pm2
pm2 start server.js --name "saferoute-api"
pm2 save
```

### Step 2.3: File Uploads Directory
The application accepts citizen incident photos uploaded via `multer` to `server/uploads/incidents`.
- For multi-instance deployments (e.g., AWS ECS, Heroku, ephemeral containers), ensure persistent volume storage is mounted to `server/uploads` or configure S3 storage.

---

## 3. Frontend Deployment (React + Vite)

The frontend is a static Single Page Application (SPA) that can be deployed on **Vercel**, **Netlify**, **Cloudflare Pages**, or **AWS S3 + CloudFront**.

### Step 3.1: Required Frontend Environment Variables
Set the following environment variable prior to building the client (refer to `client/.env.example`):

| Variable | Description | Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the deployed SafeRoute Backend (no trailing slash) | `https://api.saferoute.yourdomain.com` |

### Step 3.2: Build the Frontend
```bash
cd client
npm install
npm run build
```
This generates the optimized production bundle inside `client/dist/`.

### Step 3.3: Deploy Static Assets
- **Vercel / Netlify**: Connect your Git repository, set the Root Directory to `client`, Build Command to `npm run build`, and Output Directory to `dist`. Add `VITE_API_BASE_URL` to the project's Environment Variables.
- **SPA Fallback Routing**: Ensure the web server routes all non-asset requests to `index.html` (e.g. via `_redirects` or `vercel.json` rewrites):
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

---

## 4. Connecting Frontend to Backend & CORS

1. In the **Frontend** deployment settings, set `VITE_API_BASE_URL` to your backend domain:
   ```env
   VITE_API_BASE_URL=https://api.saferoute.yourdomain.com
   ```
2. In the **Backend** deployment settings, set `CLIENT_URL` to your frontend domain:
   ```env
   CLIENT_URL=https://saferoute.yourdomain.com
   ```
   *(Multiple domains can be configured as a comma-separated list, e.g. `https://saferoute.yourdomain.com,https://staging.saferoute.yourdomain.com`)*
3. The backend Express CORS middleware automatically validates inbound request origins against `CLIENT_URL` and permits authenticated requests with credentials.

---

## 5. External Service Dependencies

- **OpenStreetMap Tiles**: The Leaflet map component fetches map tiles from `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`. Ensure client browsers have outbound internet connectivity.
- **OSRM Driving Engine**: Route pathfinding utilizes the public OSRM API (`https://router.project-osrm.org`) by default. For high-volume enterprise traffic, deploy a dedicated private OSRM Docker container and set `OSRM_BASE_URL=http://<private-osrm-host>:5000` in the backend environment.

---

## 6. Security Audit & Production Checklist

1. **Development Route Notice (`/dev-token`)**:
   - `server/routes/adminRoutes.js` includes a development route `/api/admin/dev-token` utilized during development to generate test dispatcher session tokens.
   - For high-security enterprise environments, ensure `NODE_ENV=production` is set, and disable unauthenticated developer token generation once user authentication flow is finalized by the auth team member.
2. **Environment Variables**:
   - Verify that `.env` files are **never** committed to version control. Both root `.gitignore` and `client/.gitignore` are configured to prevent credential exposure.
3. **HTTPS / SSL**:
   - Always enforce HTTPS in production. Geolocation APIs in modern web browsers (`navigator.geolocation.getCurrentPosition`) require an HTTPS context.
4. **Database Credentials**:
   - Use a dedicated MySQL user with constrained permissions (`SELECT, INSERT, UPDATE, DELETE`) rather than the database `root` superuser.

---

## 7. Verification & Smoke Testing

Once deployed, verify the complete pipeline using the following steps:

1. **Backend Health Check**:
   ```bash
   curl -I https://api.saferoute.yourdomain.com/api/test
   # Expected: HTTP/1.1 200 OK
   ```
2. **Database Connectivity**:
   ```bash
   curl https://api.saferoute.yourdomain.com/api/test-db
   # Expected: {"message":"MySQL connection successful!","result":1}
   ```
3. **Map Risk Zones Endpoint**:
   ```bash
   curl https://api.saferoute.yourdomain.com/api/routes/risk-zones
   # Expected: {"success":true,"count":3,...}
   ```
4. **Frontend Verification**:
   - Open your deployed frontend URL `https://saferoute.yourdomain.com`.
   - Verify the Home page renders with the SafeRoute logo and navigation tabs.
   - Click **Safe Route & Maps**: verify risk zone circles and emergency services render on the Leaflet map.
   - Enter `Origin: bandra`, `Destination: dadar`, and click **Search & Calculate Route**: verify route polyline renders without Network Errors.
   - Navigate to **Report Incident**: verify category selection, location tagging, and form submission.
   - Navigate to **Admin & Analytics**: verify charts and data pods load successfully.
