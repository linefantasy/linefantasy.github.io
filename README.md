# LineTop

`linetop.top` 的个人主页，静态HTML/CSS/JavaScript，无安装依赖、远程字体或构建步骤。

当前支持固定根目录头像、浅色/深色主题、右下齿轮显示设置，以及欢迎、个人展示、关于、项目、故事、喜好、工具、页脚八个场景。两种主题全场景使用22°黄绿条带：桌面欢迎贯穿、手机局部裁切。沿用艺术字、原位交叉显隐和单太阳接力；空间不足/减少动态/脚本失败时恢复完整自然文档。实现和验证不等于用户视觉认可。

## 协作入口

阅读顺序：**[AGENTS](AGENTS.md) → [长期约束](docs/PROJECT_CONSTRAINTS.md) → [当前交接](docs/WORK_STATUS.md) → [唯一当前design.md](design.md) → 对应验证记录 → 任务相关源码**。本轮最新验证为 [视觉与导航报告](docs/verification-visual-nav-2026-11-01.md)，旧记录仅证明历史版本。

## 本地运行

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8765/>。右下齿轮可hover/键盘聚焦展开，触屏点击展开；主题与动态按钮有随状态变化的提示。Escape或点击外部收起。初次浅色，深色主背景#000000，选择只保存于当前浏览器当前站点；存储不可用时本次仍可操作。系统减少动态优先。侧栏顺序为探索、关于、项目、故事、喜好、工具；line返回首页。

头像固定引用根目录 [头像1.jpg](头像1.jpg)，保留头像框和加载失败默认图；不再提供修改头像，不读或删除旧本地头像数据库。日后换图可替换此项目文件，保留路径；没有后台或上传接口。

故事/喜好/工具为真实页面锚点，不开浮窗。故事待整理，喜好仅已有健身/游戏事实，工具筹备中；没有虚构成果或假链接。

## 实现入口

- `index.html`：语义内容、唯一侧栏、舞台壳和全局齿轮。
- `assets/style.css`：原浅色样式、语义主题角色、深色覆盖、响应式及齿轮交互样式。
- `assets/main.js`：侧栏/焦点/固定头像与艺术字加载后备。
- `assets/scene.js`：八场景共享滚动进度、太阳、路由/历史、fit和自然文档后备。
- `assets/theme-init.js`：样式前恢复主题；`assets/preferences.js`：主题、动态偏好与工具栏行为。
- `assets/linetop-wordmark.svg`：原浅色字形；`assets/linetop-wordmark-dark.svg`：同路径同辅色的浅骨架版本。
- `assets/uiverse/`：原源码快照及SHA清单；条目4/7/18/20仍实际使用，齿轮按钮复用20，条目3复选框已退役但归档保留。
- `scripts/build_components.py`：会写快照/CSS/清单和探索/GitHub两个插槽；无必要不要运行。本轮仅在临时沙盒验证，不重生成正式资源。修改CSS/JS后同步index资源内容指纹。

## 本轮验证

[新验证报告](docs/verification-visual-nav-2026-11-01.md)记录全场景背景、字色、侧栏顺序、过程帧、两主题原生页面缩放及未测项。最终截图与原始记录位于Git忽略的 `.tmp/visual-nav-2026-11-01/unified/`，可打开[截图查看器](.tmp/visual-nav-2026-11-01/unified/process.html)，或访问 <http://127.0.0.1:8765/.tmp/visual-nav-2026-11-01/unified/process.html>；缺失时标为待重验，不用旧证据冒充。

[2026-11-01早期功能验证](docs/verification-2026-11-01.md)及`.tmp/nov1/`保留为历史。本轮最初的“浅色完全不变”检查已被最新授权修改浅色背景替代，不作为最终结论。

[第六阶段](docs/verification-stage6.md)、[第五阶段](docs/verification-stage5.md)、[缩放修复](docs/verification-stage4-zoom-fix.md)、[第四阶段](docs/verification-stage4.md)、[第三阶段](docs/verification-stage3.md)及[旧设计](docs/design-v1.md)均保留为历史。实体设备、其他浏览器、高帧率和用户视觉确认不由截图或自动检查替代。

最新补充已去掉侧栏外缘黑线，用户已授权将本轮改动提交推送；远端状态按Git核对，交接见WORK_STATUS。未安装依赖或额外操作部署/DNS，CNAME保持linetop.top。
