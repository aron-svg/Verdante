# Hackathon Stack (FastAPI + Postgres + Next.js)

## Run (Docker)
1) Ensure you have Docker + Docker Compose.
2) Copy `.env.example` to `.env`.
3) Start:
   - `docker compose up --build`

## URLs
- Frontend: http://localhost:${FRONTEND_PORT:-3000}
- Backend:   http://localhost:${BACKEND_PORT:-8000}

## Backend endpoints
- GET /api/health
- GET /api/hello
- GET /api/db/ping
