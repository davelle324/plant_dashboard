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

The web app uses Clerk auth and a same-origin `/api/...` proxy for authenticated requests.
The proxy forwards `x-clerk-user-id` to the FastAPI backend.
Clerk auth uses `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

### Environment

Set the Clerk publishable and secret keys before running the app with auth enabled.
Set `API_INTERNAL_URL=http://api:8000` when the web app is running in Docker and needs
to reach the API container by service name.
Set `NEXT_PUBLIC_API_URL=http://localhost:8000` only if you still want to call the API
directly from the browser for local debugging.

Suggested local checks:

1. Start the stack with `docker compose up --build`.
1. Open `http://localhost:3000`.
1. Confirm `http://localhost:8000/health` returns `{"status":"ok"}`.
1. Sign in through Clerk before using the dashboard.
1. Run `pytest -q` in `apps/api` before merging backend changes.

### API tests

Run the backend test suite from `apps/api`:

```bash
pytest -q
```

If you use the bundled `uv.lock`, install dependencies first and then run the tests from the virtualenv managed by your tool of choice.

### Authentication flow

- The browser talks to the Next.js `/api` routes.
- The Next.js route handlers read the Clerk session and forward the Clerk user id to FastAPI.
- The FastAPI backend uses that id to scope users, plants, and logs.
