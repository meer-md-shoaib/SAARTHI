"""Root entrypoint for Render and cloud deployments.

Exports the FastAPI application so both `uvicorn main:app` and `uvicorn app.main:app`
work reliably regardless of the working directory on Render.
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402, F401

__all__ = ["app"]
