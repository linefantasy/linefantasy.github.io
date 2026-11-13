# 验证记录索引

- [2026-11-13 前端复用包](verification-frontend-starter-2026-11-13.md)：独立模板 ZIP、组件样例与导出保护核对。

- [2026-11-13 目录整理](verification-directory-layout-2026-11-13.md)：本次迁移、路径核查与当前回归结果。
- [地图修订 1](verification-map-revision-1-2026-11-04.md)、[地图第一阶段](verification-map-stage1-2026-11-04.md)、[八套配色](verification-themes-2026-11-04.md)：之前的地图与主题验证。
- [视觉与导航](verification-visual-nav-2026-11-01.md)、[早期检查](verification-2026-11-01.md)：历史记录。
- [第六阶段](verification-stage6.md)、[第五阶段](verification-stage5.md)、[第四阶段缩放修复](verification-stage4-zoom-fix.md)、[第四阶段](verification-stage4.md)、[第三阶段](verification-stage3.md)、[最早验证](verification-v1.md)：历史阶段记录。

历史报告中的命令及受测指纹保留原语境，不作为当前版本验收。迁移对照：原根 index.html、map.html、assets、data、CNAME 现位于 `public/`；原 `scripts/test-*` 现位于 `tests/`；原 `.tmp/<阶段>/` 证据现位于 `artifacts/qa/<阶段>/`；地图源文件和研究材料分别归入 `artifacts/research/maps-stage1/`、`artifacts/research/research-stage1/`；视频调查归入 `artifacts/research/backend-video/`。旧临时脚本保留原字节归档，复用前需按新目录调整路径。

历史截图查看器不由网站服务公开。如需查看，可在项目根另开本地服务：`python -m http.server 8766 --bind 127.0.0.1 --directory artifacts`，再访问 `http://127.0.0.1:8766/qa/<阶段>/process.html`（以实际存在文件为准）。缺失证据应重验，目录迁移不能补足旧证据。
