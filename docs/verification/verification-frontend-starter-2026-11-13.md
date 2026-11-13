# 2026-11-13 前端 Starter 复用包

用户授权选择成熟的前端复用方式并实际打包。采用 [HTML5 Boilerplate](https://github.com/h5bp/html5-boilerplate) 的 Starter ZIP 思路，参考 [GitHub 模板仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template) 的独立目录复制方式。未下载其界面替换现站，仅采用分发方式。

交付为 `dist/linetop-frontend-starter.zip`，65个文件、978,529字节（约956 KiB），SHA-256为 `a766d282d698ce6d00346a0a71caf95974ca92a01820d485f33933524671ff64`。可用 `python scripts/export-frontend.py` 重建；现有 ZIP 默认拒绝覆盖，明确 `--force` 才替换；相同内容重复导出直接保持现有文件。模板资料在 templates/frontend，既有 public 未编辑。

## 检查范围

- `python tests/test-frontend-export.py`：3项合同测试通过，覆盖ZIP完整性、65文件、逐文件SHA-256、页面资源/文档链接/指纹、原域名/历史/日志排除、自定义存储前缀、非法参数、拒绝误覆盖、相同输入重复生成字节一致，以及禁止把导出结果写入现站public。
- 解压后的新目录实际运行 build-map-page.py 与两份 Node 检查，证明资源和脚本不依赖原项目目录。8配色×2模式及192对比度，地图239/34/51/47及缓存/重试等通过。
- 组件页实际浏览器11项：真实按钮/卡片/头像、ID唯一、桌面/手机无横溢出、主题/配色保存及刷新恢复、移动侧栏隔离/Escape、真实地图入口加载。
- 包内浏览器脚本的QA副本仅将本地测试地址8765改为8767，避免误测原站；被测资源来自独立解压目录。地图浏览器319项通过、运行异常0；主题 `--quick` 22项通过。本轮未运行主题完整逐场景矩阵。

证据位于 `artifacts/qa/frontend-starter-2026-11-13/`：component-checks.json、maps-browser/browser-results.json、themes-browser/browser-quick-results.json、桌面/手机真实截图；运行日志位于 artifacts/logs。原public开工指纹在 public-before.json，收尾 source-protection.json 证明51份原站前端文件均保持原字节。

本轮单Agent实施与自查，没有独立Agent审查。工作期间重新出现的 docs/推送教程.txt（741字节）与原迁移后 docs/guides/推送教程.txt（725字节）均未编辑、未打包，指纹记录在 protected-external-files.json。既有目录迁移状态保留，暂存区为空。

## 使用边界

这是源代码 Starter，保留原站品牌SVG、示例身份/头像和内容，供新项目替换；完整CSS和DOM脚本有现有耦合，局部移植方法在COMPONENTS.md，不承诺无改动嵌入所有框架或多实例组件库。包的更新是独立副本，不自动同步原站。地图上游原文件和历史截图未包含，但生成的数据、来源和已有许可记录保留。

实体设备、其他浏览器、所有框架的移植、线上部署与公开开源许可未验证/未操作。本次没有提交、推送、部署或远程模板仓库操作。
