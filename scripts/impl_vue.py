"""media-studio-vue：npm 构建 / 测试 / 运行 / 发布。

由仓库根 `build.py` 等经 `scripts/repo_dispatch.py` 调度，或由 `media-studio-vue/` 下薄脚本直接调用。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from _paths import REPO_ROOT

APP = REPO_ROOT / "media-studio-vue"
DIST = APP / "dist"


def npm_cmd() -> str:
    exe = shutil.which("npm") or shutil.which("npm.cmd")
    if not exe:
        raise FileNotFoundError("npm not found on PATH")
    return exe


def _ensure_package() -> int:
    if not (APP / "package.json").is_file():
        print("Missing package.json in media-studio-vue/", file=sys.stderr)
        return 1
    return 0


def main_build() -> int:
    if _ensure_package():
        return 1
    npm = npm_cmd()
    subprocess.check_call([npm, "install"], cwd=APP)
    subprocess.check_call([npm, "run", "build"], cwd=APP)
    return 0


def main_test() -> int:
    if _ensure_package():
        return 1
    npm = npm_cmd()
    subprocess.check_call([npm, "install"], cwd=APP)
    subprocess.check_call([npm, "run", "test"], cwd=APP)
    return 0


def main_dev() -> int:
    if _ensure_package():
        return 1
    npm = npm_cmd()
    subprocess.check_call([npm, "install"], cwd=APP)
    subprocess.check_call([npm, "run", "dev"], cwd=APP)
    return 0


def main_run() -> int:
    if _ensure_package():
        return 1
    npm = npm_cmd()
    subprocess.check_call([npm, "install"], cwd=APP)
    subprocess.check_call([npm, "run", "build"], cwd=APP)
    subprocess.check_call([npm, "run", "preview"], cwd=APP)
    return 0


def main_publish() -> int:
    if _ensure_package():
        return 1
    npm = npm_cmd()
    subprocess.check_call([npm, "install"], cwd=APP)
    subprocess.check_call([npm, "run", "build"], cwd=APP)
    print(f"Publish output: {DIST}")
    return 0
