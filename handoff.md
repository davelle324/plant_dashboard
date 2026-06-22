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
| `/` | Homepage — live stats, "Needs attention" panel with quick-water buttons, feature highlights, "At a glance" plant list with photo thumbnails. Dark mode toggle in hero. |
| `/dashboard` | All plants with search/filter (name, species, location) and health-status tabs (All / Healthy / Due soon / Overdue). Health donut chart, reminder queue, add-plant form. Dark mode toggle in nav. |
| `/analytics` | Care events per week (bar chart), care type breakdown (donut), watering consistency trend chart (per-plant line chart), most-active / most-neglected highlights, per-plant stats table. Dark mode toggle in nav. |
| `/plant/[id]` | Plant detail — health score (0–100), edit form, care history with log form (datetime picker), 12-week care activity chart, photo gallery, AI chat. Dark mode toggle in nav. |
| `/settings` | Account info + live API status, plant defaults (localStorage), display timezone (localStorage), AI config info, notifications placeholder. |

### Backend endpoints
- `GET/POST/PUT/DELETE /plants` — plant CRUD; `GET /plants` includes `latest_photo` per plant (single grouped subquery, no N+1)
- `GET /plants/{id}/logs`, `POST /logs`, `PUT/DELETE /logs/{id}` — log CRUD; create/update accept optional `created_at` for backdated entries
- `GET /reminders` — overdue plants only (due_in_days ≤ 0)
- `GET /reminders?all=true` — all plants' reminder rows (overdue + healthy); powers the dashboard filter
- `GET /analytics` — includes `watering_intervals: [{date, days}]` per plant for the trends chart
- `GET/POST /plants/{id}/photos`, `DELETE /photos/{id}` — photo upload/delete; files stored at `$UPLOAD_DIR/{plant_id}/{uuid}.ext`; served via FastAPI StaticFiles at `/uploads/...`
- `POST /ai/ask` — sends plant + care history context to Ollama; returns 503 with helpful message if `OLLAMA_URL` is unset/unreachable
- `GET /health` — `{"status":"ok"}`

### Key frontend files
| File | Notes |
|------|-------|
| `lib/health.ts` | `computeHealthScore(due_in_days, interval)` → 0–100 int; `healthColor(score)` → Tailwind class string |
| `lib/theme.tsx` | `ThemeProvider` + `useTheme()` hook — reads/writes localStorage `"theme"`, toggles `dark` class on `<html>` |
| `components/theme-toggle.tsx` | Sun/moon button; used in homepage hero, dashboard nav, analytics nav, and plant detail nav |
| `components/plant-grid.tsx` | Client component — search input + All/Healthy/Due soon/Overdue tab filter + plant cards with health score badge |
| `components/plant-form.tsx` | Reads plant defaults from `localStorage` on mount when creating |
| `components/log-form.tsx` | `datetime-local` picker defaulting to now; sends `created_at` as UTC ISO string |
| `components/log-entry-card.tsx` | Client component; reads `preferredTimezone` from localStorage for display |
| `components/photo-gallery.tsx` | Optimistic local state for upload/delete; calls `router.refresh()` after changes |
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

## Running Tests

```bash
# API (46 tests)
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
- **Bulk actions** — Select multiple plants on the dashboard, mark all as watered at once.
- **Pagination / infinite scroll** on dashboard for large collections.
- **Search/filter on dashboard** — ✅ Done (text search + health-status tabs on the plant grid).
- **Plant health score** — ✅ Done (0–100 on plant cards and detail page).
- **Trends on analytics** — ✅ Done (watering consistency line chart).
- **Dark mode** — ✅ Done (Tailwind class mode, localStorage persistence).

### Larger / Phase 2
- **Background cron for reminders** — Currently reminders are computed on-demand. For email/push, a scheduled job (Celery + Redis, or a simple cron endpoint) is needed.
- **PWA / offline support** — Service worker + manifest so the app installs on mobile and works offline for viewing cached data.
