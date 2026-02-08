from __future__ import annotations

import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import db_ping


def _split_csv(value: str | None) -> List[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


load_dotenv()  # allows local runs outside docker (optional)

app = FastAPI(title="Hackathon API", version="0.1.0")

cors_origins = _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"


@app.get(f"{API_PREFIX}/health")
def health():
    return {"status": "ok"}


@app.get(f"{API_PREFIX}/hello")
def hello():
    return {
        "message": "Hello from FastAPI",
        "apiPrefix": API_PREFIX,
        "nextPublicApiUrl": os.getenv("NEXT_PUBLIC_API_URL"),
    }


@app.get(f"{API_PREFIX}/db/ping")
def ping_db():
    ok, detail = db_ping()
    return {"ok": ok, "detail": detail}
