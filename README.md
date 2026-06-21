# Plant Care SaaS

Split-stack starter for a plant care SaaS:

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI backend

The implementation includes:

- plant CRUD
- care log CRUD
- dashboard summary
- reminder calculation
- a placeholder AI route for future phase 2 work

## Local development

Frontend and backend are intentionally separated so each can be deployed independently.

### Docker

Bring up the full stack with:

```bash
docker compose up --build
```

The services will be available at:

- Web app: `http://localhost:3000`
- API: `http://localhost:8000`
- API health check: `http://localhost:8000/health`

The web app uses `API_INTERNAL_URL=http://api:8000` for server-side rendering in Docker
and `NEXT_PUBLIC_API_URL=http://localhost:8000` for browser requests.

### Environment

Set `NEXT_PUBLIC_API_URL` to point browser-side requests at the API.
Set `API_INTERNAL_URL` when the web app is running in Docker and needs to reach the API
container by service name.

Suggested local checks:

1. Start the stack with `docker compose up --build`.
1. Open `http://localhost:3000`.
1. Confirm `http://localhost:8000/health` returns `{"status":"ok"}`.
1. Run `pytest -q` in `apps/api` before merging backend changes.

### API tests

Run the backend test suite from `apps/api`:

```bash
pytest -q
```

If you use the bundled `uv.lock`, install dependencies first and then run the tests from the virtualenv managed by your tool of choice.
