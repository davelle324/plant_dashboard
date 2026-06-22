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
| `/` | Homepage — live stats, "Needs attention" panel with quick-water buttons, feature highlights, "At a glance" plant list with photo thumbnails |
| `/dashboard` | All plants (with photo thumbnails), health donut chart, reminder queue, add-plant form |
| `/plant/[id]` | Plant detail — health summary, edit form, care history with log form, care activity chart, photo gallery, AI chat |
| `/settings` | Account info + live API status, plant defaults (localStorage), display timezone (localStorage), AI config info, notifications placeholder |

### Backend endpoints
- `GET/POST/PUT/DELETE /plants` — plant CRUD; `GET /plants` includes `latest_photo` per plant (single grouped subquery, no N+1)
- `GET /plants/{id}/logs`, `POST /logs`, `PUT/DELETE /logs/{id}` — log CRUD; create/update accept optional `created_at` for backdated entries
- `GET /reminders` — overdue plants with days-since-care and due-in-days
- `GET/POST /plants/{id}/photos`, `DELETE /photos/{id}` — photo upload/delete; files stored at `$UPLOAD_DIR/{plant_id}/{uuid}.ext`; served via FastAPI StaticFiles at `/uploads/...`
- `POST /ai/ask` — sends plant + care history context to Ollama; returns 503 with helpful message if `OLLAMA_URL` is unset/unreachable
- `GET /health` — `{"status":"ok"}`

### Key frontend components
| Component | Notes |
|-----------|-------|
| `PlantForm` | Reads plant defaults from `localStorage` on mount when creating |
| `LogForm` | `datetime-local` picker defaulting to now; sends `created_at` as UTC ISO string |
| `LogEntryCard` | Client component; reads `preferredTimezone` from localStorage for display |
| `PhotoGallery` | Optimistic local state for upload/delete; calls `router.refresh()` after changes |
| `CareChart` | 12-week stacked bar (watering/fertilizing/pruning/notes) via Recharts |
| `HealthChart` | Donut showing healthy vs overdue plant count |
| `QuickWaterButton` | Homepage — logs a watering immediately, flips to "Watered ✓" |
| `ApiStatus` | Settings page — pings `/api/health` client-side, shows green/red dot |
| `SettingsDefaults` | Saves default location + watering interval to `localStorage` |
| `SettingsTimezone` | Saves preferred IANA timezone to `localStorage` |

## Known Issues

None currently.

## Running the App

```bash
./run-docker.sh    # Docker: Postgres + FastAPI + Next.js + Ollama
./run-local.sh     # Local: SQLite + native processes, Ollama optional
source activate_env.sh  # Activate Python venv (creates it via uv sync if missing)
```

Local prerequisites: `uv`, `node`, `npm`. Ollama optional (AI disabled gracefully if absent).

Switching between Docker and local: the local script wipes `.next` and `tmp` first (Docker writes them as root, causing EACCES on local runs).

## Running Tests

```bash
# API (36 tests)
cd apps/api && uv run pytest tests/test_main.py -v

# E2E (requires full stack running)
cd apps/web && npm run test:e2e
cd apps/web && npm run test:e2e:ui   # interactive UI
```

## What's Committed vs Ignored

- `uv.lock` — committed (reproducible installs, like `package-lock.json`)
- `.venv/` — gitignored
- `uploads/` — gitignored (Docker uses a named volume)
- `*.db` — gitignored
- `.env` / `.env.local` / `.env.*.local` — gitignored; use `.env.example` as template

## Architecture Notes

- `DATABASE_URL` supports both Postgres (`postgresql+psycopg://...`) and SQLite (`sqlite:///./plants.db`)
- `API_INTERNAL_URL` must be `http://localhost:8000` locally; Docker compose sets it to `http://api:8000`
- Photo files are served by FastAPI `StaticFiles` mounted at `/uploads`; in Docker this is a named volume (`uploads_data`)
- Ollama model is auto-pulled on first Docker boot (stored in `ollama_data` volume); `run-local.sh` also auto-pulls if Ollama is installed
- Backend trust boundary: `x-clerk-user-id` header is trusted without cryptographic verification — acceptable for local dev, should be hardened before public deployment

## Stretch Goals / Not Started

- RAG / embeddings for semantic search over plant history (`nomic-embed-text` + ChromaDB)
- Email notifications via SendGrid
- Vision AI (attach plant photos to Ollama multimodal model like `llava` or `moondream`)
- Background cron for reminders (currently computed on-demand; plan calls for Celery + Redis)
- Deployment: Vercel (web) + Render/Fly.io (API) + Neon (Postgres)
