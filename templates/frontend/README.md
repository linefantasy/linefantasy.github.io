# LineTop 前端 Starter

这是可以直接运行和修改的完整前端模板：页面、按钮、侧栏、8 套配色、浅深模式、设置浮层、响应式布局、太阳接力动画和四张交互地图都已包含。使用原生 HTML/CSS/JavaScript，无 npm 安装或线上服务要求。

## 第一次使用

1. 解压 ZIP，进入 `linetop-frontend-starter` 文件夹。
2. 在该文件夹打开终端，执行：

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory public
```

3. 浏览器打开 `http://127.0.0.1:8765/`；地图为 `/map.html`，可交互的组件样例为 `/components.html`。不要直接双击 HTML，地图使用 fetch 和 ES Modules，需要 HTTP 服务。

如果已有项目的前端是静态网页，可将 `public/` 的内容整体放入其静态发布目录，保持相对目录。它也可放到子路径，例如 `/my-app/`。Vue/React 等项目可以参照布局和样式逐步移植，不能直接把整套 DOM 脚本重复挂载进框架组件；具体依赖见 [组件复用说明](docs/COMPONENTS.md)。

## 修改自己的内容

| 想修改 | 文件或位置 |
| --- | --- |
| 标题、昵称、介绍、导航文字、项目卡、GitHub 链接 | `public/index.html`，搜索 LineTop、line fantasy、linefantasy 和现有文案 |
| 头像 | 替换 `public/assets/images/avatar.jpg`；换格式时同时改 index 的 src |
| 品牌艺术字 | index 中的 `svg.hero-wordmark` 和 `svg.mini-wordmark` 是两份手绘 SVG 路径；只改 title 不会改变字形，需同时替换它们 |
| 颜色方案 | `public/assets/theme-init.js`；默认 CSS 角色和样式在 `public/assets/style.css` |
| 太阳接力、场景顺序与滚动逻辑 | `public/assets/scene.js`；涉及场景 ID、导航和历史，修改后需回归 |
| 地图工作区内容 | `public/assets/maps/map-page.template.html`，不要仅改生成的 map.html |
| 地区属性、边界及来源 | `public/data/regions/`、`public/data/maps/`，不要删除来源与许可记录 |

改完首页公共侧栏/设置或地图模块后，在模板根运行：

```powershell
python scripts/build-map-page.py
node tests/test-maps.mjs
node tests/test-theme.mjs
```

首页、头像、介绍和 GitHub 链接保留原站示例，创建自己的项目时请替换。原域名 CNAME 未打入包；发布时只取 public 的内容，自行配置目标站点。模板没有登录/后台/API，地图统计与照片仍为空，不把它当成已有后端。

## 包内有什么

- `public/`：整站、组件样例和全部本地资源。
- `scripts/`：地图页面同步与 Uiverse 组件提取工具。组件提取会写页面插槽和快照，仅确需重生成组件时运行。
- `tests/`：Node 检查及独立浏览器回归脚本；浏览器脚本需另有 agent-browser，普通运行站点不需要。
- `docs/COMPONENTS.md`：组件 HTML/CSS/JS 依赖、可复制范围和框架移植限制。
- `docs/THIRD_PARTY.md`：组件作者、D3 和地图数据来源；第三方许可仍各自适用。
- `docs/references/`：原始组件资料与色板，供组件生成器使用。
- `manifest.json`：导出文件的 SHA-256、源文件对应关系、模板格式及存储前缀。修改模板后这是导出时的基线，不是修改后指纹。

同一个域名下不同项目会共享 localStorage。此包已经将三种偏好键改为模板专用前缀，具体值见 manifest；如果复制成多个同域项目，再给每个项目选一个独有前缀，修改 theme-init.js、preferences.js 及 test-theme.mjs 中的三个存储键，保留事件名和 DOM ID。

这是 Starter 的独立副本，之后不会自动接收原项目更新。它保留完整原 UI，尚未重构为隔离 CSS、支持多实例挂载的组件库。

## 继续交给 AI 改造

可复制下面这段话，并补充目标项目：

> 以这个 LineTop 前端 Starter 为基础，为我的【项目名和用途】修改页面内容。先读 README、docs/COMPONENTS.md 和 THIRD_PARTY.md。复用已有按钮、侧栏、主题、卡片与动效，不换框架或重画界面。先说明会改哪些文件；页面公共壳或地图模块修改后运行 build-map-page.py；保留第三方作者和来源，验证真实交互，不把占位功能说成已实现。我的具体要求是：【填写】。

## 采用的复用方式

参考 [HTML5 Boilerplate](https://github.com/h5bp/html5-boilerplate) 的模板 ZIP 分发方式：交付可用模板，保留源文件与说明。也可将解压后的目录上传到你自己的 [GitHub 模板仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)，用于创建后续项目；此包未操作任何远程仓库。
