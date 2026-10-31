# LineTop 第四阶段：桌面缩放故障修复验证

2026-10-31，北京时间。仅修复动效适配及其导航联动，保留第三阶段视觉与全部内容，不进入第五阶段。当前设计仍为 [design.md](../design.md)，交接见 [WORK_STATUS](WORK_STATUS.md)。

## 根因：触发条件 → 代码 → 运行证据

修复前在同一Chrome桌面窗口比较75%和100%，再覆盖其他倍率；不是仅凭断点猜测。

| 触发条件 | 相关实现 | 运行证据 |
| --- | --- | --- |
| 100%：CSS视口约1348×694，项目区原布局需要约798px高 | scene.js 的全场景 `scrollHeight <= H+2` 检查；任一场景失败就 fallback('content-overflow') | 欢迎/个人均可容纳，但项目溢出约104px导致整页静态；75% CSS1798×926可完整容纳，模式scene |
| 90%：CSS1498×771，项目需要约811px | 同上 | 模式document、原因content-overflow |
| 110/125/150%：CSS高度631/555/463 | 旧 `H < 640` 在尝试适配前直接退出 | 原因small-viewport；并非电脑类型或倍率本身不支持动效 |
| 高频连续导航 | 旧updateEntry每渲染帧replaceState | 实测226次写入，其中33次未生效；画面projects但URL/history停about。没有抛出页面异常，所以仅查错误日志发现不了 |
| 150%触发折叠导航，关闭菜单改变根滚动条与几何 | 重测取消刚开始的driver | 复现stage宽889→899→889，点击项目后仍停personal；需保留布局重测时的导航目标 |

现有太阳端点均使用stage局部CSS像素；本轮证据未发现屏幕/文档/transform坐标混用是主因。原生页面缩放中visualViewport.scale始终1；没有将DPR当作产品启用条件或倍率补偿。

[before.json](../.tmp/zoom-fix/before.json) 保存各倍率、DPR、视口、模式和具体溢出元素。修复前隔离副本位于 `.tmp/zoom-fix/before-site/`，其index/style/scene字节指纹与开工baseline完全一致；用于重新保存可复核的旧版截图，没有回滚正式文件。

## 修复范围

- assets/scene.js：安全高度下限从640改为420 CSS px；先测原布局，仅真实溢出的场景收紧留白及装饰，必要时仅隐藏aria-hidden项目示意图；最终fit检查保留，正文仍放不下就自然文档。减少动态、窄屏、真正短屏和故障保护均保留。
- assets/style.css：增强模式的scene-compact/scene-minimal适配及稳定滚动条槽。不缩整页、不使用CSS zoom、不改艺术字、正文/标题字号、配色或侧栏结构。
- scene.js还限制history保存频率至普通同场景约200ms一次，场景变化/完成/离页立即保存；导航push前保存源精确进度。渲染仍逐帧。布局重测后按新几何延续现有目标，不重复push；用户接管和退化仍终止导航。
- index.html只更新style/scene内容指纹。main.js、SVG、色板、组件原始代码/来源、生成器与CNAME均未改。
- 更新design、长期约束/交接、README及本报告；原verification-stage4保留正文，只加历史入口提示。

## 真实缩放方法与环境

Chrome **156.0.8078.79**，Windows，独立测试浏览器配置；同一页面target、同一窗口，外框始终 **1360×788**。100%实测DPR约1.4；不同倍率DPR变化见下表。CSS尺寸采用innerWidth/innerHeight，布局clientWidth另存JSON，避免把滚动条宽度混作溢出。

通过Chrome设置页原生 `settingsPrivate.setDefaultZoom/getDefaultZoom` 调整并回读倍率，同时仅复位本地127.0.0.1的host缩放以便立即作用于当前页；核对实际DPR和CSS视口随之变化。host复位调用来自 [Chromium设置页源码](https://chromium.googlesource.com/chromium/src/+/fe8199a22892ee6528e92b1bf302d26352e4cb4e/chrome/browser/resources/settings/site_settings/site_settings_prefs_browser_proxy.ts)。**未使用setDeviceMetricsOverride、deviceScaleFactor、CSS zoom或整页scale完成此倍率矩阵。** DPR仅用于测试交叉核验，没有写进产品补偿逻辑。

Windows电脑操作工具因无法可靠确认浏览器URL停止，本轮已停止该通道；最终测试通过已确认本地URL的浏览器控制通道完成。临时扩展尝试不是最终验证手段，未为产品安装依赖。用户原有Chrome窗口/配置未用于写入测试。

## 每个倍率的结果

每行均验证：刷新后实际wheel推进；探索连续采样；0/25/50/75/100%标题与个人标题包围盒固定、透明度及太阳中间状态；逆向同进度；太阳终点B对齐；侧栏至项目和太阳退出。所有行通过，整个隔离测试会话的页面异常与控制台消息均为空。

| 真实倍率 | CSS视口约 | DPR约 | 修复前 | 修复后 |
| --- | --- | --- | --- | --- |
| 75% | 1798×926 | 1.05 | scene | scene；全部检查通过 |
| 90% | 1498×771 | 1.26 | content-overflow | scene；全部检查通过 |
| 100% | 1348×694 | 1.40 | content-overflow | scene；全部检查通过 |
| 110% | 1226×631 | 1.54 | small-viewport | scene；全部检查通过 |
| 125% | 1079×555 | 1.75 | small-viewport | scene；全部检查通过 |
| 150% | 899×463 | 2.10 | small-viewport | scene；全部检查通过 |

原生倍率矩阵 **147项断言，0失败**：[after.json](../.tmp/zoom-fix/after.json)。包括中途75%→100%、100%→125%（u保持、透明度连续、重新对齐B），以及真实桌面窗口改到1200×740后恢复的验证。每个倍率都保存了实际窗口ID、外框、CSS视口、DPR、zoom回读、场景密度、逐帧按钮采样与截图。

额外验证：真实200%时CSS约674×347，恢复完整自然文档；模拟系统减少动态与真实长正文fixture同样可读后备。手机/平板另做viewport模拟，**99项回归通过**，与真实桌面缩放明确区分，见 [regression/checks.json](../.tmp/zoom-fix/regression/checks.json)。未覆盖的实体设备不写通过。

历史问题补查：[history-after.json](../.tmp/zoom-fix/history-after.json) 为相同连续转场10次历史写入、0次未写入，画面/URL均projects；[history-precision.json](../.tmp/zoom-fix/history-precision.json) 为快速手滚至u1.10立即跳关于再后退，实际恢复u≈1.10025。只读审阅发现的源历史项精度问题已修复复查，无剩余Critical/Important。

## 修复前后与过程帧

[过程查看器](../.tmp/zoom-fix/process.html)；本地地址 <http://127.0.0.1:8765/.tmp/zoom-fix/process.html>。

- 修复前：[75%](../.tmp/zoom-fix/before-75.png)、[100%](../.tmp/zoom-fix/before-100.png)。模式/溢出以before.json为准，不能只凭欢迎终态图判断动效。
- 修复后100%：[0%](../.tmp/zoom-fix/after-100-000.png)、[25%](../.tmp/zoom-fix/after-100-025.png)、[50%](../.tmp/zoom-fix/after-100-050.png)、[75%](../.tmp/zoom-fix/after-100-075.png)、[100%](../.tmp/zoom-fix/after-100-100.png)。
- 修复后150%：[过程50%](../.tmp/zoom-fix/after-150-050.png)、[接力终点](../.tmp/zoom-fix/after-150-100.png)、[项目与太阳退出](../.tmp/zoom-fix/after-150-projects.png)。
- [中途75→100](../.tmp/zoom-fix/mid-75-to-100.png)、[中途100→125](../.tmp/zoom-fix/mid-100-to-125.png)、[真实200%后备](../.tmp/zoom-fix/native-200-document.png)。

全部六倍率五帧和连续采样在after.json/同目录；已人工查看100%中间帧、150%终点及项目，确认正文可读且太阳不覆盖后续项目。截图蓝色边框是测试键盘焦点，不是新装饰容器。受测源码指纹与范围保护见 `.tmp/zoom-fix/fingerprints.json`、scope-check.json；旧stage3/stage4证据保留。

收尾核对：开工34个正式文件中8个在本轮授权范围内变化，26个原样保留；新增本报告。79处本地文档链接/锚点有效，资源指纹匹配，node语法检查与git diff --check通过，暂存区为空。

## 未验证与停止边界

尚未验证Edge/Firefox/Safari、其他系统显示缩放组合、实体手机/触控板、400%和高帧率性能。手机为375×812/768px等模拟布局；不可称实体设备通过。本轮没有新增可用录像，使用真实过程帧及连续采样，不以终点图或旧124项证明修复。

没有改头像处理、上传或持久化；没有提交、推送、部署。本轮结束，等待用户反馈。
