# LineTop 首版视觉原型

本轮只证明白色个人主页的视觉方向与关键交互，不作为正式内容版。保持静态 HTML/CSS/JavaScript，不提交、推送或部署，CNAME 保持 linetop.top。

## 视觉决定

- 白色为画布；#12354F 是文字和必要线条的深蓝墨色。主强调是 #D9FF00，薄荷绿 #4FFFC4 用于学习状态，天蓝色 #31A9FF 用于少量线框与图形。小字不使用浅彩色。
- 大字、实心与描边对比、不对称留白。欢迎屏完整占一个视口，正文从个人展示开始。系统字体，无远程字体依赖。
- 顺序：欢迎 → 个人展示 → 关于 → 两个明确标记状态的项目占位 → 页脚。仅保留真实 GitHub 入口。

## 一个主要滚动转场

沿用原生滚动，一段约 0.95 个欢迎屏高度的共享进度连接三个对象：欢迎大字向左上退出；个人展示文案逐渐回到正常位置；黄绿色图形沿连续轨迹从欢迎区域进入个人展示线框，旋转并放大。向上滚动时沿原路还原。无滚轮劫持、无强制分页、无额外空白滚动轨道。

其他区域仅有按钮翻字、导航滑块、卡片双层缩进及 GitHub 填充悬停。导航放在个人展示区之前，使用 sticky，父容器一直包含页脚。

## 实际组件复用

源文件：根目录 `Uiverse收藏UI组件与源码整理.md`。运行 `python scripts/build_components.py` 可重新提取，保留作者注释、原始 HTML/CSS 和 SHA-256（`assets/uiverse/sources.json`）。页面实际加载生成的 `components.css`。

| 条目 | 作者 / 来源 | 改造与保留机制 |
| --- | --- | --- |
| 7 | doniaskima / happy-turtle-32 | 原始 original + letters 双层结构、奇偶字符相向进入、延迟；按钮改为向下探索锚点，扩展键盘 focus |
| 4 | Pradeepsaranbishnoi / heavy-dragonfly-92 | 保留 tabs/tab/glider 的绝对滑块与 translateX 百分比切换；移除演示 radio、数字，替换为关于/项目链接和原生设置 details |
| 18 | Tiagoadag / cuddly-catfish-6 | 保留 card/card2 双层结构与 scale(.98)；移除紫绿渐变、发光、固定尺寸，采用白色内容与色板底层 |
| 20 | wilsondesouza / brave-earwig-75 | 保留 GitHub 的原始 SVG、filled 自底向上填充及 tooltip；只留下 linefantasy 的真实链接 |
| 3 | andrew-manzyk / ancient-turtle-91 | 保留 rect/polyline 的 stroke-dasharray 勾选机制；调整深色、命名、焦点可见性与真实偏好持久化 |

所有组件类名使用 lt- 前缀，input id/name 独立；原作者注释和来源保留。原始快照包含演示原文，但不被加载到网站，页面没有演示账号或假链接。

## 退化策略

默认内容全部可读。只有初始化测量与渲染成功才开启 motion-ready。无 JavaScript 或脚本无法加载时，页面是静态文档，导航/锚点/details/GitHub 继续可用；设置复选框禁用并解释原因。尊重 prefers-reduced-motion，系统减少动态优先；用户开关存储失败也只影响跨访问记忆。

## 参考观察边界

- [JIEJOE 参考视频](https://www.bilibili.com/video/BV1hYceeGEuq/) 在浏览器可打开并观察开头画面，大字号实心/描边与绿黑对比可见；有登录/试看提示，不宣称已完整观看。
- [JIEJOE 网站](https://www.jiejoe.com/home) 读取工具仅取到标题，实际浏览器与直连 HTTPS 均连接失败，不能声称实测了其线上滚动交互。
- 根目录的《3招拯救Vibecoding丑设计》总结指向 BV1VpEm6BEmd，是另一支视频。只借用真实截图评审的方法，不混为本次视频转写。

实际运行截图与滚动过程、响应式/无脚本/减少动态/对比度证据写入本轮 verification 文档。
