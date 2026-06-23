# Handoff

## Current State

Full-stack plant care SaaS. Frontend is Next.js 14 App Router; backend is FastAPI + SQLAlchemy. Both run in Docker or locally via shell scripts.

### Authentication
- Clerk auth when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set; otherwise no-auth local mode (`dev-user`).
- Proxy at `app/api/[...path]/route.ts` injects `x-clerk-user-id` and forwards to FastAPI.
- Backend auto-creates a user row on first request.

### Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage — live stats, "Needs attention" panel with quick-water buttons, "Following" feed of followed users' photos, feature highlights, "At a glance" plant list with photo thumbnails. "Find people" link + dark mode toggle in hero. |
| `/people` | Discover other users — handle search, follow/unfollow, links to profiles. |
| `/profile/[userId]` | Public profile — counts, Follow button, photo gallery. |
| `/dashboard` | All plants with search/filter (name, species, location) and health-status tabs (All / Healthy / Due soon / Overdue). Health donut chart, reminder queue, add-plant form. Bulk actions (water / fertilize / delete selected plants), load-more pagination. Gallery section at the bottom showing every photo across all plants. Dark mode toggle in nav. |
| `/analytics` | Care events per week (bar chart), care type breakdown (donut), watering consistency trend chart (per-plant line chart), most-active / most-neglected highlights, per-plant stats table. Dark mode toggle in nav. |
| `/plant/[id]` | Plant detail — health score (0–100), edit form, care history with log form (datetime picker), 12-week care activity chart, photo gallery with optional captions, AI chat. Dark mode toggle in nav. |
| `/settings` | Account info + live API status, plant defaults (localStorage), display timezone (localStorage), AI config info, notifications placeholder. |

### Backend endpoints
- `GET/POST/PUT/DELETE /plants` — plant CRUD; `GET /plants` includes `latest_photo` per plant (single grouped subquery, no N+1)
- `GET /plants/{id}/logs`, `POST /logs`, `PUT/DELETE /logs/{id}` — log CRUD; create/update accept optional `created_at` for backdated entries
- `GET /reminders` — overdue plants only (due_in_days ≤ 0)
- `GET /reminders?all=true` — all plants' reminder rows (overdue + healthy); powers the dashboard filter
- `GET /analytics` — includes `watering_intervals: [{date, days}]` per plant for the trends chart
- `GET /plants/{id}/photos` — photos for a single plant (returns `PhotoRead` with `caption`)
- `POST /plants/{id}/photos` — multipart upload; accepts optional `caption` form field alongside `file`
- `DELETE /photos/{id}` — deletes file from disk and database row
- `GET /photos` — all photos across all user's plants, newest first, joined with `plant_name` (returns `PhotoWithPlant`); powers the dashboard gallery
- `POST /ai/ask` — sends plant + care history context to Ollama; returns 503 with helpful message if `OLLAMA_URL` is unset/unreachable; rate-limited 10/min
- `GET /users`, `GET /users/{id}`, `GET /users/{id}/gallery`, `POST/DELETE /users/{id}/follow`, `GET /feed` — social/following (see "Social / Multi-User Features" section)
- `GET /health` — `{"status":"ok"}`

### Photo caption flow
Captions are optional (max 500 chars). They are:
- Entered via a text input next to the Upload button on the plant detail page
- Stored on the `photos` table (`caption VARCHAR(500)`)
- Returned in all photo API responses
- Shown as a hover overlay on photo cards in the per-plant gallery and the dashboard gallery
- Never shown on the small thumbnails in plant lists

The `caption` column is part of the Alembic initial migration (`3d8788ddbee6_initial_schema`) and the `Photo` model, so fresh databases get it automatically. (The previous startup `ALTER TABLE` hack has been removed in favour of Alembic.)

### Key frontend files
| File | Notes |
|------|-------|
| `lib/health.ts` | `computeHealthScore(due_in_days, interval)` → 0–100 int; `healthColor(score)` → Tailwind class string |
| `lib/theme.tsx` | `ThemeProvider` + `useTheme()` hook — reads/writes localStorage `"theme"`, toggles `dark` class on `<html>` |
| `components/theme-toggle.tsx` | Sun/moon button; used in homepage hero, dashboard nav, analytics nav, and plant detail nav |
| `components/plant-grid.tsx` | Client component — search input, health-tab filter, health score badges, per-card checkboxes, floating bulk-action bar, "Load more" pagination |
| `components/dashboard-gallery.tsx` | Client component — responsive 2/3/4 col grid of all photos; always-visible plant name strip; caption on hover; each card links to `/plant/[id]` |
| `components/plant-form.tsx` | Reads plant defaults from `localStorage` on mount when creating |
| `components/log-form.tsx` | `datetime-local` picker defaulting to now; sends `created_at` as UTC ISO string |
| `components/log-entry-card.tsx` | Client component; reads `preferredTimezone` from localStorage for display |
| `components/photo-gallery.tsx` | Optimistic local state for upload/delete; caption text input + hover caption overlay; calls `router.refresh()` after changes |
| `components/care-chart.tsx` | 12-week stacked bar (watering/fertilizing/pruning/notes) via Recharts |
| `components/health-chart.tsx` | Donut showing healthy vs overdue plant count |
| `components/analytics-charts.tsx` | `ActivityChart`, `TypeBreakdownChart`, `WateringTrendsChart` (per-plant line chart of days between waterings) |
| `components/quick-water-button.tsx` | Homepage — logs a watering immediately, flips to "Watered ✓" |
| `components/api-status.tsx` | Settings page — pings `/api/health` client-side, shows green/red dot |
| `components/settings-defaults.tsx` | Saves default location + watering interval to `localStorage` |
| `components/settings-timezone.tsx` | Saves preferred IANA timezone to `localStorage` |

### Dark mode
Tailwind `darkMode: "class"`. `ThemeProvider` (`lib/theme.tsx`) initialises from localStorage on mount (falls back to OS preference) and toggles the `dark` class on `<html>`. `suppressHydrationWarning` on `<html>` suppresses the SSR/client mismatch this causes. All pages and components carry `dark:` variants. The `body` dark background is set in `globals.css` under `.dark body`.

### Health score
`computeHealthScore(due_in_days, watering_interval_days)` in `lib/health.ts`:
- Score 100 = freshly watered (due_in_days = interval)
- Score 50 = due today (due_in_days = 0)
- Score 0 = overdue by a full interval
- Formula: `clamp(50 + (due_in_days / interval) × 50, 0, 100)`

## Social / Multi-User Features (✅ scaffolded)

**Visibility model: public-by-default.** Any authenticated user can view any other user's profile and photo gallery. The feed shows photos from followed users only. There is no private/visibility toggle yet — see "Next steps" if that's wanted.

### DB table (`follows`)
```sql
follows (id PK, follower_id FK→users.id, following_id FK→users.id, created_at)
-- UniqueConstraint(follower_id, following_id) named uq_follow_pair
```
**Note:** uses integer FKs to `users.id` (consistent with `Plant.user_id`), *not* Clerk string IDs as the original sketch suggested. Added via Alembic migration `dfd45601f9e6_add_follows_table` (chains off the initial schema).

### Backend endpoints (in `app/main.py`, "Social" section)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Discover users (excludes self). `?q=` filters by handle (email substring). Returns `PublicUserRead` with counts + `is_following`/`is_self`. |
| GET | `/users/{id}` | Public profile — plant/photo/follower/following counts + `is_following` |
| GET | `/users/{id}/gallery` | Public gallery (all that user's photos, `PhotoWithPlant`) |
| POST | `/users/{id}/follow` | Follow (idempotent; 400 on self-follow, 404 if user missing) |
| DELETE | `/users/{id}/follow` | Unfollow (idempotent) |
| GET | `/feed` | Photos from followed users, newest first, with owner info (`FeedItem`) |

**Handles:** users have no username column yet — `display_name` is derived from the email local-part (`other@example.com` → `other`), falling back to the Clerk ID. `PublicUserRead` deliberately omits email for privacy.

### Frontend
| Path | Notes |
|------|-------|
| `/people` | Discovery page — search form (`?q=`), user list, each row links to profile + has a Follow button |
| `/profile/[userId]` | Public profile — header with counts + Follow button (hidden when `is_self`), photo gallery grid |
| Homepage "Following" section | Photo grid from `/feed`; empty state links to `/people`. "Find people" link added to hero nav. |
| `components/follow-button.tsx` | Client component — optimistic follow/unfollow with toast + `router.refresh()` |
| `lib/api.ts` | `getFeed`, `discoverUsers`, `getUserProfile`, `getUserGallery`, `followUser`, `unfollowUser` |
| `lib/types.ts` | `PublicUser`, `FeedItem` |

### Tests
9 social tests in `tests/test_main.py` ("Social" section): auth required, discovery excludes self + search by handle, follow/unfollow flow + idempotency, self-follow guard, follow-missing-user 404, public gallery, feed shows followed users' photos, feed excludes own + unfollowed. Plus 4 storage tests in `tests/test_storage.py` (backend selection, local save/delete round-trip, S3 presigned/CDN URL). **Total suite: 64 tests, all passing.**

### Next steps for this feature
- **Photo storage** — ✅ Pluggable S3-compatible backend done (`app/storage.py`); just needs a production bucket + env (see checklist).
- **Feed caching** — `/feed` is the heaviest query (cross-user join). Add Redis cache per-user (30–60s TTL) before scale.
- **Real usernames** — add a `display_name`/`username` column instead of deriving from email; needed for nicer handles + non-email search.
- **Visibility controls** — if not all photos should be public, add a per-plant or per-photo `is_public` flag.

---

## Pre-Deployment Checklist

### Blockers (must fix before public deploy)

- [x] **Auth trust boundary** — Added `INTERNAL_API_SECRET` shared secret. When set, FastAPI rejects requests missing it (using `secrets.compare_digest`). Next.js proxy forwards the secret as `x-internal-secret`. Dev mode unchanged (no secret = allow through).
- [x] **CORS lockdown** — Already reads from `CORS_ORIGINS` env var; defaults to localhost. Documented in `.env.example`.
- [x] **File upload hardening** — `upload_photo` now validates magic-byte signatures (JPEG/PNG/GIF/WebP) instead of trusting the extension, enforces a size cap (`MAX_UPLOAD_BYTES`, default 5 MB, returns 413), and writes filenames as `uuid4` + validated extension. Chose in-Python signature sniffing over `python-magic` to avoid the `libmagic` system dependency.
- [x] **S3/R2 for photo storage** — Pluggable storage backend in `app/storage.py`. Local disk (default, zero-config) for dev/Docker/tests; S3-compatible (R2/B2/Supabase/AWS) in production by setting `S3_BUCKET` + creds. Object keys identical across backends. Photo URLs unchanged (`/uploads/{plant_id}/{filename}`) — S3 mode redirects to a presigned/CDN URL. **Still need to create the bucket + set env in production** (recommended: Cloudflare R2 — 10 GB free, zero egress).

### Security hardening (important, not blockers)

- [x] **Rate limiting** — `slowapi` added. `POST /ai/ask` limited to 10/min, `POST /plants/{id}/photos` to 20/min. Key is authenticated user ID (falls back to IP for unauthenticated requests).
- [x] **Input length validation** — Added `max_length` to all user-supplied string fields: `name`/`species`/`location` ≤ 100, `note` ≤ 2000, AI `question` ≤ 500.
- [x] **Dependency audit** — `pip-audit`: clean, no known vulnerabilities. `npm audit`: bumped Next.js 14.2.25 → 14.2.35 (latest 14.x patch, build verified). Two residual advisories remain that are only fixed in Next 16 (breaking) — see Next 16 upgrade task below. Exposure assessed as low for this app's architecture (App Router, no i18n, no WebSocket upgrades in middleware).
- [ ] **Secrets audit** — Confirm no `.env` files or keys are in git history.

### Observability

- [ ] **Error tracking** — Add Sentry to both FastAPI and Next.js (free tier). Wire up before first real users.
- [ ] **Structured logging** — Replace `print()` calls in FastAPI with `logging` module.

### Caching (performance)

- [ ] **Analytics endpoint** — Cache `GET /analytics` per-user, ~5 min TTL. Redis preferred; `cachetools` in-memory is acceptable for MVP.
- [ ] **Social feed** — Once built, `GET /feed` will be the most expensive query (cross-user join). Redis cache per-user, 30–60s TTL.
- [ ] **CDN for photos** — Put Cloudflare or CloudFront in front of photo storage. FastAPI should not serve binary files at scale.

### Infrastructure

- [ ] **Next.js 16 upgrade** — Two `npm audit` advisories (1 high SSRF via WebSocket upgrades, 1 moderate postcss XSS) are only fixed in Next 16. This is a two-major-version breaking upgrade (currently 14.2.35) requiring full regression testing of all pages + the API proxy. Track as its own effort. Low exposure in the meantime (App Router, no i18n, middleware is Clerk-auth only).
- [x] **Alembic migrations** — Alembic is set up in `apps/api/` (`alembic.ini`, `alembic/env.py`, `alembic/versions/`). `env.py` reads `DATABASE_URL` from the environment and targets `Base.metadata`, with `compare_type` + `render_as_batch` (SQLite-safe). Initial migration `3d8788ddbee6_initial_schema` captures the full current schema (users/plants/logs/photos incl. `caption`). The manual `ALTER TABLE photos ADD COLUMN caption` hack is removed from `lifespan()`. See "Database migrations (Alembic)" below for the workflow.
- [ ] **Health check wired** — `/health` exists; confirm Render/Fly health check is configured to use it.
- [ ] **HTTPS** — Handled by Vercel + Render automatically; confirm no HTTP-only cookies or mixed content.

### Recommended deploy order
1. Fix Clerk JWT verification (auth trust boundary)
2. CORS lockdown
3. File upload hardening + S3/R2
4. Rate limiting (`slowapi`)
5. `pip audit` + `npm audit` fixes
6. Sentry setup
7. Deploy (Vercel + Render + Neon)

---

## Known Issues

None currently.

## Running the App

```bash
./run-docker.sh    # Docker: Postgres + FastAPI + Next.js + Ollama
./run-local.sh     # Local: SQLite + native processes, Ollama optional
source activate_env.sh  # Activate Python venv (creates it via uv sync if missing)
```

Local prerequisites: `uv`, `node`, `npm`. Ollama optional (AI disabled gracefully if absent).

Switching between Docker and local: the local script wipes `.next` and `tmp` first (Docker writes them as root, causing EACCES on local runs). The Next.js distDir is `/tmp/plants-next` (system temp, not the repo `tmp/`). Clear it between Docker ↔ local switches if you see stale-page errors.

## Database migrations (Alembic)

Schema is versioned with Alembic, living in `apps/api/`. Run all commands from `apps/api/` with `DATABASE_URL` set (it defaults to the local SQLite file).

```bash
cd apps/api

# Apply all pending migrations (run on deploy / after pulling new migrations)
uv run alembic upgrade head

# After changing a model in app/models.py, autogenerate a migration:
uv run alembic revision --autogenerate -m "add follows table"
# → review the generated file in alembic/versions/ before committing

# Roll back the most recent migration
uv run alembic downgrade -1

# Show current DB revision
uv run alembic current
```

**Docker:** the API container runs `alembic upgrade head` before starting uvicorn (see `apps/api/Dockerfile` CMD). Safe to run on every boot — it's a no-op when the DB is already current.

**⚠️ One-time step for an existing database** (e.g. a dev Postgres volume created before Alembic, which already has the tables but no `alembic_version` table): stamp it as current so Alembic doesn't try to re-create existing tables.
```bash
cd apps/api && uv run alembic stamp head
```
Alternatively, wipe the dev volume: `docker compose down -v` (destroys local data). Fresh databases need neither — `alembic upgrade head` creates everything.

**Relationship to `create_all()`:** `lifespan()` in `app/main.py` still calls `Base.metadata.create_all()` as a zero-config bootstrap for local SQLite dev and the test suite. It only creates missing tables and never alters existing ones, so it doesn't conflict with Alembic. Alembic is the source of truth for production schema.

## Running Tests

```bash
# API (64 tests)
cd apps/api && uv run pytest tests/ -v

# E2E (requires full stack running)
cd apps/web && npm run test:e2e
cd apps/web && npm run test:e2e:ui   # interactive UI
```

## What's Committed vs Ignored

- `uv.lock` — committed (reproducible installs, like `package-lock.json`)
- `apps/api/alembic/`, `apps/api/alembic.ini` — committed (migration scripts are schema history; must travel with the code)
- `.venv/` — gitignored
- `uploads/` — gitignored (Docker uses a named volume)
- `*.db` — gitignored
- `.env` / `.env.local` / `.env.*.local` — gitignored; use `.env.example` as template

## Architecture Notes

- `DATABASE_URL` supports both Postgres (`postgresql+psycopg://...`) and SQLite (`sqlite:///./plants.db`)
- `API_INTERNAL_URL` must be `http://localhost:8000` locally; Docker compose sets it to `http://api:8000`
- Photo storage is abstracted in `app/storage.py` (`get_storage()` picks the backend from env). **Local backend** (default): files served by FastAPI `StaticFiles` at `/uploads`; in Docker a named volume (`uploads_data`). **S3 backend** (set `S3_BUCKET`): files in object storage, served via a `/uploads/{plant_id}/{filename}` route that redirects to a presigned/CDN URL. The upload/delete endpoints call `storage.save()`/`storage.delete()` with key `{plant_id}/{filename}` — backend-agnostic.
- Schema changes are managed by **Alembic** (see "Database migrations (Alembic)" section). `Base.metadata.create_all()` still runs in `lifespan()` as a zero-config bootstrap for local dev and the test suite; production applies migrations via `alembic upgrade head`
- Ollama model is auto-pulled on first Docker boot (stored in `ollama_data` volume); `run-local.sh` also auto-pulls if Ollama is installed
- Backend trust boundary: `x-clerk-user-id` header is trusted without cryptographic verification — acceptable for local dev, should be hardened before public deployment

## Potential Next Steps

Ordered roughly by impact / effort ratio:

### High value
- **Deployment** — Vercel (web) + Render or Fly.io (API) + Neon (Postgres). The app is MVP-complete; deployment turns it into a real product. Need to set real Clerk keys, `DATABASE_URL`, and `UPLOAD_DIR` (or swap to S3 for uploads).
- **Email reminders** — Daily/weekly digest of overdue plants via SendGrid or Resend. The reminder data already exists at `GET /reminders`; just needs a cron that calls it and sends emails. Could be a Vercel Cron job or a GitHub Action calling a `POST /reminders/send` endpoint.

### Medium effort, good differentiators
- **Vision AI** — Swap `qwen2.5:0.5b` for `moondream` (~1.7 GB) or `llava:7b` (~4 GB) in `docker-compose.yml` and `run-local.sh`. In `main.py` `/ai/ask`, read the plant's latest photo file, base64-encode it, and add it to the Ollama `generate` payload as `"images": [<base64>]`. Frontend doesn't change.
- **RAG / embeddings** — Semantic search over plant history using `nomic-embed-text` + ChromaDB or FAISS. Lets the AI answer questions like "has this plant ever had yellow leaves?"

### Smaller polish
- **Mobile layout** — Test and improve the grid/card layouts at phone widths. Some sections may need single-column stacking.
- **Search/filter on dashboard** — ✅ Done (text search + health-status tabs on the plant grid).
- **Plant health score** — ✅ Done (0–100 on plant cards and detail page).
- **Trends on analytics** — ✅ Done (watering consistency line chart).
- **Dark mode** — ✅ Done (Tailwind class mode, localStorage persistence).
- **Bulk actions** — ✅ Done (select + water / fertilize / delete from dashboard).
- **Pagination** — ✅ Done (load-more button on plant grid).
- **Gallery with captions** — ✅ Done (dashboard gallery + per-plant caption hover overlay).

### Larger / Phase 2
- **Background cron for reminders** — Currently reminders are computed on-demand. For email/push, a scheduled job (Celery + Redis, or a simple cron endpoint) is needed.
- **PWA / offline support** — Service worker + manifest so the app installs on mobile and works offline for viewing cached data.
