#!/usr/bin/env python3
"""Run media-studio-vue tests (typecheck + production build)."""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "media-studio-vue"


def npm_cmd() -> str:
    exe = shutil.which("npm") or shutil.which("npm.cmd")
    if not exe:
        raise FileNotFoundError("npm not found on PATH")
    return exe


def main() -> int:
    if not APP.is_dir():
        print("Missing media-studio-vue/", file=sys.stderr)
        return 1
    npm = npm_cmd()
    subprocess.check_call([npm, "install"], cwd=APP)
    subprocess.check_call([npm, "run", "test"], cwd=APP)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
