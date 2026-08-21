from __future__ import annotations

import threading
from collections.abc import Callable
from typing import Any

from policy import require
from storage import Store


class Orchestrator:
    """Minimal first-party job fabric with explicit worker registration."""

    def __init__(self, store: Store) -> None:
        self.store = store
        self.workers: dict[str, Callable[[dict[str, Any]], Any]] = {}

    def register(self, kind: str, worker: Callable[[dict[str, Any]], Any]) -> None:
        self.workers[kind] = worker

    def submit(self, role: str, kind: str, payload: dict[str, Any]) -> int:
        require(role, "submit")
        if kind not in self.workers:
            raise ValueError(f"no worker registered for {kind!r}")
        job_id = self.store.create_job(kind, payload)
        self.store.add_event("job.queued", {"job_id": job_id, "kind": kind})
        threading.Thread(target=self._run, args=(job_id, kind, payload), daemon=True).start()
        return job_id

    def _run(self, job_id: int, kind: str, payload: dict[str, Any]) -> None:
        self.store.set_job_status(job_id, "running")
        self.store.add_event("job.started", {"job_id": job_id, "kind": kind})
        try:
            result = self.workers[kind](payload)
            self.store.set_job_status(job_id, "completed")
            self.store.add_event("job.completed", {"job_id": job_id, "result": result})
        except Exception as exc:  # noqa: BLE001
            self.store.set_job_status(job_id, "failed")
            self.store.add_event("job.failed", {"job_id": job_id, "error": str(exc)})
