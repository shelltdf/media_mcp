#!/usr/bin/env python3
"""构建：逻辑在仓库 `scripts/impl_vue.py`。亦可在仓库根目录执行 `python build.py vue`。"""
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO / "scripts"))

from impl_vue import main_build  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main_build())
