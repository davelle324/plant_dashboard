# Deployment Checklist

Follow this checklist as you work through the deployment to free tier services. This corresponds to the detailed plan in `/home/davelle/.claude/plans/temporal-wibbling-kernighan.md`.

## Prerequisites

- [ ] All local changes committed to `deploy` branch (or committed to main and merged)
- [ ] You have GitHub account (for OAuth with other platforms)
- [ ] You have verified the app works locally: `./run-docker.sh` and tested features

---

## Phase 1: External Service Setup (No Code Changes)

### Neon PostgreSQL
- [ ] Go to **neon.tech** and sign up
- [ ] Create new project (default PostgreSQL)
- [ ] Copy connection string: `postgresql://user:password@host/plants`
- [ ] Save in a safe place (you'll paste this into Render in Phase 2)

### Cloudflare R2
- [ ] Go to **cloudflare.com** and sign up
- [ ] Navigate to **R2** → Create bucket named `plants-photos`
- [ ] Create **API token**:
  - [ ] Copy: `Access Key ID`
  - [ ] Copy: `Secret Access Key`
  - [ ] Copy: `Account ID`
  - [ ] Endpoint URL: `https://<account-id>.r2.cloudflarestorage.com`
- [ ] Save all credentials

### Sentry (Already Configured Locally)
- [ ] Go to **sentry.io** dashboard (you should have accounts already)
- [ ] Find your two projects: `plants-api` and `plants-web`
- [ ] From `plants-api` project:
  - [ ] Copy `SENTRY_DSN` (Settings → Projects → plants-api → Client Keys)
- [ ] From `plants-web` project:
  - [ ] Copy `NEXT_PUBLIC_SENTRY_DSN` (Settings → Projects → plants-web → Client Keys)
  - [ ] Also note `SENTRY_DSN` if different project for server-side
- [ ] Create **Auth Token** (if not already done):
  - [ ] Go to Settings → Auth Tokens
  - [ ] Copy `SENTRY_AUTH_TOKEN`
- [ ] Note your org slug (visible in Sentry URL)
- [ ] Save: `SENTRY_ORG`, `SENTRY_PROJECT=plants-web`

### Clerk (Already Configured Locally)
- [ ] Go to **dashboard.clerk.com** (you should have an app already)
- [ ] Copy from API Keys:
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `CLERK_SECRET_KEY`
- [ ] Save these

---

## Phase 2: Backend Deployment (Render)

### Create Render Account & Service
- [ ] Go to **render.com** and sign up (GitHub OAuth recommended)
- [ ] Create new **Web Service**:
  - [ ] Connect GitHub → select `plants` repo
  - [ ] Name: `plants-api`
  - [ ] Environment: Docker (auto-detected)
  - [ ] Region: pick closest to you
  - [ ] Pricing: **Free**

### Set Environment Variables on Render
Use the form in Render dashboard. Set each variable:

**Database:**
- [ ] `DATABASE_URL=postgresql://...` (from Neon, Phase 1)

**Storage:**
- [ ] `UPLOAD_DIR=/var/data/uploads`
- [ ] `S3_BUCKET=plants-photos`
- [ ] `S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com` (from Cloudflare, Phase 1)
- [ ] `S3_ACCESS_KEY_ID=<key>` (from Cloudflare, Phase 1)
- [ ] `S3_SECRET_ACCESS_KEY=<secret>` (from Cloudflare, Phase 1)

**Monitoring:**
- [ ] `SENTRY_DSN=https://xxxx@oXXXXX.ingest.sentry.io/YYYY` (from Sentry, Phase 1)

**CORS (Leave blank for now, will update in Phase 3):**
- [ ] `CORS_ORIGINS=` (you'll set this after deploying Vercel)

**Optional (leave blank):**
- [ ] `INTERNAL_API_SECRET=`
- [ ] `OLLAMA_URL=`

### Deploy
- [ ] Click "Deploy" on Render
- [ ] Wait ~2-3 min for build to complete
- [ ] Check logs for any errors
- [ ] Copy the **API URL** when ready (e.g., `https://plants-api.onrender.com`)
- [ ] Test health endpoint: `curl https://plants-api.onrender.com/health`
  - [ ] Should return: `{"status":"ok"}`

---

## Phase 3: Frontend Deployment (Vercel)

### Create Vercel Account & Project
- [ ] Go to **vercel.com** and sign up (GitHub OAuth recommended)
- [ ] "Add New" → "Project" → Import `plants` repo
- [ ] Configure:
  - [ ] Framework: Next.js (auto-detected)
  - [ ] Root directory: `apps/web`

### Set Environment Variables on Vercel
Use the form in Vercel dashboard. Set each variable:

**API URLs:**
- [ ] `API_INTERNAL_URL=https://plants-api.onrender.com` (from Render, Phase 2)
- [ ] `NEXT_PUBLIC_API_URL=https://plants-api.onrender.com` (same)

**Auth:**
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...` (from Clerk, Phase 1)
- [ ] `CLERK_SECRET_KEY=sk_live_...` (from Clerk, Phase 1)

**Monitoring:**
- [ ] `NEXT_PUBLIC_SENTRY_DSN=https://xxxx@oXXXXX.ingest.sentry.io/YYYY` (from Sentry, Phase 1 — web client)
- [ ] `SENTRY_DSN=https://xxxx@oXXXXX.ingest.sentry.io/YYYY` (from Sentry, Phase 1 — web server)
- [ ] `SENTRY_AUTH_TOKEN=sntrys_...` (from Sentry, Phase 1)
- [ ] `SENTRY_ORG=your-org-slug` (from Sentry, Phase 1)
- [ ] `SENTRY_PROJECT=plants-web` (from Sentry, Phase 1)

### Deploy
- [ ] Click "Deploy" on Vercel
- [ ] Wait ~1-2 min for build to complete
- [ ] Check build logs for errors
- [ ] Copy the **frontend URL** when ready (e.g., `https://plants.vercel.app`)
- [ ] Visit the URL in your browser
  - [ ] Should load (might be slow on first request)

---

## Phase 4: Final Configuration

### Update CORS on Render
- [ ] Go back to Render dashboard → `plants-api` service
- [ ] Settings → Environment
- [ ] Edit `CORS_ORIGINS=https://plants.vercel.app` (your Vercel URL from Phase 3)
- [ ] Save and **Redeploy** the API service
- [ ] Wait ~1 min for redeploy

---

## Phase 5: Verification

### Frontend Checks
- [ ] Visit `https://plants.vercel.app`
- [ ] Homepage loads without errors
- [ ] Navigation links work (dashboard, analytics, people, settings)
- [ ] Can navigate to settings → startup banner visible in browser console

### Backend Checks
- [ ] Health endpoint returns 200: `curl https://plants-api.onrender.com/health`
- [ ] Check Render logs for startup banner:
  - [ ] `Sentry : connected (https://...)`
  - [ ] `Storage : S3 — bucket=plants-photos endpoint=https://...`

### Feature Checks (MVP Testing)
- [ ] **Create a plant**:
  - [ ] Click "Open dashboard" or go to `/dashboard`
  - [ ] Click "Add Plant"
  - [ ] Fill form and submit
  - [ ] Plant appears in grid
- [ ] **Upload a photo**:
  - [ ] Click on a plant
  - [ ] Scroll to "Photos" section
  - [ ] Upload an image
  - [ ] Photo appears in gallery
  - [ ] Verify file appears in Cloudflare R2 bucket (R2 dashboard)
- [ ] **Edit photo caption**:
  - [ ] Click on photo in gallery
  - [ ] Edit caption inline
  - [ ] Press Enter to save
  - [ ] Refresh page; caption persists
- [ ] **Log care**:
  - [ ] In plant detail, log a watering
  - [ ] Log appears in care history
- [ ] **Reminders work**:
  - [ ] Homepage "Needs attention" shows overdue plants
- [ ] **Dashboard works**:
  - [ ] All plants grid, search, filter by health
  - [ ] All photos gallery, pagination
  - [ ] Health score chart renders
- [ ] **Settings**:
  - [ ] Visit `/settings`
  - [ ] Live API status shows green checkmark
  - [ ] Can toggle dark mode

### Cold Start Test (Render Only)
- [ ] Wait 15+ minutes without activity
- [ ] Reload the app
- [ ] First request is slow (~30s) as API wakes up
- [ ] Subsequent requests are fast
- [ ] This is expected behavior; can be improved later with paid tier

---

## Troubleshooting

### Frontend shows 404 or can't reach API
- [ ] Check `API_INTERNAL_URL` and `NEXT_PUBLIC_API_URL` on Vercel
  - Should match Render API URL exactly
- [ ] Check CORS on Render API
  - Should be set to your Vercel URL
- [ ] Wait 1 min for Render redeploy to finish

### Photos don't appear / upload fails
- [ ] Check S3 env vars on Render (Account ID, Keys, Endpoint)
- [ ] Verify R2 bucket exists and has correct name
- [ ] Check Render logs for S3 errors: `Render → plants-api → Logs`

### Sentry not receiving events
- [ ] Verify `SENTRY_DSN` is correct on both Render and Vercel
- [ ] Check Sentry dashboard for incoming events
- [ ] Verify org/project slugs in Vercel env vars

### Clerk not working
- [ ] Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` on Vercel
- [ ] Check that keys are from your Clerk dashboard (not expired)
- [ ] Look at browser console for Clerk errors

---

## Done!

- [ ] All checklist items complete
- [ ] MVP features verified working
- [ ] Startup banners show services are connected
- [ ] App is live on `https://plants.vercel.app`

**Next steps:** See `handoff.md` → "Potential Next Steps" for future enhancements (email reminders, scaling, etc.)

