# 第三方许可证汇总（运行时 / 交付物）

本文件列出 **进入 `media-studio-vue` 生产构建产物** 的第三方包（以 `media-studio-vue/package.json` 的 `dependencies` 为准）。开发-only 工具链见 `devDependencies`，不重复罗列于此。

复现依赖集合：

```bash
cd media-studio-vue && npm install && npm ls --omit=dev
```

## 生产依赖

| 包 | 许可证（ SPDX ） | 说明 |
|----|------------------|------|
| [vue](https://www.npmjs.com/package/vue) | MIT | 运行时框架 |
| [vue-i18n](https://www.npmjs.com/package/vue-i18n) | MIT | 国际化 |
| [@ffmpeg/ffmpeg](https://www.npmjs.com/package/@ffmpeg/ffmpeg) | MIT | 浏览器内 FFmpeg 封装（Web Worker） |
| [@ffmpeg/util](https://www.npmjs.com/package/@ffmpeg/util) | MIT | `fetchFile` / `toBlobURL` 等工具 |
| [@ffmpeg/core](https://www.npmjs.com/package/@ffmpeg/core) | MIT | 与上述版本匹配的 wasm 核心（运行时亦从 CDN 拉取同版本资源） |

具体版本以 `media-studio-vue/package-lock.json` 解析为准。升级或新增生产依赖时请更新本表。
