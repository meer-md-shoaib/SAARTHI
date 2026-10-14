"""App package proxy for root-level deployment.

Ensures that `uvicorn app.main:app` works cleanly when run from the root directory
by extending the package search path to include `backend/app`.
"""

from __future__ import annotations

import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
_backend = _root / "backend"
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

_backend_app = str(_backend / "app")
if _backend_app not in __path__:
    __path__.insert(0, _backend_app)
