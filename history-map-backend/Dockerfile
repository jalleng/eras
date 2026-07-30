FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first (separate layer from app code) for better
# Docker build cache reuse when only source files change.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000

# Shell form (not exec/JSON-array form) so $PORT gets expanded — Render
# assigns its own port at runtime via this env var; the :-8000 fallback
# keeps `docker run` working the same way locally without it set. The
# leading `exec` replaces the shell (PID 1) with the uvicorn process
# instead of spawning it as a child, so SIGTERM reaches the app directly
# for a clean shutdown instead of waiting out the grace period.
CMD exec uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
