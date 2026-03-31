"""
供仓库根目录 build.py / test.py / run.py / dev.py / publish.py 复用：
根据第一个参数分发给 media-studio-vue/ 下同名的脚本。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TARGETS: dict[str, Path] = {
    "vue": ROOT / "media-studio-vue",
    "media-studio-vue": ROOT / "media-studio-vue",
}


def main() -> int:
    script_path = Path(sys.argv[0]).resolve()
    script_name = script_path.name
    args = sys.argv[1:]

    key = "vue"
    if args and args[0] in TARGETS:
        key = args[0]
        args = args[1:]
    elif args and args[0] in ("-h", "--help"):
        print(
            f"用法: python {script_name} [vue] [子脚本参数...]\n"
            "  vue（默认） → media-studio-vue/（Web / Vite）\n"
            "实现逻辑见 scripts/impl_vue.py；"
            "也可 cd 到 media-studio-vue 直接运行同名脚本。\n"
            "详见 scripts/README.md。",
        )
        return 0

    sub = TARGETS.get(key)
    if sub is None:
        print(f"未知目标 {key!r}，请使用 vue（或省略）", file=sys.stderr)
        return 1

    child = sub / script_name
    if not child.is_file():
        print(f"缺少脚本: {child}", file=sys.stderr)
        return 1

    return int(subprocess.call([sys.executable, str(child), *args]))


if __name__ == "__main__":
    raise SystemExit(main())
