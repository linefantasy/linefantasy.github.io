# LineTop 第四阶段验证

此为缩放修复前的历史受测版本。当前源码及真实倍率结果请读 [第四阶段缩放修复验证](verification-stage4-zoom-fix.md)，不要将本文124项或等效CSS视口测试无条件用于新版本。

日期：2026-10-31，北京时间。当前设计 [design.md](../design.md)，任务/阶段边界 [WORK_STATUS](WORK_STATUS.md)。本报告对应当前动效版本，不沿用第三阶段61项或早期记录证明新动画。

## 实际完成范围

index.html 添加无脚本兼容的轨道/舞台壳，新增 assets/scene.js，style.css 加舞台样式及必要手机紧凑布局，main.js 仅联动栏目/偏好及模式切换滚动恢复。第三阶段艺术字、配色、侧栏、默认头像、太阳造型/颜色、真实内容和五项 Uiverse 来源保留；没有运行生成器、安装依赖、实现头像或提交推送部署。

## 环境、源码与结果

本地 <http://127.0.0.1:8765/>，Windows 上独立 Chromium / agent-browser 会话。具体 userAgent、DPR、尺寸和时间，以及11个受测文件 SHA-256，保存在 [checks.json](../.tmp/stage4/checks.json)。新脚本/样式 URL 的10位内容指纹均与文件相符。

**124 项断言通过，0 失败。** 主流程99项，附加后备/模式/回归25项。执行脚本位于 `.tmp/stage4/suite.py`、extras.py；浏览器输入与故障测试通过独立 CDP 会话完成，只触及本地测试页面。来源与范围保护见 [scope-check.json](../.tmp/stage4/scope-check.json)。

| 检查 | 证据与结果 |
| --- | --- |
| 原位显隐 | 1440×900、768×1024、375×812 的0/25/50/75/100%均测欢迎/个人标题包围盒：x/y固定，无整体平移/缩放；舞台为sticky，真实scrollY变化 |
| 单太阳共享进度 | 每尺寸A起点、途中、B终点；逆向同进度位置和显隐一致；落位后归个人，关于/项目/页脚时不可见；SVG唯一、不拦截点击 |
| 按钮连续性 | 浏览器rAF连续采样记录真实scrollY、标题坐标、太阳中心及alpha，经过多个中间值；使用同一渲染器，无跳终态 |
| 导航/焦点 | 探索、项目/关于、回首页及正文入口，hash/当前栏目/焦点统一；非当前屏inert、aria-hidden、pointer-events隔离 |
| 原生输入 | 实际CDP mouseWheel事件（isTrusted）推进；wheel与touchStart可接管驱动，PageDown/Home/End可用；快速连续路由不排队，外部滚动位置也能取消驱动 |
| 历史/刷新 | 直接#personal/#about/#footer/#top、刷新及前进后退恢复可见语义与进度；未知/非场景锚点恢复自然文档 |
| 重测 | resize保留最近u，太阳重新落到B；增高窗口footer900→1600维持u3.17，projects900→1800维持u2.32；独立审阅者复查通过 |
| 模式切换 | 手机设置切减少动态、关闭面板及重新启用保持关于上下文；减少动态刷新仍正确定位锚点 |
| 短屏/溢出 | 320×740、812×375、720×450（桌面200%等效CSS视口）回自然文档；隔离长文fixture触发后备且正文完整可滚 |
| 缩放 | CDP实际2倍视觉视口缩放触发自然文档；恢复尺寸后本次后备保持稳定，刷新/明确切换才重新尝试 |
| 故障/无JS | 浏览器真正禁脚本重载仍可读、链接可用；ResizeObserver初始化故障和history渲染故障均清除隐藏/inert，单太阳保留 |
| 入场/空闲 | 4层原位opacity入场，600ms内完成，无transform；空闲400ms观测舞台0次DOM更新，无永久渲染循环 |
| 头像边界 | 没有file input、图片处理或头像持久化，更换说明仍禁用 |

axe 当前扫描为0确定违规、32个通过规则、3类待人工检查：aria-valid-attr-value（隐藏面板关联）、color-contrast（复合背景/描边）及 skip-link（目标属于非当前inert场景）。内部路由会先启用目标场景再移交焦点；完整扫描数据见 checks.json，不宣称无障碍全项通过。

补充人工操作：键盘聚焦 skip-link 后按 Enter，实际到达 #about、当前场景 about、焦点 about-title；过程查看器已在独立浏览器打开，截图与坐标加载正常、无页面错误。此补查不追加124项计数。53处本地文档链接/锚点与当前源码指纹已核对，node语法检查、git diff --check通过，暂存区为空。

## 可直接查看的过程证据

[过程帧查看器](../.tmp/stage4/process.html)；通过本地服务查看可加载全部坐标：<http://127.0.0.1:8765/.tmp/stage4/process.html>。

| 进度 | 桌面1440×900 | 手机375×812 |
| --- | --- | --- |
| 0% | [截图](../.tmp/stage4/1440-handoff-000.png) | [截图](../.tmp/stage4/375-handoff-000.png) |
| 25% | [截图](../.tmp/stage4/1440-handoff-025.png) | [截图](../.tmp/stage4/375-handoff-025.png) |
| 50% | [截图](../.tmp/stage4/1440-handoff-050.png) | [截图](../.tmp/stage4/375-handoff-050.png) |
| 75% | [截图](../.tmp/stage4/1440-handoff-075.png) | [截图](../.tmp/stage4/375-handoff-075.png) |
| 100% | [截图](../.tmp/stage4/1440-handoff-100.png) | [截图](../.tmp/stage4/375-handoff-100.png) |

768px同样五帧保存在该目录/查看器；[手机项目终态](../.tmp/stage4/375-projects.png)、[旋转后自然文档](../.tmp/stage4/rotated-document.png)、[无JS](../.tmp/stage4/no-javascript-document.png)、[初始化故障](../.tmp/stage4/init-failure-document.png)、[运行故障](../.tmp/stage4/runtime-failure-document.png) 单列。已人工查看中间帧、手机项目及后备画面，检查的是实际运行页面。

checks.json 的 frames 为逐分位坐标/显隐与反向对比数据，button_frames 为连续浏览器帧采样。原生滚动输入和动画按钮都经过实际操作；截图不是唯一依据，也没有用终点图推断中间过程。

30fps及10fps录屏尝试均因编码积压失败，没有可用录像，不作为成功证据。以上实际过程帧与采样足以复核本阶段几何/状态，但不证明高帧率流畅度。

## 修复与保护

- 红测保存旧首页滚动405px时标题同样上移405px；增强后同位置标题固定。
- 修正重复挂载太阳触发无效重测、减少动态后面板关闭恢复旧坐标、减少动态刷新锚点失效。
- 只读审阅发现增高窗口时原scrollY被浏览器先钳制，已改存最近渲染进度，独立回归无剩余Important。浏览器事件合并时，驱动写入前也检查外部滚动接管。
- 开工已有治理文档diff及未跟踪verification-stage3均保留；未删除已有文件。基线/收尾SHA比较不含.git/.tmp；CNAME、色板、原始参考、艺术字、头像、组件源码/来源、生成器及旧验证保持。
- 开工基线32文件中7个在授权范围内更新，25个内容指纹不变；新增scene.js及本报告。已有未跟踪verification-stage3不算本阶段新建。
- 当前验证不表示用户认可具体视觉。源文件变化后按指纹及影响重验；.tmp不随Git交付，缺失标待重验。

## 尚未验证或本轮不做

实体手机/触控板、Safari/Firefox、桌面浏览器UI的200%/400%缩放、手机真实工具栏展开/收起、持续高帧率表现未独立验证。已测2倍视觉视口及200%等效CSS视口，不能混称为上述全部覆盖。

头像文件/保存/恢复/失败隐私反馈留第五阶段，未实施；第六阶段未启动。无新用户视觉认可，无提交、推送或部署。本阶段完成后停止。
