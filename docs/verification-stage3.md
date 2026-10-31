# LineTop 第三阶段验证

2026-10-31，北京时间。实际运行本地 Chromium / agent-browser 独立会话，页面 <http://127.0.0.1:8765/>。没有安装依赖；中断后重新启动 Python 服务。当前设计 [design.md](../design.md)，交接 [WORK_STATUS](WORK_STATUS.md)。

范围为静态视觉、语义与导航结构；艺术字及构图为待用户反馈的实现候选。本报告不证明第四阶段完整转场或第五阶段头像保存已完成。

## 文件与实现

产品改造：index.html、assets/style.css、assets/main.js；新本地 assets/linetop-wordmark.svg、assets/avatar-default.svg。文档同步 README、design、PROJECT_CONSTRAINTS、WORK_STATUS 和本报告。续接时这些产品文件已存在且 Git 干净，本次收尾没有再次改产品代码。

艺术字采用真实路径、字腔、切角与嵌色，不依赖普通字体换色或远程字体。Top 天蓝主体、薄荷 o 嵌色和黄绿 p 足实际可见；h1 可访问名称 LineTop。

## 实际运行结果

重新执行 `.tmp/stage3/verify.py`、extras.py、modal-check.py，由 finalize.py 归并为 **61 项断言，0 失败**。明细见 [checks.json](../.tmp/stage3/checks.json)，实际时间以 verified_at 为准；其中 SHA-256 绑定 index、style、main、字形、默认头像、组件 CSS、生成器、CNAME 的受测字节。后续源码变化须按影响重验。

| 范围 | 结果与证据边界 |
| --- | --- |
| 1440×900 | 艺术字完整，侧栏避让主内容，太阳可见，无横向溢出；真实栏目与三面板可用 |
| 768×1024、375×812、320×740 | 标题完整、无横向溢出；同一侧栏折为抽屉；焦点循环/恢复、设置面板不越界 |
| 文案/结构 | 精确欢迎及身份、指定删除项、六入口、无假锚点、一个太阳及两个锚点均检查 |
| 键盘/导航 | Enter 开故事、Escape 返回焦点；抽屉 Tab 循环；真实链接关闭菜单并解除 inert；glider 跟随当前链接 |
| 手机模态回归 | 开设置时根节点禁止背景滚动，关闭回到原 scrollY；审阅发现后修复并重验 |
| 实际组件反馈 | 双层卡 hover 缩放、GitHub 底色填充、checkbox 键盘切换已实际执行检查 |
| 真正禁用 JS | 浏览器禁脚本重载后正文可读、真实链接及太阳仍在、没有 inert 残留；不可用面板有后备说明 |
| 减少动态 | 实际模拟系统偏好，设置遵循系统且内容可读 |
| 头像边界 | 没有文件输入，更换按钮禁用，不显示虚假成功 |
| 正常运行错误 | 当前正常会话无页面错误；资源故障隔离会话不混入该结论 |

axe-core：**0 确定违规、35 通过规则、2 类需人工检查**。待人工项 aria-valid-attr-value（关闭/隐藏面板的关联）与 color-contrast（描边、下划线、复合背景）。已验证所有 aria-controls 目标实际存在、面板可以打开；不据此宣称完整无障碍通过。完整扫描数据在 checks.json。

另在隔离会话仅修改浏览器 DOM 请求不存在的 SVG，确认显示 LineTop. 文字后备、h1 名称保留且侧栏完整绘制。已实际查看 [资源失败截图](../.tmp/stage3/wordmark-resource-fallback.png)，不增加 61 项计数。

## 实际截图

- [桌面首屏 1440×900](../.tmp/stage3/desktop-1440-welcome.png)
- [平板首屏 768×1024](../.tmp/stage3/width-768-welcome.png)
- [手机首屏 375×812](../.tmp/stage3/width-375-welcome.png)、[抽屉](../.tmp/stage3/width-375-menu.png)、[设置](../.tmp/stage3/width-375-settings.png)
- [320px 补查](../.tmp/stage3/width-320-welcome.png)
- [个人展示](../.tmp/stage3/desktop-personal.png)、[关于](../.tmp/stage3/desktop-about.png)、[项目](../.tmp/stage3/desktop-projects.png)、[页脚](../.tmp/stage3/desktop-footer.png)
- [故事](../.tmp/stage3/desktop-story.png)、[喜好](../.tmp/stage3/desktop-likes.png)、[桌面设置](../.tmp/stage3/desktop-settings.png)
- [无 JS 首屏](../.tmp/stage3/no-javascript-welcome.png)、[无 JS 个人区](../.tmp/stage3/no-javascript-personal.png)、[减少动态](../.tmp/stage3/reduced-motion-welcome.png)

以上来自真实运行页面，已查看桌面/平板/手机主构图、手机抽屉与资源失败画面。微交互通过真实 hover/键盘及计算状态检查；完整滚动转场未实施，没有相关过程验证结论。

## 生成关系与保护证据

未运行 scripts/build_components.py。它会写组件 CSS、来源清单、原始快照及 index 三个插槽；页面纵栏适配在独立 style/main 中。explore、checkbox、github 三槽与 `.tmp/stage3/index.before.html` 一致；原太阳 path 一致；作者注释/来源保留。#4 使用真实 glider 纵向适配，#18 保留双层结构。

续接 HEAD `06349b0`，暂存区空；已有提交保留。其他 27 个受跟踪文件按 Git 路径过滤后与 HEAD 一致；Windows CRLF checkout 不直接与 Git LF blob 作字节比较，实际受测字节另存 SHA-256。[scope-check.json](../.tmp/stage3/scope-check.json) 可复核。续接只修改四份既有文档、新增本报告及隔离证据；未改 CNAME、原始资料、生成器或历史验证，未提交/推送/部署。

中断前内存全文件快照不可取回，不虚报重新完成该快照的逐文件比较；保护检查以可复核 Git 状态、保存的旧 HTML 和本次指纹为准。

收尾检查：49 处本地文档链接/锚点有效，受测源指纹仍匹配，本地 HTTP 200，暂存区为空，node --check 与 git diff --check 通过。Git 的 LF/CRLF 提示属于现有 Windows checkout 规则，没有据此重写产品文件。

## 未完成或未验证

- 第四阶段 sticky 舞台、文字原位显隐、按钮统一驱动与太阳接力未实施；当前探索为自然锚点，太阳静置欢迎区。
- 第五阶段头像文件校验、保存/刷新恢复/默认恢复及失败反馈未实施。
- 实体设备/触控板、Safari/Firefox、高倍缩放、手机工具栏变化、新舞台快速/反向/中断过程、高帧率流畅度未验证。
- axe 人工项与具体艺术字认可仍待处理；故事缺素材，保持待整理。
- .tmp 不随 Git 交付，缺失标待重验；verification-v1 只对应历史版本。

本地运行方式见 [README](../README.md)。本阶段结束，等待用户反馈。
