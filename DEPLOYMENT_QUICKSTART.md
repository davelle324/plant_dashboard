# Deployment Quick Start

**Goal:** Deploy the Plants app to free tier services in ~30 minutes.

**Cost:** $0 permanently (all free tiers)

**Result:** Live app at `https://plants.vercel.app`

---

## Overview

This is a **free tier deployment** to:
- **Frontend:** Vercel (Next.js native, no cold starts)
- **Backend:** Render (free Web Service, sleeps after 15 min inactivity)
- **Database:** Neon (free PostgreSQL, 5 GB)
- **Photos:** Cloudflare R2 (free S3-compatible, 10 GB, zero egress)
- **Auth:** Clerk (already configured, 5k MAU free)
- **Errors:** Sentry (already configured, 5k events/month free)
- **AI:** Disabled on production (test locally via `./run-docker.sh`)

---

## Three Files to Use

1. **DEPLOYMENT_CHECKLIST.md** — Step-by-step checklist to follow
2. **scripts/deploy-setup.sh** — Collects your credentials (run once)
3. **scripts/deploy-verify.sh** — Tests the deployment after you're done

---

## Quick Timeline

| Step | Time | What You Do |
|------|------|-----------|
| 1. Setup | 10 min | Run `scripts/deploy-setup.sh` and collect credentials |
| 2. Create accounts | 5 min | Neon, Cloudflare, Render, Vercel (if not already done) |
| 3. Deploy backend | 5 min | Paste env vars in Render and deploy |
| 4. Deploy frontend | 5 min | Paste env vars in Vercel and deploy |
| 5. Verify | 5 min | Run `scripts/deploy-verify.sh` and test features |

**Total: ~30 minutes**

---

## Getting Started

### Step 1: Run the Setup Script

This script prompts you for all credentials and creates a config file to paste into each platform.

```bash
chmod +x ./scripts/deploy-setup.sh
./scripts/deploy-setup.sh
```

You'll be asked for:
- Neon PostgreSQL connection string
- Cloudflare R2 credentials (Account ID, Keys)
- Sentry DSNs and auth token
- Clerk keys

It creates: `plants-deployment-config.md` (copy/paste template for each platform)

### Step 2: Follow the Checklist

Open and work through: **DEPLOYMENT_CHECKLIST.md**

Each checkbox corresponds to a specific action on Neon, Cloudflare, Render, or Vercel.

Key sections:
- Phase 1: External service setup (create accounts, copy credentials)
- Phase 2: Deploy backend on Render
- Phase 3: Deploy frontend on Vercel
- Phase 4: Update CORS
- Phase 5: Verify everything works

### Step 3: Verify Deployment

After Render and Vercel finish deploying, run:

```bash
chmod +x ./scripts/deploy-verify.sh
./scripts/deploy-verify.sh
```

This checks:
- API health endpoint responds
- Frontend loads
- Suggests manual tests to verify features work

---

## Key Decisions You Made

✅ **Backend:** Render free tier (cold starts after 15 min OK for testing)
✅ **Database:** Neon free PostgreSQL (5 GB)
✅ **Photos:** Cloudflare R2 (free, zero egress)
✅ **Auth:** Clerk (already configured locally)
✅ **Errors:** Sentry (already configured locally)
✅ **AI:** Disabled on production (test locally with `./run-docker.sh`)

---

## Important Notes

### Render Cold Starts (Expected Behavior)
After 15 minutes of inactivity, Render free tier puts the API to sleep. The next request wakes it up and takes ~30s. This is **normal and acceptable for MVP testing**.

```
First request after sleep: ~30s
Subsequent requests: normal speed
```

### Startup Banners (New Feature)
Both the API and frontend print startup banners showing service status:

```
  ┌─ Plant Care API ───────────────────────────────────────────┐
  │  Sentry  : connected (https://...)
  │  Storage : S3 — bucket=plants-photos endpoint=https://...
  └────────────────────────────────────────────────────────────┘
```

Check these in Render logs to confirm services are properly connected.

### Environment Variables
All env vars are set through each platform's UI (Render dashboard, Vercel dashboard). No `.env` files needed for production.

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| API returns 404 | Check `API_INTERNAL_URL` on Vercel, check CORS on Render |
| Photos don't upload | Verify R2 bucket name and credentials in Render |
| Sentry not tracking errors | Verify `SENTRY_DSN` values on both platforms |
| App won't sign in (Clerk) | Verify Clerk keys on Vercel, check Clerk dashboard |
| Slow first request | This is the 30s cold start (Render waking up) — expected |

See **DEPLOYMENT_CHECKLIST.md** → "Troubleshooting" for detailed help.

---

## Next Steps After Deployment

### Now (Verify it works)
1. Follow DEPLOYMENT_CHECKLIST.md
2. Run scripts/deploy-verify.sh
3. Create a plant, upload photos, test reminders

### Later (Enhancements)
- **Email reminders:** Use Resend or SendGrid for daily digests
- **Vision AI:** Upgrade Ollama model (moondream, llava) for photo analysis
- **Custom domain:** Route your domain to Vercel (DNS CNAME)
- **Uptime monitoring:** Add Uptime Robot or similar (free tier)

See `handoff.md` → "Potential Next Steps" for full roadmap.

---

## Files Reference

| File | Purpose |
|------|---------|
| **DEPLOYMENT_CHECKLIST.md** | Step-by-step checklist to follow |
| **DEPLOYMENT_QUICKSTART.md** | This file; overview and timeline |
| **scripts/deploy-setup.sh** | Collect credentials (run once) |
| **scripts/deploy-verify.sh** | Test deployment after deploy |
| **plants-deployment-config.md** | Config template (generated by setup script) |
| **handoff.md** | Full technical details and architecture |
| **README.md** | Project overview and local dev |

---

## Support

If you get stuck:

1. **Check the logs:**
   - Render: Dashboard → plants-api → Logs
   - Vercel: Dashboard → plants → Deployments → Logs
   - Browser console: Right-click → Inspect → Console tab

2. **Check startup banners:**
   - Render logs should show service status on boot
   - Browser console should show Sentry/Clerk status

3. **Run the verify script:**
   - `./scripts/deploy-verify.sh` checks basic connectivity

4. **Reference DEPLOYMENT_CHECKLIST.md:**
   - Troubleshooting section has specific fixes for common issues

---

## Done!

Once you complete the checklist and verification, your app is live:

🎉 **https://plants.vercel.app**

Enjoy your deployed Plants app!

