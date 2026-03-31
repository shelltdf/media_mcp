# media_mcp

音视频方向仓库：**四阶段文档**在 `ai-software-engineering/`；实现工程彼此独立，互不混用依赖。

| 目录 | 说明 |
|------|------|
| `media-studio-vue/` | Vue 3 + Vite，浏览器内 SDI 壳（媒体工作台） |
| `scripts/` | **统一脚本实现**（`impl_vue.py`），根目录与子目录脚本只做转发 |

## 根目录命令（推荐）

```bash
# Vue：开发（默认）
python dev.py
# 或显式
python dev.py vue
```

其他：`build.py`、`test.py`、`publish.py` 同样支持可选前缀 `vue`（默认）。约定见 `scripts/README.md`。

## 仅进入前端工程时

```bash
cd media-studio-vue
npm install
python dev.py
```

## 文档与许可证

- 概念 / 逻辑 / 物理 / 运维：`ai-software-engineering/`
- Vue 物理规格：`ai-software-engineering/02-physical/media-studio-vue/`
- 第三方运行时依赖：`THIRD_PARTY_LICENSES.md`
