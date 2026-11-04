# 导航与地图第一阶段验证 · 2026-11-04

本轮完成用户明确授权的第一阶段。用户确认把当前「代码之外」与页脚「探索继续」均并入关于，项目保留首页，地图独立工作区保留首页动效。未提交、推送、部署、改DNS或进入第二阶段统计填充。

## 文件范围与内容迁移

开工HEAD仍为`d1df847`；暂存区空。此前多配色系统的9份已修改文件及测试/报告、未跟踪`docs/推送教程.txt`全部保留。开工副本与SHA在`.tmp/maps-stage1/before/`、`baseline.json`；不把本轮之前的多配色改动冒充本轮新增。

| 处理 | 文件 |
| --- | --- |
| 本轮修改主站 | `index.html`、`assets/main.js`、`assets/scene.js`、`assets/style.css` |
| 新增地图工作区 | `map.html`（静态生成），`assets/maps/map-page.template.html`、`map.css`、`map-explorer.mjs`、`map-canvas.mjs`、`map-detail.mjs`、`map-data-service.mjs`、`map-image-service.mjs` |
| 本地地理与属性 | `data/maps/manifest.json`、4份GeoJSON、SOURCES.md、source元数据/许可说明；`data/regions/`四份独立名称属性目录与schema.json |
| 必要投影模块 | `assets/vendor/d3-geo.min.js`3.1.1、`d3-array.min.js`3.2.4及两份原许可证文件，约54KB；无npm安装/框架/瓦片服务 |
| 脚本 | 新增`scripts/build-map-page.py`、`prepare-map-data.py`、`test-maps.mjs`、`test-maps-browser.mjs`；调整原`test-theme-browser.mjs`的场景顺序/三入口期待和可选证据目录，保留其他断言 |
| 文档 | 更新README、design.md当前入口、PROJECT_CONSTRAINTS、WORK_STATUS及本报告 |

原内容迁移：

| 新主入口 | 完整保留的原内容 | 路由 |
| --- | --- | --- |
| 首页 | 欢迎艺术字/太阳、原探索个人展示、两张项目卡和AI目录入口 | `#personal`；line回`#top` |
| 故事 | 原关于自我介绍/侧记＋原故事全部两段正文 | `#story`，原故事后半段为内部`story-notes`场景 |
| 关于 | 原工具说明＋新增地图入口、健身/游戏两卡、完整页脚/GitHub/版权/域名 | `#about`，喜好/页脚为内部子场景 |

主内容原有26段标题/正文逐项匹配，主内容SVG路径及全部原外链均保留，证据`content-preservation.json`。三组通过原八个子场景承载；没有靠删除内容凑成三个入口。侧栏仅首页/故事/关于，旧tools锚点映射新about，旧likes等内部锚点兼容；子场景历史位置版本化。首页欢迎到个人的参数、太阳路径不变。

## 数据来源及真实覆盖

来源版本、许可、SHA、简化容差与名称修正的正式记录：[data/maps/SOURCES.md](../data/maps/SOURCES.md)。

| 地图 | 来源 | 实际独立交互区域 |
| --- | --- | --- |
| 世界 | [Natural Earth 1:50m Admin0](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/)，仓库v5.1.2，Public Domain | 242个国家／地区要素，包含属地，不是242个主权国家 |
| 中国 | [geoBoundaries gbOpen CHN ADM1](https://www.geoboundaries.org/api/current/gbOpen/CHN/ADM1/)，固定9469f09，元数据年份2019，Public Domain | 34：23省、5自治区、4直辖市、2特别行政区；沿用源陆地区域口径，未另绘海域线 |
| 美国 | [geoBoundaries USA ADM1](https://www.geoboundaries.org/api/current/gbOpen/USA/ADM1/)，Census Bureau MAF/TIGER 2018，Public Domain | 50州＋华盛顿DC；去除5属地，DC明确为district。Alaska/Hawaii使用Albers USA插图投影 |
| 日本 | [geoBoundaries JPN ADM1](https://www.geoboundaries.org/api/current/gbOpen/JPN/ADM1/)，OSM/Wambacher 2017，ODbL1.0 | 47都道府县。不是本轮取得的日本官方实时数据；派生数据继续提供ODbL许可说明、官方全文URI和署名 |

合计374个Feature；每个拥有独立路径、ID与属性记录。D3球面面积检查排除了环方向反转成整球的错误。保留小岛/小区域真实几何，微小区域另有定位点与选择器。世界Equal Earth，其余国别Mercator（美国除外）。地理简化与量化用于浏览探索，不宣称测绘级精度。

四份边界合计2,055,625字节；运行时只按需请求本站数据，缓存Promise和已生成路径，移动不重新投影。边界只有id/geometry；名称/类型/sourceId/flagCode、未来statistics/images独立。所有统计当前null、图片数组为空，人口/GDP/民族/语言/图片明确标第二阶段接入，未将未知当零。ISO emoji旗帜在Windows可能显示字母；稳定图旗资源可在第二阶段接入。

## 本轮实际测试

环境：Windows，Chrome156，通过agent-browser独立会话与CDP；本地`http://127.0.0.1:8765/`。视口是模拟布局，触摸是原生CDP触摸事件模拟，不冒充实体手机。所有结果为本轮新运行，旧主题报告不自动证明新导航通过。

| 命令/检查 | 结果 |
| --- | --- |
| `node scripts/test-maps.mjs` | 先观察6入口对3入口失败，再实现通过。覆盖迁移关键文本、242/34/51/47区域、34分类/50州/DC、ID连接、环闭合与经纬度、球面环方向、空统计、共享缓存/失败重试、图片接口 |
| `node scripts/test-maps-browser.mjs` | **155项通过**，零运行/控制台错误。4图真实路径命中/hover名称/轻微抬升/点击选中与详情、滚轮、鼠标拖动、加减/恢复/平移按钮、键盘、下拉定位、hash深链/刷新/前进后退、快速切换、注入网络失败与重试均有本轮记录 |
| 地图64组合 | 4地图×8配色×2模式均实际渲染，核对实际区域填色等于对应主题第三色衍生值及横向边界；并确认同一文档四份边界各请求一次。16张世界地图主题截图 |
| 地图响应式/触摸 | 1440×1000、768×1024、375×812、320×740无横向溢出；香港选择/详情、手机底部抽屉开关通过。原生CDP单指拖动、双指缩放（倍率上升）通过 |
| `node scripts/test-theme.mjs` | 8套精确色值×2模式、192组对比度、启动/存储回退通过，未改原主题配置或preferences.js |
| 原主题浏览器回归 | 在独立`LINETOP_QA_OUT=.tmp/maps-stage1/theme-regression`运行更新后的完整`test-theme-browser.mjs`：**544项通过、384场景布局、288截图**；22项quick也是本轮单独运行通过。三组导航与地图入口没有破坏原主题/减少动态/存储失败/无JS后备 |
| 内容完整性 | 原主内容26段标题/正文、原主内容SVG路径、原外链全部保留；之前主题实现两个运行源文件SHA保持。`content-preservation.json`、`final-source.json` |
| 最终axe4.12.1 | 四地图×浅深8组合（含选中详情）**零确定违规**；保留1类color-contrast人工项，主要为滚动遮叠和符号按钮。发现的空国旗ARIA已修复并重载后复扫；不宣称完整无障碍认证 |
| 静态构建/语法 | `python scripts/build-map-page.py`成功；JS/ESM `node --check`、Python内存compile、`git diff --check`通过。资源/ESM依赖/地理数据SHA全部匹配。静态项目没有npm构建/Lint配置，不虚报不存在的构建任务 |

第一轮155矩阵前，按只读审阅复现并修复两项P2：快速切图丢失待保存视角、跳到地图链接覆盖当前地图路由；专门回归先失败后通过（`review-regression.json`）。主Agent唯一编辑；`map_stage1_review`不写文件、不操作浏览器，复阅无剩余重要问题。最终空国旗可访问标记的局部修改以8组合axe复扫为证据，未冒称更改后重新执行全部交互矩阵。

实际查看了4图选中截图、16配色/模式地图汇总、手机375详情/主站关于截图。部分截图滚动到地图画布居中，页面标题在视口之外，不是内容裁掉。证据在`.tmp/maps-stage1/`；[实际截图查看器](../.tmp/maps-stage1/process.html)。

## 第二阶段与未验证边界

第二阶段再接有年份/单位/定义/来源的人口与GDP、族群/语言数据、授权照片及稳定图旗资源；只需维护属性/图片服务与目录，不需要重写地图画布。当前边界是上述年份/口径的概化地图，不是实时官方发布。

实体手机/真实触控板、Safari/Firefox/Edge、完整读屏、真实页面缩放矩阵、高帧率表现、在线部署未测。没有已知阻塞，截图/自动检查不代表用户视觉确认。交付后停止第一阶段，不自行填数据、提交、推送或部署。
