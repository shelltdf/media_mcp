#!/usr/bin/env python3
"""仓库入口：默认构建 Vue（`python build.py` 或 `python build.py vue`）。实现见 scripts/impl_vue.py。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))

from repo_dispatch import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
