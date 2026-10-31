# LineTop

`linetop.top` 的个人主页。当前为白色视觉方向首版原型，沿用静态 HTML / CSS / JavaScript，无安装依赖、远程字体或构建步骤。

最新产品方向以第二阶段用户要求为准，阶段分工以第六阶段明确授权为准；具体艺术字、尺寸和视觉细节仍待用户反馈，实现完成或验证通过不表示用户认可。

第四阶段已完成：保留第三阶段 SVG 艺术字、侧栏及轻面板，实现原生滚动驱动的 sticky 舞台、原位交叉显隐、单太阳接力与统一导航。减少动态、内容溢出或短屏时恢复自然文档；第五阶段已完成本地头像选择、未保存预览、保存/刷新恢复与恢复默认；仅当前浏览器，不上传、不跨设备或访客同步。

桌面缩放故障已修复：Chrome同一窗口真实75%、90%、100%、110%、125%、150%已验证，200%空间不足时保留可读后备。最新结果与过程帧见 [缩放修复验证](docs/verification-stage4-zoom-fix.md)，原第四阶段记录保留为历史。

## 协作入口与文档职责

后续 Agent 固定阅读顺序：**AGENTS → PROJECT_CONSTRAINTS → WORK_STATUS → 其中指定的当前设计说明 → 对应验证记录 → 本 README 与任务相关源码/资料**。

- [AGENTS.md](AGENTS.md)：开工入口，规定修改保护、阶段边界和协作规则；不支持自动发现它的工具，需要在开工提示中明确要求读取。
- [PROJECT_CONSTRAINTS.md](docs/PROJECT_CONSTRAINTS.md)：长期产品约束的唯一正式来源，区分用户硬性要求和当前实现选择。
- [WORK_STATUS.md](docs/WORK_STATUS.md)：当前目标、授权、待确认状态、工作区修改和验证证据时效；从这里取得唯一当前设计路径。
- 唯一当前设计入口为 [根目录 design.md](design.md)，区分第三至第五阶段实施候选、第六阶段验收结果与待用户视觉确认，不代表后续阶段已授权。
- [第三阶段验证记录](docs/verification-stage3.md)：61 项实际断言、源码指纹、截图、待人工检查与未验证边界。
- [第四阶段验证记录](docs/verification-stage4.md)：历史转场过程帧、共享进度/导航/后备检查及源码指纹。
- [第六阶段整体验收](docs/verification-stage6.md)：当前源码重验、要求对照、两处局部修复、过程帧与未验证项。
- [第五阶段验证记录](docs/verification-stage5.md)：当前设置/头像74项、截图、存储边界与未验证事项。
- [design-v1.md](docs/design-v1.md) 保留为既有页面的历史实现说明，[verification-v1.md](docs/verification-v1.md) 保留为对应历史验证；不作为新提案已实现/通过的证据。代码变化后按影响范围重新验证。

## 本地运行与实现入口

在本目录启动：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

浏览器打开 <http://127.0.0.1:8765/>。`index.html` 也可直接打开；本地服务器更适合测试偏好存储与资源加载。

- [当前设计、阶段 3—6 范围与待验收清单](design.md)
- [历史实现与真实组件来源](docs/design-v1.md)
- [当前整体验收与截图入口](docs/verification-stage6.md)
- 页面：`index.html`；布局：`assets/style.css`；侧栏/面板/偏好：`assets/main.js`；滚动舞台、太阳和导航进度：`assets/scene.js`；本地头像文件处理/IndexedDB：`assets/avatar.js`。艺术字与默认头像为本地 SVG，未改造型。
- 本地 Uiverse 源码快照和 SHA-256：`assets/uiverse/`。`components.css` 是页面实际加载的组件代码。
- 重新提取组件：`python scripts/build_components.py`（读取本地资料，会更新生成 CSS、来源清单、快照及三个 HTML 插槽；本阶段已检查但未运行，无必要不要执行）。
- `.tmp/` 保存旧首页备份、截图、录屏和验证原始记录，被 Git 忽略。原始备份为 `.tmp/index.before.html`。

第四阶段历史过程帧与受测指纹位于 `.tmp/stage4/`（Git 忽略），[过程帧查看器](.tmp/stage4/process.html) 可在本地打开；缺失时标待重验。历史静态截图保留于 stage3。修改 CSS/JS 后须同步 index 的资源内容指纹，避免缓存错配。

第六阶段整体验收完成后停止，等待反馈；没有安装依赖或新增提交、推送、部署、DNS 操作，全部既有修改保留；`CNAME` 仍为 `linetop.top`。

## 本地头像与设置

从侧栏“设置”或头像入口打开。选择静态 PNG/JPEG/WebP（≤5 MiB）后仅生成未保存预览；点击“保存头像”且本地事务成功后才更新侧栏。可取消预览或恢复默认。图片会中央裁方、缩小至最大512×512并重新编码，不保存原图。

头像存于当前浏览器同源 IndexedDB（linetop-personal / avatars / current）；减少动态偏好存于localStorage，系统偏好优先。本地测试地址与线上域名不共享；换浏览器/设备、隐私窗口或清除站点数据可能回默认。不会上传服务器，其他访客不会看到自己的替换头像。建议经上述HTTP服务使用，file://持久化不保证。

本轮截图与指纹在 `.tmp/stage5/`（Git忽略），详见[验证记录](docs/verification-stage5.md)。没有真实用户照片进入项目或证据；所有上传验证使用隔离合成图片。

## 当前整体验收

第六阶段已对现有成果重新验收；产品仅修复静态后备太阳事件穿透和标题焦点框对比度，并同步CSS指纹，保留视觉方向/转场语言。覆盖320/375/768/1024/1440宽、手机横屏及浏览器原生200%缩放；设备模拟、故障注入和实体未测项分别记录。

打开[过程帧查看器](.tmp/stage6/process.html)或 <http://127.0.0.1:8765/.tmp/stage6/process.html> 查看实际截图；本轮目录 `.tmp/stage6/` 与[验收报告](docs/verification-stage6.md)包含受测文件指纹和时间环境。截图序列不代表高帧率流畅度；用户视觉确认、实体设备/其他浏览器等剩余项见报告。未提交、推送、部署或修改DNS。
