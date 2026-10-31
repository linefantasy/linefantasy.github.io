# 第五阶段验证：设置面板与本地头像

受测时间：2026-10-31（北京时间，最终重跑至19:13）。本轮只实施用户授权的第五阶段，未进入第六阶段，未提交、推送、部署或安装依赖。实现/验证不代表用户视觉认可。

## 对应版本、环境和证据

- 实际浏览器：Windows HeadlessChrome156.0.0.0，agent-browser隔离会话 linetop-stage5，URL http://127.0.0.1:8765/ 。DPR1；CSS视口1440×900、768×1024、375×812。手机是模拟布局，未用viewport/DPR冒称真实浏览器缩放或实体设备。
- [受测文件SHA-256与环境](../.tmp/stage5/fingerprints.json)、[74项逐项结果](../.tmp/stage5/checks.json)、[开工基线](../.tmp/stage5/baseline.json)、[最终保护对比](../.tmp/stage5/scope-check.json)。最终74项全部通过；新一轮文件变化后不能无条件沿用此记录。
- [桌面未保存预览](../.tmp/stage5/desktop-preview.png)、[桌面保存后](../.tmp/stage5/desktop-saved.png)、[配额失败](../.tmp/stage5/quota-failure.png)、[768预览](../.tmp/stage5/768-preview.png)、[375预览](../.tmp/stage5/375-preview.png)、[手机面板滚动](../.tmp/stage5/mobile-settings-scrolled.png)、[损坏存储](../.tmp/stage5/corrupt-storage.png)、[无脚本后备](../.tmp/stage5/no-js.png)。主Agent已实际查看桌面、375及滚动/后备图：未保存与已保存状态清楚，操作在屏内，长面板独立滚动，滚动标题没有穿透文字。
- 测试脚本与合成图片在 `.tmp/stage5/`，被Git忽略；缺失应标待重验。所有图片为隔离生成的渐变/棋盘格等fixture，没有真实用户照片，没有下载他人照片。

## 实际能力与结果

| 范围 | 实际检查与结果 |
| --- | --- |
| 上传/保存/恢复 | 原生file input实际选择本地PNG、JPEG、WebP，完成浏览器解码、中央裁方重编码；预览最大512，侧栏保存前不变，实际IndexedDB事务成功后才更新，刷新恢复；恢复默认删除后刷新仍默认 |
| 数据约束 | 实际读取记录仅version/blob；输出≤300 KiB，小图不放大；源文件≤5 MiB、≥32×32、单边≤8192、≤1600万像素。错magic、文件头成立但解码损坏、超大字节、过小/超边长、动画PNG、SVG均拒绝且旧头像不变 |
| 并发/资源 | 两次连续选择、旧解码延迟、新图先完成，最终仅最新图有效；取消预览/切面板/关闭不发布旧结果；Bitmap.close和ObjectURL回收有运行观测。显示载入错误回默认并释放URL，本地记录不被静默删除 |
| 存储故障 | 用隔离原型/新文档注入SecurityError、QuotaExceededError、真实事务abort、delete失败；此前持久头像保留，错误中文可读，不假报成功；实际写入损坏Blob再刷新能回默认，恢复默认不删localStorage哨兵 |
| 隐私 | CDP Network监测实际文件选择+保存期间，HTTP请求为0；无服务器上传路径。记录不含原文件名/路径或原图。UI明确仅当前浏览器、不跨设备/访客同步 |
| 面板/键盘 | 桌面保持既有非模态；768/375为同一dialog模态且在视口内。Enter保存、Escape关闭、桌面头像/设置返回原触发器，手机回菜单；Tab和Shift+Tab循环。长面板焦点到减少动态时滚面板，不移动背景页面 |
| 减少动态 | 系统偏好优先（系统开启时勾选禁用）；用户选择本地持久化、刷新恢复；关于区切换到文档/再启用保留关于上下文 |
| 入口完整 | 实际点击项目/#projects、探索/#personal、关于/#about可到对应场景；line名字回首页。故事/喜好/设置真实面板，故事待整理，喜好只有健身/游戏；六项类型正确，没有新增假链接 |
| 布局/转场关联 | 保存前后sidebar宽与太阳B终点DOMRect完全一致；scene.js与开工基线字节一致。未改变艺术字、太阳造型、侧栏结构或核心转场语言 |
| 退化/无障碍 | 真实关闭JS并刷新：默认头像、禁用文件控件/说明，欢迎/个人/关于/项目/页脚均有正高度且非透明/inert；重新启用正常。axe4.12.1：0确定违规、39通过、3类待人工，不宣称无障碍全通过；完整待人工数据在checks.json |

## 实测发现与修正

1. 显示头像载入失败后遗留有效Blob URL；修正为回默认并释放不再展示URL，明确本地记录未更改。对应回归通过。
2. 缓存页面恢复时旧未保存预览可能残留；修正任务代次、读取代次、预览DOM与URL所有权。延迟解码跨pagehide/pageshow、保存事务中恢复均通过生命周期夹具。初始失败证据 [lifecycle-red.json](../.tmp/stage5/lifecycle-red.json) 保留。
3. 375模态面板末项Tab会落到body；增加仅模态面板的正反焦点循环，后续正/反Tab通过。长面板标题增加不透明sticky覆盖，关闭一直可达。
4. native文件input的cancel事件会冒泡到dialog，原cancel监听误关面板；限定仅dialog自身cancel关闭。取消事件夹具通过，未冒称OS文件对话框交互已测。

按requesting-code-review技能只读复核上述生命周期、资源和最终焦点/标题改动，剩余Critical/Important为0。主Agent唯一编辑、集成；审阅不等于用户确认。

## 文件范围与保护

- 修改：index.html、assets/main.js、assets/style.css；新增assets/avatar.js。main仅面板通知、文件取消区分与手机模态焦点循环；style仅头像/设置局部样式。
- 同步：design.md、docs/PROJECT_CONSTRAINTS.md、docs/WORK_STATUS.md、README.md；新增本文。
- 开工已有7个tracked diff和未跟踪scene.js/第三、四阶段报告全部保留。scene.js、CNAME linetop.top、艺术字/默认头像、色板/原始资料、Uiverse快照/作者来源/生成器、历史验证按基线核对。生成器检查后未运行，三个原始HTML插槽不改。
- node --check（avatar/main）及git diff --check通过，暂存区空，HEAD未变；具体SHA、变更/新建列表见scope-check.json。未执行提交/推送/部署。

## 本地保存边界与未验证项

头像存于同一浏览器配置、同一origin的IndexedDB `linetop-personal` v1 / `avatars` / `current`，仅处理后Blob。减少动态沿用localStorage；恢复默认只删头像。127.0.0.1与linetop.top不共享，协议/端口/浏览器/设备改变不共享。隐私窗口、清理站点数据或浏览器回收可能回默认；file://持久化不保证。没有云备份；同源脚本/能使用浏览器的人仍可能访问，本地库不是加密保险箱。

未验证：实体手机/触控板、其他浏览器；OS文件选择器真实取消（仅cancel事件fixture）；真实磁盘/站点配额耗尽（注入异常验证）；实际浏览器BFCache命中/淘汰（仅真实浏览器内生命周期夹具）；多标签同时保存和存储回收；400%及高帧率性能。第四阶段真实缩放矩阵/完整转场过程未重跑，不能以旧147/99项自动证明本轮全站。上述不影响当前阶段已完成范围，整体验收仍需第六阶段新授权。

本轮交付后停止。本地查看：http://127.0.0.1:8765/ ，未运行时按README启动服务。
