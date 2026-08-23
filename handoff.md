# Handoff

## Last Updated
2026-08-22

## Current State

Full-stack plant care SaaS. Frontend is Next.js 14 App Router; backend is FastAPI + SQLAlchemy. Both run in Docker or locally via shell scripts. The app is feature-complete at MVP level and deployed (Vercel + Render + Neon + R2). Homepage now shows a proper marketing landing page for signed-out visitors and a personalised app home for signed-in users. HEIC photo uploads from iPhone now work.

### Authentication
- Clerk auth when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set; otherwise no-auth local mode (`dev-user`).
- Proxy at `app/api/[...path]/route.ts` injects `x-clerk-user-id` and forwards to FastAPI.
- Backend auto-creates a user row on first request.
- `INTERNAL_API_SECRET` shared secret: when set, FastAPI rejects requests missing it (timing-safe compare). Next.js proxy forwards it as `x-internal-secret`.
- Account/logout: `NavAccount` component appears in every page nav. Clerk mode shows Clerk's `UserButton` (avatar + dropdown with logout). No-auth mode shows a "Dev mode" badge.

### Pages
| Route | Description |
|-------|-------------|
| `/` | **Auth-split homepage.** Signed-out: marketing landing page (hero, "How it works", feature cards, bottom CTA). Signed-in: app home (stats, overdue reminders, upcoming reminders, quick-care form, following feed, recent activity, at-a-glance plant list). |
| `/people` | Discover other users — handle search, follow/unfollow, links to profiles. |
| `/profile/[userId]` | Public profile — counts, Follow button, photo gallery. |
| `/dashboard` | All plants with search/filter, health-status tabs, health donut chart, reminder queue, add-plant form, bulk actions, pagination, all-photos gallery. |
| `/analytics` | Care events per week, care type breakdown, watering consistency trend chart, per-plant stats table. |
| `/plant/[id]` | Plant detail — health score (0–100), edit form, care history with datetime picker, 12-week care chart, photo gallery with click-to-edit captions, AI chat. |
| `/settings` | Account info + live API status, plant defaults (localStorage), display timezone, AI config, notifications placeholder. |

### Backend endpoints
- `GET/POST/PUT/DELETE /plants` — plant CRUD; `GET /plants` includes `latest_photo` per plant (no N+1)
- `GET /plants/{id}/logs`, `POST /logs`, `PUT/DELETE /logs/{id}` — log CRUD; create/update accept optional `created_at` for backdated entries
- `GET /logs?limit=N` — **new** — recent logs across all user's plants with `plant_name`, ordered newest first (max 100)
- `GET /reminders` — overdue plants only; `GET /reminders?all=true` — all plants with `due_in_days`
- `GET /analytics` — includes `watering_intervals: [{date, days}]` per plant
- `GET /plants/{id}/photos` — photos for a single plant (`PhotoRead` with `caption`)
- `POST /plants/{id}/photos` — multipart upload; accepts JPEG/PNG/WebP/GIF/HEIC/HEIF; HEIC auto-converted to JPEG server-side via `pillow-heif`
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
| `components/theme-toggle.tsx` | Sun/moon button; used in hero, dashboard, analytics, plant detail navs. Sized `px-5 py-3` to match other nav buttons. |
| `components/plant-grid.tsx` | Search input, health-tab filter, health score badges, checkboxes, bulk-action bar, "Load more" |
| `components/dashboard-gallery.tsx` | Responsive photo grid; always-visible plant name; caption on hover; links to `/plant/[id]` |
| `components/photo-gallery.tsx` | Upload accepts `image/*` (was JPEG/PNG/WebP/GIF only — caused iOS HEIC rejection). `PhotoCard`: hover shows caption or "Add caption…"; click to edit inline (Enter/Escape). Calls `PATCH /photos/{id}`. |
| `components/nav-account.tsx` | Account button shown in every page nav. Clerk mode: `UserButton` when signed in, "Sign in" modal button when signed out. No-auth mode: "Dev mode" badge. NOT shown on the signed-out landing page (would duplicate sign-in button). |
| `components/quick-care-form.tsx` | **New.** Client component on signed-in homepage. Plant picker dropdown + care-type buttons (Water/Fertilize/Prune/Note) + optional note + submit. Calls `POST /logs`, refreshes on success. |
| `components/follow-button.tsx` | Optimistic follow/unfollow with toast + `router.refresh()` |
| `components/care-chart.tsx` | 12-week stacked bar (watering/fertilizing/pruning/notes) via Recharts |
| `components/health-chart.tsx` | Donut — healthy vs overdue plant count |
| `components/analytics-charts.tsx` | `ActivityChart`, `TypeBreakdownChart`, `WateringTrendsChart` |
| `components/quick-water-button.tsx` | Homepage — logs a watering immediately |
| `components/api-status.tsx` | Settings — pings `/api/health`, shows green/red dot |
| `lib/api.ts` | All API client functions. Error handling now parses FastAPI JSON `{"detail":"..."}` to show clean messages. |
| `lib/server-api.ts` | Server-side fetch helpers. Added `getRecentLogs(userId, limit)` → `GET /logs?limit=N`. |
| `lib/types.ts` | Added `LogWithPlant = LogEntry & { plant_name: string }`. |

### Dark mode
Tailwind `darkMode: "class"`. `ThemeProvider` initialises from localStorage (falls back to OS preference), toggles `dark` on `<html>`. `suppressHydrationWarning` on `<html>` suppresses the SSR mismatch. Dark background set in `globals.css` under `.dark body`. Native `<select>` in dark mode requires `dark:[color-scheme:dark]` + opaque dark background (`dark:bg-zinc-800`) — otherwise option dropdown stays white.

### Health score
`clamp(50 + (due_in_days / interval) × 50, 0, 100)`. Score 100 = freshly watered, 50 = due today, 0 = overdue by a full interval.

---

## Social / Multi-User Features

**Visibility model: public-by-default.** Any authenticated user can view any other user's profile and photo gallery. Feed shows photos from followed users only. No private/visibility toggle yet. Image URLs (`/api/uploads/...`) are publicly accessible without auth (filenames are UUIDs — security through obscurity, accepted tradeoff).

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

---

## Pre-Deployment Checklist

### Done
- [x] Auth trust boundary (`INTERNAL_API_SECRET` shared secret, `secrets.compare_digest`)
- [x] CORS lockdown (`CORS_ORIGINS` env var, defaults to localhost)
- [x] File upload hardening (magic-byte validation, 5 MB cap, uuid4 filenames, HEIC conversion)
- [x] S3/R2 photo storage (`app/storage.py` — pluggable local/S3 backend)
- [x] Rate limiting (`slowapi`: 10/min AI, 20/min photo upload)
- [x] Input length validation (all user-supplied string fields capped)
- [x] Alembic migrations (initial schema + follows table; Docker runs `alembic upgrade head` on boot)
- [x] Sentry error tracking configured for FastAPI + Next.js

### Still needed
- [ ] **Secrets audit** — confirm no `.env` files or keys are in git history.
- [ ] **Health check on deploy target** — configure Render/Fly to use `/health`.
- [ ] **Next.js 16 upgrade** — two `npm audit` advisories fixed only in Next 16 (breaking upgrade, low current exposure).

---

## Architecture Notes

- **Environment variables:** `load_dotenv()` in `app/main.py` loads `apps/api/.env` on startup. Next.js reads `apps/web/.env.local` automatically.
- `DATABASE_URL` supports Postgres (`postgresql+psycopg://...`) and SQLite (`sqlite:///./plants.db`)
- `API_INTERNAL_URL`: `http://localhost:8000` locally; `http://api:8000` in Docker
- **Photo storage** (`app/storage.py`): local disk by default; switches to S3 when `S3_BUCKET` is set. Key format `{plant_id}/{filename}` identical across backends.
- **HEIC uploads:** `pillow-heif` registered as a Pillow opener at startup. HEIC/HEIF files converted to JPEG (quality 90) before storage — browser never sees HEIC.
- **Schema:** managed by Alembic. `Base.metadata.create_all()` runs in `lifespan()` as zero-config bootstrap for local SQLite only.
- `x-clerk-user-id` header trusted without cryptographic verification (mitigated by `INTERNAL_API_SECRET` in production).

---

## Running & Testing

```bash
./run-docker.sh    # Docker (recommended)
./run-local.sh     # Local: SQLite + native processes
```

**Test:** `cd apps/api && uv run pytest tests/ -v`

---

## Potential Next Steps

### High value
- **Email reminders** — Daily/weekly digest via Resend or SendGrid. Data at `GET /reminders`; needs a cron calling a new `POST /reminders/send` endpoint.
- **Onboarding empty state** — New users with no plants see zeroed stats and blank sections. A first-run prompt to add their first plant would help.

### Medium effort
- **Real usernames** — Add a `display_name`/`username` column; needed for nicer handles + non-email search.
- **Vision AI** — Swap `qwen2.5:0.5b` for `moondream` or `llava:7b`. Base64-encode latest photo and pass as `"images"` in Ollama payload.
- **Feed caching** — `/feed` is the heaviest query. Add Redis cache per-user (30–60s TTL) before scale.

### Polish
- **Mobile layout** — Test and improve grids/cards at phone widths.
- **PWA / offline** — Service worker + manifest for mobile install.
- **Visibility controls** — per-plant or per-photo `is_public` flag for private photos.

---

## Session History

### 2026-08-22
- Split homepage by auth state: signed-out shows marketing landing page (hero, "How it works" steps, feature cards, bottom CTA); signed-in shows app home
- Added signed-in homepage sections: upcoming reminders (due within 7 days, amber), quick-care form, recent activity feed (last 10 care events across all plants)
- "At a glance" plant badges now show three states: Overdue (rose) / Due in Xd (amber) / On track (green)
- Added `GET /logs?limit=N` backend endpoint returning `LogWithPlant` (logs with plant name attached)
- Added HEIC/HEIF upload support: `pillow` + `pillow-heif` added to dependencies; server converts HEIC → JPEG before storage
- Fixed iOS photo upload error ("string did not match the expected pattern"): changed file input `accept` from explicit MIME list to `image/*`
- Fixed API error display: `lib/api.ts` now extracts FastAPI's `{"detail":"..."}` field for clean error toasts
- Added 🪴 favicon via metadata in `layout.tsx`
- Fixed dark mode select dropdown in QuickCareForm (`dark:[color-scheme:dark]` + `dark:bg-zinc-800`)
- Standardised header button heights across signed-out landing page (`ThemeToggle`, "Sign in", "Get started" all `py-3`)
- Removed duplicate sign-in button (NavAccount excluded from signed-out page; single sign-in button in top-right header)

### Prior sessions
- Full-stack MVP: plants, logs, reminders, photos, AI chat, analytics, social following/feed
- Deployed to Vercel (web) + Render (API) + Neon (Postgres) + Cloudflare R2 (photos)
- Clerk auth integrated; INTERNAL_API_SECRET for API trust boundary
- Sentry error tracking for both frontend and backend
- Social features: follow/unfollow, public profiles, photo feed
