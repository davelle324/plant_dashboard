# Plant Care Dashboard

A full-stack plant care tracker with AI assistance and photo uploads.

- `apps/web` — Next.js 14 App Router frontend (TypeScript, Tailwind)
- `apps/api` — FastAPI backend (Python, SQLAlchemy, Pydantic)

## Features

- Plant and care log CRUD with per-user data isolation (multi-tenant)
- Backdated log entries — pick any date and time when adding or editing a log
- Watering reminders; overdue plants surfaced on dashboard and homepage
- Dashboard with health donut chart, reminder queue, and searchable/filterable plant grid
- Plant health score (0–100) on every plant card and the detail page, replacing binary Healthy/Overdue
- Per-plant care activity chart (12-week stacked bar by log type)
- Analytics page — care events per week, care type breakdown, watering consistency trend chart, per-plant stats table
- Photo uploads with optional captions; captions appear on hover in the per-plant gallery and the dashboard gallery
- Dashboard gallery — all photos across every plant in one grid; shows plant name and caption on hover, links to plant detail page
- **Social / following** — discover other gardeners (`/people`), view their public profile + plant gallery (`/profile/[userId]`), follow/unfollow them, and see their photos in a "Following" feed on the homepage
- AI assistant powered by Ollama (uses plant history as context, runs locally)
- Dark mode — toggles via a sun/moon button; preference persists in localStorage
- Settings: display timezone, plant-form defaults (saved in browser), live API status
- No-auth local dev mode — no Clerk keys required to run

## Running locally

Two scripts in the project root cover both modes:

### Docker (recommended)

Requires Docker Desktop or Docker Engine.

```bash
./run-docker.sh
```

Starts Postgres, FastAPI, Next.js, and Ollama in containers. The Ollama model (`qwen2.5:0.5b`, ~400 MB) is pulled automatically on first boot and cached in a Docker volume — subsequent starts skip the download.

To wipe the database and start fresh:

```bash
docker compose down -v && ./run-docker.sh
```

### Local processes

Requires [`uv`](https://docs.astral.sh/uv/getting-started/installation/) and `node`/`npm`. No Docker needed — uses SQLite.

```bash
./run-local.sh
```

Ollama is optional. If installed, the AI assistant works automatically. If not, the AI endpoint returns a clear 503 with install instructions.

To activate the Python virtual environment for manual API work:

```bash
source activate_env.sh   # creates .venv via uv sync if it doesn't exist yet
```

### URLs

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| API health | http://localhost:8000/health |

## Authentication

Clerk is supported but optional. Without Clerk keys the app runs in **no-auth local mode** — all requests are scoped to a single `dev-user`. To enable Clerk, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `apps/web/.env.local`.

## Environment

Copy the example files and fill in values as needed:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | API | Postgres URL in Docker; SQLite path locally |
| `UPLOAD_DIR` | API | Local directory for photo uploads (`/uploads` in Docker) — used when S3 is not configured |
| `S3_BUCKET` | API | Set to switch photo storage to S3-compatible object storage (R2/B2/Supabase/AWS). See "Photo storage" below. |
| `S3_ENDPOINT_URL` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_PUBLIC_BASE_URL` | API | S3 connection settings (only when `S3_BUCKET` is set) |
| `OLLAMA_URL` | API | Ollama base URL (`http://localhost:11434` locally) |
| `AI_MODEL` | API | Ollama model name (default: `qwen2.5:0.5b`) |
| `CORS_ORIGINS` | API | Comma-separated allowed origins (set to your prod domain before deploying) |
| `INTERNAL_API_SECRET` | API + Web | Shared secret; when set, the API rejects requests that don't carry it. Must match on both services. |
| `MAX_UPLOAD_BYTES` | API | Max photo upload size in bytes (default 5 MB) |
| `API_INTERNAL_URL` | Web | How Next.js reaches the API (`http://api:8000` in Docker, `http://localhost:8000` locally) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web | Clerk publishable key (leave empty for no-auth mode) |
| `CLERK_SECRET_KEY` | Web | Clerk secret key (leave empty for no-auth mode) |

## Database migrations

Schema is versioned with [Alembic](https://alembic.sqlalchemy.org/) (in `apps/api/`). The Docker API container runs `alembic upgrade head` on boot. For manual work:

```bash
cd apps/api
uv run alembic upgrade head                              # apply pending migrations
uv run alembic revision --autogenerate -m "describe it"  # after editing models
uv run alembic downgrade -1                              # roll back one
```

For local SQLite dev and tests, `create_all()` bootstraps the schema automatically, so you don't need to run Alembic by hand. See the "Database migrations (Alembic)" section in `handoff.md` for the one-time `alembic stamp head` step on pre-existing databases.

## Photo storage

Photos use a pluggable storage backend (`apps/api/app/storage.py`):

- **Local disk (default)** — files go to `UPLOAD_DIR` and are served by FastAPI's static mount. Zero config; used in local dev, Docker, and tests.
- **S3-compatible (production)** — set `S3_BUCKET` (plus credentials) and the backend switches automatically. Works with any S3 API: **Cloudflare R2** (recommended — 10 GB free, zero egress fees), Backblaze B2, Supabase Storage, or AWS S3. Object keys are identical across backends, so switching providers is just an env change.

**Why this matters for deploy:** local disk is wiped on every redeploy on Render/Fly, so configure S3 before storing anything you want to keep. Photo URLs (`/api/uploads/{plant_id}/{filename}`) stay the same either way — in S3 mode the API redirects to a presigned (or CDN) URL.

## API tests

```bash
cd apps/api
uv run pytest tests/ -v
```

66 tests covering: auth (including gallery endpoint), plant CRUD, user isolation, log CRUD, reminders (overdue + `?all=true` param + isolation), photos (upload/delete/cascade, captions, caption updates, cross-plant gallery + isolation, content-signature + size validation), analytics (counts, isolation, avg-days, watering intervals), AI endpoint, health check, CORS, social (user discovery + search, follow/unfollow, self-follow guard, public profiles/galleries, Following feed isolation), and storage backend selection (local vs S3, save/delete round-trip, presigned/CDN URL building).

## E2E tests

Playwright tests live in `apps/web/e2e/`. Requires the full stack running.

```bash
cd apps/web
npm run test:e2e        # headless
npm run test:e2e:ui     # Playwright UI
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database | PostgreSQL (Docker) / SQLite (local) |
| Auth | Clerk (optional) |
| AI | Ollama (`qwen2.5:0.5b`) |
| Charts | Recharts |
| Toasts | Sonner |
| E2E tests | Playwright |
| Deployment target | Vercel (web) + Render/Fly.io (API) + Neon (Postgres) |
