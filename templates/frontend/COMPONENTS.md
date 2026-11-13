# 按钮、界面与组件复用

先启动模板，再打开 `/components.html`。该页面从导出时的首页提取真实 HTML，与整站使用同一套 CSS 和交互脚本，不是重新画的近似示例。页面展示探索按钮、项目卡片、GitHub 按钮以及共享侧栏/设置。

## 组件依赖表

| 部件 | HTML 入口 | CSS | JS / 结构约束 |
| --- | --- | --- | --- |
| 探索按钮 | index 的 `uiverse:explore` 插槽，`.lt-explore` | `assets/uiverse/components.css` 中对应规则，以及主题变量 | 作为普通链接不需要 JS；需要原站滚动接力时依赖 scene.js 和目标场景 |
| 项目卡片 | `.lt-project-card > .lt-project-inner` | components.css 对应规则与 style.css 的卡片布局/配色 | 基础 hover 无 JS；链接是普通 a |
| GitHub 圆按钮 | `uiverse:github` 插槽，`.lt-social` | components.css 的 social/filled/tooltip 规则 | 普通外链，无专用 JS |
| 纵向导航/手机抽屉 | `.site-sidebar`、menu-trigger、backdrop、close | components.css + style.css 的 sidebar 和响应式规则 | main.js；必须保留 main-content、lt-quick-settings、lt-avatar 及 sidebar 等配套 DOM |
| 明暗、8 配色、减少动态 | `.quick-settings` 整块及 preference-status | style.css 的 toolbar、palette、focus 与主题规则 | theme-init.js 在 CSS 前；preferences.js 在 DOM 后，依赖完整设置 DOM 和侧栏 |
| 连续场景/太阳接力 | scene-track、scene-stage、shared-sun 及各场景 | style.css 的场景与后备布局 | scene.js + main.js + preferences.js；场景 ID、URL/history、测量逻辑相关，建议整体复制 |
| 四图地图工具 | map-page.template.html / map.html | style.css + maps/map.css | maps/*.mjs、vendor/d3-*、data/maps 和 data/regions，建议整体复制；主题壳同上 |

路径均相对于 public。原始 Uiverse 源码、作者和 SHA 清单在 `assets/uiverse/`；已适配网页中的 class 与原始快照 class 不同，不要将两者混用。

## 整站或完整页面复用

保持 public 目录完整是最省事的路径。先改内容、图片与链接，再通过 build-map-page.py 同步地图页。使用 main.js 的页面要一起保留侧栏、头像、主区域和右下设置；它不是可在任意空 DOM 上运行的初始化库。每页只加载一次脚本，保留唯一 ID。

## 只提取一个按钮或卡片

1. 从 components.html 或首页的对应插槽复制真实 HTML，并修改 href/文字。
2. 从 components.css 复制对应选择器及其 hover、伪元素、动画规则；例如探索按钮是 `.lt-explore`、`.lt-original`、`.lt-letters` 及关联规则，GitHub 按钮是 `.lt-social`、`.lt-icon-content`、`.lt-filled`、`.lt-tooltip` 及关联规则。
3. 将所用的 CSS 变量接到新项目的主题变量；变量来源为 style.css 的 :root 和 theme-init.js。也可先整体引入这些文件作为独立页面验证，再缩小复制范围。
4. 为新项目限定选择器作用域，检查全局 body、main、a、button、h1 等规则是否影响原项目。原样全量引入 style.css 会影响页面，不能承诺零冲突。
5. 保留作者注释，检查键盘焦点、hover/focus、手机布局与链接目标。原站截图通过不等于移植后通过。

原生链接/hover 卡片可先提取；设置、侧栏和滚动场景的 DOM 依赖更多。若未来要在多个 Vue/React 项目里频繁只用其中几个部件，可再拆分为框架组件或 Web Components，独立定义 props/事件与样式边界。本次没有为此引入新运行时。

## 组件样例页的维护边界

components.html 是导出时生成的组件快照，不是首页或 map.html 的模板。直接修改它可实验局部样式；之后修改首页并运行地图页生成器只同步 map.html，不会自动同步组件样例。重新从原项目运行 export-frontend.py 会重新提取首页生成整个 ZIP。
