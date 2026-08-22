from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any


class Store:
    """Small first-party persistent store using Python's SQLite runtime."""

    def __init__(self, path: str = "phantom-core.db") -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True) if Path(path).parent != Path('.') else None
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        self._lock = threading.RLock()
        self._init()

    def _init(self) -> None:
        with self._lock, self._db:
            self._db.executescript(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    kind TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL
                );
                """
            )

    def create_job(self, kind: str, payload: dict[str, Any]) -> int:
        now = time.time()
        with self._lock, self._db:
            cur = self._db.execute(
                "INSERT INTO jobs(kind,payload,status,created_at,updated_at) VALUES(?,?,?,?,?)",
                (kind, json.dumps(payload), "queued", now, now),
            )
            return int(cur.lastrowid)

    def set_job_status(self, job_id: int, status: str) -> None:
        with self._lock, self._db:
            self._db.execute("UPDATE jobs SET status=?,updated_at=? WHERE id=?", (status, time.time(), job_id))

    def get_job(self, job_id: int) -> dict[str, Any] | None:
        with self._lock:
            row = self._db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
        if not row:
            return None
        return dict(row) | {"payload": json.loads(row["payload"])}

    def add_event(self, event_type: str, payload: dict[str, Any]) -> None:
        with self._lock, self._db:
            self._db.execute(
                "INSERT INTO events(type,payload,created_at) VALUES(?,?,?)",
                (event_type, json.dumps(payload), time.time()),
            )
