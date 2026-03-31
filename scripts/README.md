# 仓库脚本约定

为避免 **`media-studio-vue/`** 内重复维护一套逻辑，**真实实现**集中在：

| 模块 | 作用 |
|------|------|
| `repo_dispatch.py` | 供仓库根目录的 `build.py`、`test.py`、`run.py`、`dev.py`、`publish.py` 调用：按第一个参数分发给子工程。 |
| `impl_vue.py` | `media-studio-vue`：npm install / build / test / dev / preview。 |
| `_paths.py` | 解析仓库根目录。 |

子目录下的同名脚本仅为 **薄封装**（把 `scripts/` 加入 `sys.path` 后调用 `impl_vue`），便于在子目录单独执行，也便于根目录统一调度。

## 推荐用法

在 **仓库根目录**：

```text
python build.py          # 构建 Vue
python dev.py            # Vue 开发服务
python test.py           # 测试 Vue
```

在子目录（等价）：

```text
cd media-studio-vue && python build.py
```
