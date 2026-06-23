FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi uvicorn[standard] sqlalchemy pydantic psycopg[binary] httpx python-multipart pytest slowapi alembic boto3 python-dotenv

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

EXPOSE 8000
# Apply any pending DB migrations, then start the API. `alembic upgrade head` is a
# no-op when the DB is already current, so this is safe to run on every boot.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
