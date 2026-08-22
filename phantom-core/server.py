from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from orchestrator import Orchestrator
from storage import Store

store = Store()
orchestrator = Orchestrator(store)


def echo(payload: dict) -> dict:
    return {"accepted": True, "payload": payload}


orchestrator.register("echo", echo)


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict) -> None:
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send(200, {"ok": True, "service": "phantom-core"})
            return
        self._send(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/jobs":
            self._send(404, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length) or b"{}")
            role = body.get("role", "worker")
            kind = body["kind"]
            payload = body.get("payload", {})
            job_id = orchestrator.submit(role, kind, payload)
            self._send(202, {"job_id": job_id, "status": "queued"})
        except Exception as exc:  # noqa: BLE001
            self._send(400, {"error": str(exc)})


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8787), Handler).serve_forever()
