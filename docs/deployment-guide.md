# LandConnect — Deployment Guide

This guide details how to deploy both the **Backend API** and the **Mobile Client** to production environments.

---

## 1. Backend Deployment (Render / Railway)

The backend is built with FastAPI and WebSockets. Platforms like **Render** or **Railway** offer free/low-cost hosting with native WebSocket support.

### Option A: Deploy to Render (Recommended)

1. Sign up at [render.com](https://render.com).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repository: `https://github.com/Vijay-punyamurthy/Mobile_App_Application`.
4. Configure the service:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python seed.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables:
   - `SECRET_KEY`: `your-random-production-secret-key-at-least-32-chars`
   - `DATABASE_URL`: `sqlite+aiosqlite:///./landconnect.db` (or attach a Render PostgreSQL database)
6. Click **"Create Web Service"**.
7. Render will provide a live URL (e.g. `https://landconnect-api.onrender.com`).

---

### Option B: Deploy to Railway

1. Sign up at [railway.app](https://railway.app).
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select `Vijay-punyamurthy/Mobile_App_Application`.
4. In Project Settings, set **Root Directory** to `/backend`.
5. Railway will automatically detect the `Dockerfile` or `requirements.txt` and deploy with a public domain.

---

## 2. Mobile Web Deployment (Vercel / Netlify)

You can host the web version of the mobile app live on **Vercel** or **Netlify** for evaluators to test on desktop or mobile browsers.

### Deploying to Vercel

1. Build the production web bundle:
   ```bash
   cd mobile
   npx expo export --platform web
   ```
   *(This outputs the static site to `mobile/dist`)*

2. Deploy using Vercel CLI:
   ```bash
   npm install -g vercel
   vercel mobile/dist --prod
   ```

3. Alternatively, connect the repo on [vercel.com](https://vercel.com):
   - **Root Directory**: `mobile`
   - **Framework Preset**: Other / None
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `EXPO_PUBLIC_API_URL`: Your deployed backend URL (e.g. `https://landconnect-api.onrender.com/api`)
     - `EXPO_PUBLIC_WS_URL`: Your deployed backend WebSocket URL (e.g. `wss://landconnect-api.onrender.com/ws`)

---

## 3. Generating an Installable Android APK (Expo EAS Build)

To generate an installable `.apk` file for Android devices:

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in with your free Expo account (create one at [expo.dev](https://expo.dev) if needed):
   ```bash
   eas login
   ```

3. Configure EAS Build:
   ```bash
   cd mobile
   eas build:configure
   ```

4. Build the standalone APK:
   ```bash
   eas build -p android --profile preview
   ```

5. EAS will build the APK in the cloud and provide a download link (QR code and `.apk` file) that anyone can install directly on an Android device!
