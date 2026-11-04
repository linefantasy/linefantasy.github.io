# LineTop

`linetop.top` 的个人主页，静态HTML/CSS/JavaScript，无安装依赖、远程字体或构建步骤。

当前支持首页/故事/关于三组导航、固定头像、8套配色×浅深模式、右下设置，以及真实矢量地图工具Map Explorer。原欢迎/个人/项目、原关于/故事、原工具/喜好/页脚分别归入这三组内容，原有八个分屏内容保留。全部场景使用随配色变化的22°主题条带：桌面欢迎贯穿、手机局部裁切。沿用艺术字、原位交叉显隐和单太阳接力；空间不足/减少动态/脚本失败时恢复完整自然文档。实现和验证不等于用户视觉认可。

## 协作入口

阅读顺序：**[AGENTS](AGENTS.md) → [长期约束](docs/PROJECT_CONSTRAINTS.md) → [当前交接](docs/WORK_STATUS.md) → [唯一当前design.md](design.md) → 对应验证记录 → 任务相关源码**。本轮最新验证为 [地图第一阶段报告](docs/verification-map-revision-1-2026-11-04.md)，旧记录仅证明历史版本。

## 本地运行

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8765/>。右下齿轮可hover/键盘聚焦展开，触屏点击展开；主题与动态按钮有随状态变化的提示。新增调色盘按钮可打开8套三色卡片，方向键/空格选择，即时生效；Escape先关闭配色卡片，再收起齿轮。配色与明暗模式分别保存。初次原始配色＋浅色，深色主背景#000000，选择只保存于当前浏览器当前站点；存储不可用时本次仍可操作。系统减少动态优先。侧栏为首页、项目、故事、关于；首页仍进入原个人展示，line返回欢迎。

头像固定引用根目录 [头像1.jpg](头像1.jpg)，保留头像框和加载失败默认图；不再提供修改头像，不读或删除旧本地头像数据库。日后换图可替换此项目文件，保留路径；没有后台或上传接口。

故事保留原关于正文与待整理的故事，关于包含AI工具、健身/游戏和GitHub页脚。AI工具中的地图入口打开 [map.html](map.html)，四图切换无需刷新；没有填充未经验证的人口/GDP/照片。

## Map Explorer 第一阶段

世界投影第一项/默认为原版 **Equal Earth**，另可选等距圆柱和墨卡托；中国/日本保留墨卡托与等距圆柱，美国固定Albers USA。切换保留选区、恢复全图，URL记录投影。放大超过600%才显示微小定位点，点大小与命中范围不随倍率放大。港澳台在世界图属于中国，在中国图保留省级选择。其他争议边界核查按用户最新决定暂缓。

打开<http://127.0.0.1:8765/map.html>，或从主站项目→AI小工具→地图进入。国家/行政区可以悬停、点击、滚轮/双指缩放、鼠标/触摸拖动；另有缩放/恢复/平移按钮、键盘和搜索选择器。世界239国家/地区（港澳台并入中国）、中国34省级区域、美国50州＋DC、日本47都道府县，实际来源及年份/许可见[data/maps/SOURCES.md](data/maps/SOURCES.md)。日本使用2017年OSM/Wambacher边界，不是官方实时地图。

- `assets/maps/`：共享地图画布、控制器、详情/图片接口、数据服务、响应式样式和页面模板。
- `data/maps/`：按需加载的本地GeoJSON边界/manifest/来源；`data/regions/`：独立名称属性目录与未来统计schema。
- `scripts/build-map-page.py`：从index同步侧栏/设置生成map.html，刷新根资源与ESM依赖SHA；改公共shell或地图模块后运行。生成器无外部依赖，不运行Uiverse原快照生成器。
- `scripts/prepare-map-data.py`：从固定上游原文件离线生成地图与目录，无第三方Python包；输入URL、SHA及处理口径见SOURCES。本次用`python scripts/prepare-map-data.py .tmp/maps-stage1 --world-only`仅生成世界数据，不重写其他三图。
- 第二阶段：接入有年份/单位/来源的真实统计值与授权图片，配置在目录/schema；不需要重写SVG渲染器。

验证：`node scripts/test-maps.mjs`，`node scripts/test-theme.mjs`。浏览器先执行`agent-browser --session linetop-maps open http://127.0.0.1:8765/map.html`，再运行`node scripts/test-maps-browser.mjs`；Windows用`AGENT_BROWSER_BIN`指向原生CLI。浏览器测试仅用于隔离会话，含故障夹具，不指向日常浏览器。当前源码的[完整验证报告](docs/verification-map-revision-1-2026-11-04.md)区分模拟触摸与实体设备。

## 实现入口

- `index.html`：语义内容、唯一侧栏、舞台壳和全局齿轮。
- `assets/style.css`：原浅色样式、语义主题角色、深色覆盖、响应式及齿轮交互样式。
- `assets/main.js`：侧栏/焦点/固定头像与艺术字加载后备。
- `assets/scene.js`：八场景共享滚动进度、太阳、路由/历史、fit和自然文档后备。
- `assets/theme-init.js`：样式前恢复主题；`assets/preferences.js`：主题、动态偏好与工具栏行为。
- `index.html`中两份内联艺术字继承主题变量、ID独立；`assets/linetop-wordmark*.svg`保留为原始路径资产。
- `assets/uiverse/`：原源码快照及SHA清单；条目4/7/18/20仍实际使用，齿轮按钮复用20，条目3复选框已退役但归档保留。
- `scripts/build_components.py`：会写快照/CSS/清单和探索/GitHub两个插槽；无必要不要运行。本轮仅在临时沙盒验证，不重生成正式资源。修改CSS/JS后同步index资源内容指纹。

## 主题测试

无需安装依赖或构建。核心配置/对比度测试：`node scripts/test-theme.mjs`。

实际浏览器矩阵：先启动本地服务，执行`agent-browser --session linetop-palettes open http://127.0.0.1:8765/`，再运行`node scripts/test-theme-browser.mjs`。Windows可用`AGENT_BROWSER_BIN`指定本机agent-browser原生exe路径；`LINETOP_QA_SESSION`可指定隔离会话。测试会清理**该隔离浏览器**的本站localStorage，勿指向日常浏览器。证据写入Git忽略的`.tmp/palettes-2026-11-04/`。

[本轮主题验证报告](docs/verification-themes-2026-11-04.md)记录16种组合、三种视口、原色残留检查及未测范围；旧报告仅为历史版本。

## 历史验证

[新验证报告](docs/verification-visual-nav-2026-11-01.md)记录全场景背景、字色、侧栏顺序、过程帧、两主题原生页面缩放及未测项。最终截图与原始记录位于Git忽略的 `.tmp/visual-nav-2026-11-01/unified/`，可打开[截图查看器](.tmp/visual-nav-2026-11-01/unified/process.html)，或访问 <http://127.0.0.1:8765/.tmp/visual-nav-2026-11-01/unified/process.html>；缺失时标为待重验，不用旧证据冒充。

[2026-11-01早期功能验证](docs/verification-2026-11-01.md)及`.tmp/nov1/`保留为历史。本轮最初的“浅色完全不变”检查已被最新授权修改浅色背景替代，不作为最终结论。

[第六阶段](docs/verification-stage6.md)、[第五阶段](docs/verification-stage5.md)、[缩放修复](docs/verification-stage4-zoom-fix.md)、[第四阶段](docs/verification-stage4.md)、[第三阶段](docs/verification-stage3.md)及[旧设计](docs/design-v1.md)均保留为历史。实体设备、其他浏览器、高帧率和用户视觉确认不由截图或自动检查替代。

此前侧栏去边线已提交推送；本轮主题及地图第一阶段均没有提交/推送授权，交接见WORK_STATUS。未安装依赖或额外操作部署/DNS，CNAME保持linetop.top。
