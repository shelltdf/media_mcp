#!/usr/bin/env python3
"""仓库入口：默认 vite dev（`python dev.py` 或 `python dev.py vue`）。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))

from repo_dispatch import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
