#!/usr/bin/env python3
"""发布 dist：逻辑在仓库 `scripts/impl_vue.py`。"""
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO / "scripts"))

from impl_vue import main_publish  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main_publish())
