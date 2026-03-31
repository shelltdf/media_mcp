# 开发维护说明

## 仓库结构

- `ai-software-engineering/`：四阶段文档（概念/逻辑/物理/运维）。
- `media-studio-vue/`：Vue 3 + Vite 实现（**不在**文档目录内）。

## 命令（实现目录内）

| 操作 | 命令 |
|------|------|
| 安装依赖 | `npm install` |
| 开发服务 | `npm run dev` |
| 构建 | `npm run build` |
| 预览构建 | `npm run preview` |
| 测试 | `npm run test` |

## 仓库根 Python 入口

在项目根目录：`build.py`、`test.py`、`run.py`、`publish.py`、`dev.py`（封装 npm，便于统一入口）。

## 依赖与许可证

- 生产依赖归集见仓库根 `THIRD_PARTY_LICENSES.md`；更新 `dependencies` 时请同步该文件。
