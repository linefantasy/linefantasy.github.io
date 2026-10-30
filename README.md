# LineTop

`linetop.top` 的个人主页。当前为白色视觉方向首版原型，沿用静态 HTML / CSS / JavaScript，无安装依赖、远程字体或构建步骤。

最新产品方向以第二阶段用户明确要求为准；尚未展示的艺术字候选、尺寸和细节仍待反馈，实现完成或验证通过不表示用户已认可。

当前工作为阶段 2 设计修订：[design.md](design.md) 是唯一当前方案，已纳入最新艺术字、原位转场、纵向侧栏和本地头像要求。具体候选/尺寸仍待展示与反馈，现有页面尚未据此调整。

## 协作入口与文档职责

后续 Agent 固定阅读顺序：**AGENTS → PROJECT_CONSTRAINTS → WORK_STATUS → 其中指定的当前设计说明 → 对应验证记录 → 本 README 与任务相关源码/资料**。

- [AGENTS.md](AGENTS.md)：开工入口，规定修改保护、阶段边界和协作规则；不支持自动发现它的工具，需要在开工提示中明确要求读取。
- [PROJECT_CONSTRAINTS.md](docs/PROJECT_CONSTRAINTS.md)：长期产品约束的唯一正式来源，区分用户硬性要求和当前实现选择。
- [WORK_STATUS.md](docs/WORK_STATUS.md)：当前目标、授权、待确认状态、工作区修改和验证证据时效；从这里取得唯一当前设计路径。
- 唯一当前设计入口为 [根目录 design.md](design.md)，状态为阶段 2 修订提案、未实现；含冲突处理和第三至第六阶段建议范围/验收，不代表后续阶段已授权。
- [design-v1.md](docs/design-v1.md) 保留为既有页面的历史实现说明，[verification-v1.md](docs/verification-v1.md) 保留为对应历史验证；不作为新提案已实现/通过的证据。代码变化后按影响范围重新验证。

## 本地运行与实现入口

在本目录启动：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

浏览器打开 <http://127.0.0.1:8765/>。`index.html` 也可直接打开；本地服务器更适合测试偏好存储与资源加载。

- [阶段 2 修订方案、阶段 3—6 范围与待验收清单](design.md)
- [历史实现与真实组件来源](docs/design-v1.md)
- [验证结果与待确认内容](docs/verification-v1.md)
- 页面：`index.html`；布局与颜色：`assets/style.css`；单段滚动转场与偏好：`assets/main.js`。
- 本地 Uiverse 源码快照和 SHA-256：`assets/uiverse/`。`components.css` 是页面实际加载的组件代码。
- 重新提取组件：`python scripts/build_components.py`（读取根目录组件整理，不联网；会更新生成 CSS 和三个 HTML 插槽）。
- `.tmp/` 保存旧首页备份、截图、录屏和验证原始记录，被 Git 忽略。原始备份为 `.tmp/index.before.html`。

既有原型仅在本地制作与验证；本轮阶段 2 只修订设计与交接文档，不重复资料研究，不修改页面代码、不安装依赖、不提交、推送或部署；`CNAME` 保留 `linetop.top`。后续具体阶段等待新指令；本地预览仍是旧原型。
