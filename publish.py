#!/usr/bin/env python3
"""仓库入口：默认发布 Vue dist（`python publish.py` 或 `python publish.py vue`）。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))

from repo_dispatch import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
