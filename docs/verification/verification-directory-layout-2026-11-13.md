# 2026-11-13 目录整理验证

本轮仅做本地文件结构维护，保留产品功能与已有未提交工作。迁移前逐文件哈希、路径映射、开工原文及本轮检查保存在 `artifacts/maintenance/directory-layout-2026-11-13/`。历史报告不作为本轮通过证据。

## 迁移与保护

- 根目录普通文件仅 README，必要隐藏配置 `.gitignore` 保留。静态站归 public，头像为 public/assets/images/avatar.jpg；生成器保留 scripts，四份测试迁到 tests；协作文档、参考资料、教程、报告分别归 docs、references、guides、verification。
- 迁移前共记录 2,866 个文件 SHA-256；2,858 个文件迁移位置。2,786 份历史过程文件按 qa/research/scratch 归档，全部保持原字节。已有未跟踪推送教程只移至 docs/guides，哈希未变。
- 原有三份未提交文档全文已备份，正文仅调整目录、链接、标题及头像路径，并增加本轮说明；此前后端提案和历史交接继续保留。地图几何、目录、头像、色板、Uiverse 原始快照、第三方库、浏览器运行脚本和 CSS 均保持原字节，页面只改头像引用。
- 历史视频笔记引用的 040/050/055.jpg 与第六阶段 scope-check.json 在整理前已缺失，已标注缺失，不伪造证据。旧归档脚本内部路径保持历史原文，重新执行前需按映射修订。

## 当前验证

- `python scripts/build-map-page.py`：成功；再次执行 public 内容哈希完全一致。
- `node tests/test-maps.mjs`：通过，四图 239/34/51/47、投影、目录、缓存/重试、港澳台映射与原内容检查。
- `node tests/test-theme.mjs`：通过，8 套配色 × 2 模式、192 对比度组合及存储异常后备。
- `node tests/test-maps-browser.mjs`：独立 agent-browser 会话、实际 HeadlessChrome，319 项通过，正常页面运行异常 0。输出 `artifacts/qa/directory-layout-2026-11-13/maps/browser-results.json`。
- `node tests/test-theme-browser.mjs --quick`：22 项通过；主题键盘、持久化、阻断存储、窄屏及无 JS 后备；本轮未重跑主题完整逐场景矩阵。输出 `artifacts/qa/directory-layout-2026-11-13/themes/browser-quick-results.json`。首次误在地图页启动，因缺少首页艺术字而失败；按脚本要求先导航首页后通过，未修改产品代码来绕过断言，初次结果单独保留。
- 39 处本地页面、模块、CSS 资源引用存在且版本指纹正确；226 处 Markdown 本地目标存在。HTTP 实测主页、地图、头像、默认图、manifest、schema 均 200 且字节一致，docs/artifacts 路径 404。
- 三个 Python 生成器语法与四份 Node 测试语法通过。组件生成器在临时副本内实际提取 5 组件，原始快照哈希一致；地图生成器在临时副本内 world-only 生成结果与正式世界几何/目录字节一致，没有写正式数据。
- 运行日志位于 `artifacts/logs/`；迁移与路径检查汇总为 `artifacts/maintenance/directory-layout-2026-11-13/checks.json`；Git 暂存区保持空，没有提交或推送。

实体设备、其他浏览器、真实倍率完整矩阵与线上发布未验证。本次仅验证当前本地字节及上述范围，不表示用户视觉确认。

网站发布目录为 `public/`，本地从该目录提供 HTTP 服务；原页面 URL 保持 `/` 和 `/map.html`。线上发布设置未查、未改，后续上线前应保证发布 public 内容。本轮没有提交、推送、部署或后端实施。
