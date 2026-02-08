from __future__ import annotations

import os
from typing import Tuple

import psycopg


def db_ping() -> Tuple[bool, str]:
    """
    Simple connectivity check.
    DATABASE_URL is expected to look like:
      postgresql://user:password@host:port/dbname
    """
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        return False, "DATABASE_URL is not set"

    try:
        with psycopg.connect(dsn, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                _ = cur.fetchone()
        return True, "db ok"
    except Exception as e:
        return False, f"db error: {type(e).__name__}: {e}"
