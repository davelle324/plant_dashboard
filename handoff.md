# Handoff

## Current State

Full-stack plant care SaaS. Frontend is Next.js 14 App Router; backend is FastAPI + SQLAlchemy. Both run in Docker or locally via shell scripts.

### Authentication
- Clerk auth when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set; otherwise no-auth local mode (`dev-user`).
- Proxy at `app/api/[...path]/route.ts` injects `x-clerk-user-id` and forwards to FastAPI.
- Backend auto-creates a user row on first request.
- `INTERNAL_API_SECRET` shared secret: when set, FastAPI rejects requests missing it (timing-safe compare). Next.js proxy forwards it as `x-internal-secret`.
- Account/logout: `NavAccount` component appears in every page nav. Clerk mode shows Clerk's `UserButton` (avatar + dropdown with logout). No-auth mode shows a "Dev mode" badge.

### Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage — live stats, "Needs attention" panel with quick-water buttons, "Following" feed, feature highlights, "At a glance" plant list. "Find people" link + dark mode toggle in hero. |
| `/people` | Discover other users — handle search, follow/unfollow, links to profiles. |
| `/profile/[userId]` | Public profile — counts, Follow button, photo gallery. |
| `/dashboard` | All plants with search/filter, health-status tabs, health donut chart, reminder queue, add-plant form, bulk actions, pagination, all-photos gallery. |
| `/analytics` | Care events per week, care type breakdown, watering consistency trend chart, per-plant stats table. |
| `/plant/[id]` | Plant detail — health score (0–100), edit form, care history with datetime picker, 12-week care chart, photo gallery with click-to-edit captions, AI chat. |
| `/settings` | Account info + live API status, plant defaults (localStorage), display timezone, AI config, notifications placeholder. |

### Backend endpoints
- `GET/POST/PUT/DELETE /plants` — plant CRUD; `GET /plants` includes `latest_photo` per plant (no N+1)
- `GET /plants/{id}/logs`, `POST /logs`, `PUT/DELETE /logs/{id}` — log CRUD; create/update accept optional `created_at` for backdated entries
- `GET /reminders` — overdue plants only; `GET /reminders?all=true` — all plants
- `GET /analytics` — includes `watering_intervals: [{date, days}]` per plant
- `GET /plants/{id}/photos` — photos for a single plant (`PhotoRead` with `caption`)
- `POST /plants/{id}/photos` — multipart upload (`file` only; captions added post-upload)
- `PATCH /photos/{id}` — updates `caption` (max 500 chars, or null to clear); rate-limited 20/min
- `DELETE /photos/{id}` — deletes from storage + DB
- `GET /photos` — all photos across all user's plants, newest first, with `plant_name`
- `POST /ai/ask` — Ollama with plant + care history context; 503 if unreachable; rate-limited 10/min
- `GET /users`, `GET /users/{id}`, `GET /users/{id}/gallery`, `POST/DELETE /users/{id}/follow`, `GET /feed` — social/following
- `GET /health` — `{"status":"ok"}`

### Photo caption flow
Upload is immediate (no caption prompt). After upload, click any photo card to enter edit mode — type caption, press Enter or Save; Escape to cancel. Captions shown as hover overlay in galleries. `PATCH /photos/{id}` persists the change.

### Key frontend files
| File | Notes |
|------|-------|
| `lib/health.ts` | `computeHealthScore(due_in_days, interval)` → 0–100; `healthColor(score)` → Tailwind class |
| `lib/theme.tsx` | `ThemeProvider` + `useTheme()` — reads/writes localStorage `"theme"`, toggles `dark` on `<html>` |
| `components/theme-toggle.tsx` | Sun/moon button; used in hero, dashboard, analytics, plant detail navs |
| `components/plant-grid.tsx` | Search input, health-tab filter, health score badges, checkboxes, bulk-action bar, "Load more" |
| `components/dashboard-gallery.tsx` | Responsive photo grid; always-visible plant name; caption on hover; links to `/plant/[id]` |
| `components/photo-gallery.tsx` | Upload triggers immediate file selection. `PhotoCard`: hover shows caption or "Add caption…"; click to edit inline (Enter/Escape). Calls `PATCH /photos/{id}`. |
| `components/nav-account.tsx` | Account button shown in every page nav. Clerk mode: `UserButton` (avatar + dropdown with logout) when signed in, "Sign in" modal button when signed out. No-auth mode: "Dev mode" badge. |
| `components/follow-button.tsx` | Optimistic follow/unfollow with toast + `router.refresh()` |
| `components/care-chart.tsx` | 12-week stacked bar (watering/fertilizing/pruning/notes) via Recharts |
| `components/health-chart.tsx` | Donut — healthy vs overdue plant count |
| `components/analytics-charts.tsx` | `ActivityChart`, `TypeBreakdownChart`, `WateringTrendsChart` |
| `components/quick-water-button.tsx` | Homepage — logs a watering immediately |
| `components/api-status.tsx` | Settings — pings `/api/health`, shows green/red dot |
| `lib/api.ts` | All API client functions incl. `getFeed`, `discoverUsers`, `getUserProfile`, `getUserGallery`, `followUser`, `unfollowUser`, `updatePhotoCaption` |

### Dark mode
Tailwind `darkMode: "class"`. `ThemeProvider` initialises from localStorage (falls back to OS preference), toggles `dark` on `<html>`. `suppressHydrationWarning` on `<html>` suppresses the SSR mismatch. Dark background set in `globals.css` under `.dark body`.

### Health score
`clamp(50 + (due_in_days / interval) × 50, 0, 100)`. Score 100 = freshly watered, 50 = due today, 0 = overdue by a full interval.

---

## Social / Multi-User Features

**Visibility model: public-by-default.** Any authenticated user can view any other user's profile and photo gallery. Feed shows photos from followed users only. No private/visibility toggle yet.

### DB table (`follows`)
```sql
follows (id PK, follower_id FK→users.id, following_id FK→users.id, created_at)
-- UniqueConstraint(follower_id, following_id) named uq_follow_pair
```
Added via Alembic migration `dfd45601f9e6_add_follows_table`. Uses integer FKs to `users.id` (not Clerk string IDs).

### Social endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Discover (excludes self). `?q=` filters by handle. Returns `PublicUserRead` with counts + `is_following`/`is_self`. |
| GET | `/users/{id}` | Public profile |
| GET | `/users/{id}/gallery` | Public photo gallery |
| POST | `/users/{id}/follow` | Follow (idempotent; 400 on self-follow, 404 if missing) |
| DELETE | `/users/{id}/follow` | Unfollow (idempotent) |
| GET | `/feed` | Photos from followed users, newest first, with owner info (`FeedItem`) |

**Handles:** `display_name` derived from email local-part; no username column yet. `PublicUserRead` omits email.

### Social next steps
- **Feed caching** — `/feed` is the heaviest query (cross-user join). Add Redis cache per-user (30–60s TTL) before scale.
- **Real usernames** — add a `display_name`/`username` column; needed for nicer handles + non-email search.
- **Visibility controls** — per-plant or per-photo `is_public` flag if private photos are needed.

---

## Pre-Deployment Checklist

### Done
- [x] Auth trust boundary (`INTERNAL_API_SECRET` shared secret, `secrets.compare_digest`)
- [x] CORS lockdown (`CORS_ORIGINS` env var, defaults to localhost)
- [x] File upload hardening (magic-byte validation, 5 MB cap, uuid4 filenames)
- [x] S3/R2 photo storage (`app/storage.py` — pluggable local/S3 backend; set `S3_BUCKET` + creds in production; recommended: Cloudflare R2, 10 GB free, zero egress)
- [x] Rate limiting (`slowapi`: 10/min AI, 20/min photo upload)
- [x] Input length validation (all user-supplied string fields capped)
- [x] Dependency audit (`pip-audit` clean; Next.js bumped to 14.2.35)
- [x] Alembic migrations (initial schema + follows table; Docker runs `alembic upgrade head` on boot)
- [x] **Sentry** — error tracking configured for FastAPI + Next.js; startup banners show status (disabled/connected)

### Still needed
- [x] **Secrets audit** — git history contains only `.env.example` files; no real credentials committed. Verified with `git log --all --full-history -- "*.env*"` and `git log -S "SECRET_KEY|CLERK_SECRET|..."`.
- [ ] **Health check on deploy target** — configure Render/Fly to use `/health`.
- [ ] **Next.js 16 upgrade** — two `npm audit` advisories fixed only in Next 16 (breaking upgrade, low current exposure; track as separate effort).

---

## Architecture Notes

- **Environment variables:** `load_dotenv()` in `app/main.py` loads `apps/api/.env` on startup. `run-local.sh` also sources it so S3/Sentry vars reach the subprocess. Next.js reads `apps/web/.env.local` automatically. See `.env.example` for all variables.
- `DATABASE_URL` supports Postgres (`postgresql+psycopg://...`) and SQLite (`sqlite:///./plants.db`)
- `API_INTERNAL_URL`: `http://localhost:8000` locally; `http://api:8000` in Docker
- **Photo storage** (`app/storage.py`): local disk by default (StaticFiles mount); switches to S3 when `S3_BUCKET` is set (redirect route to presigned/CDN URL). Key format `{plant_id}/{filename}` is identical across backends. Tests force `S3_BUCKET=""` to prevent live uploads.
- **Schema:** managed by Alembic (`alembic upgrade head` on deploy). `Base.metadata.create_all()` still runs in `lifespan()` as zero-config bootstrap for local SQLite and tests — it only creates missing tables, never alters.
- Ollama model auto-pulled on first Docker boot (`ollama_data` volume); `run-local.sh` also auto-pulls if installed.
- `x-clerk-user-id` header is trusted without cryptographic verification (mitigated by `INTERNAL_API_SECRET` in production).

---

## Running & Testing

See README.md for setup scripts, environment variables, and test commands. Brief reference:

**Start:**
```bash
./run-docker.sh    # Docker (recommended)
./run-local.sh     # Local: SQLite + native processes
```

**Test:** `cd apps/api && uv run pytest tests/ -v` (80 tests, 100% branch coverage enforced)

**Git:** `uv.lock`, `alembic/`, `alembic.ini` committed; `.venv/`, `uploads/`, `.env*` ignored.

---

## Deployment (Free Tier Stack)

The app is ready to deploy using entirely free services. See the deployment plan in `/home/davelle/.claude/plans/temporal-wibbling-kernighan.md` for detailed step-by-step instructions.

**Stack:**
- **Frontend**: Vercel (free tier, Next.js optimized, never sleeps)
- **Backend**: Render (free tier, Docker-based, 15-min inactivity cold starts)
- **Database**: Neon (free tier PostgreSQL-as-a-Service, 5 GB storage)
- **Photo storage**: Cloudflare R2 (free tier, 10 GB, zero egress fees)
- **Error tracking**: Sentry (already configured, 5k events/month free)
- **Auth**: Clerk (already configured, 5k MAU free)
- **Ollama/AI**: Disabled on production (test locally; API returns 503 if unavailable)

**Cost:** $0 permanently (all services have free tiers sufficient for MVP testing)

**Limitation:** Render free Web Service cold-starts after 15 min inactivity (~30s first request); subsequent requests normal speed. Acceptable for testing.

---

## CI

GitHub Actions workflow at `.github/workflows/api-tests.yml` runs automatically on every push or PR that touches `apps/api/**`. It runs `uv run pytest -v` (100% coverage gate) and `uv run pylint app tests --score=yes` (must be 10.00/10.0). Only triggers when API files change — frontend-only pushes are ignored.

---

## Potential Next Steps (After MVP Testing)

### High value
- **Email reminders** — Daily/weekly digest via Resend or SendGrid. Data exists at `GET /reminders`; needs a cron calling `POST /reminders/send`.
- **Scale beyond free tier** — When ready to go live: upgrade Render Web Service ($7/month), consider dedicated Ollama inference ($)

### Medium effort
- **Vision AI** — Swap `qwen2.5:0.5b` for `moondream` or `llava:7b`. Base64-encode latest photo and pass as `"images"` in the Ollama payload. Frontend unchanged.
- **RAG / embeddings** — Semantic search over plant history using `nomic-embed-text` + ChromaDB or FAISS.

### Polish
- **Mobile layout** — Done: all page nav headers stack on mobile (`flex-wrap`), hover-only interactions (photo delete, captions) are always visible on touch screens, bulk action bar uses full-width layout on small phones, AI chat code block wraps.
- **Background cron for reminders** — Celery + Redis or a simple cron endpoint for email/push.
- **PWA / offline** — Service worker + manifest for mobile install + cached data viewing.

---

## Session History

### 2026-07-01
- Built full pytest test suite from scratch: 80 tests, 100% branch coverage, 10.00/10.0 pylint score
- Added `pytest-cov` and `pylint` dev deps + full config to `pyproject.toml`
- Fixed critical test env bug: `.env` had `INTERNAL_API_SECRET` set, causing all tests to 401; cleared in `load_app()` test helper
- Added S3 mocked tests (`test_s3_storage_save_delete_and_presigned_url`) and non-SQLite DB branch test
- Added module/class/function docstrings throughout all source files; fixed `raise-missing-from` violations
- Added GitHub Actions CI workflow (`.github/workflows/api-tests.yml`) — triggers on `apps/api/**` changes
