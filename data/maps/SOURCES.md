# Map Explorer 本地边界数据

## 2026-11-04 修订1交付口径（覆盖下方历史调查状态）

用户最新决定：“先不用管克什米尔以及其他难以实现的了，主要解决港澳台地区属于中国，其他找不到数据就算了，先实现容易实现的”。这撤销此前的实现暂停；困难边界核查暂缓，不再阻塞本次交付。随后用户要求恢复上一版Equal Earth为第一项，并修复海面误命中南极洲。

- 当前世界数据仍来自原固定标签v5.1.2的Natural Earth **50m**，原242要素。生成器将TWN/HKG/MAC的全部同源Polygon/MultiPolygon环追加到CHN，移除这三个独立世界入口，得到**239国家/地区要素**。没有拼接本次调查的10m China POV、手绘国界或删除小岛。中国地图几何/省级目录34个区域全部保持原字节，包括台湾省、香港、澳门。
- 世界第一项/默认Equal Earth（上一版投影），另有等距圆柱与墨卡托；中国/日本仍默认墨卡托，可选等距圆柱；美国固定Albers USA插图。投影只是显示变换，不改变地区归属。
- 南极跨180°、近极点的环保留源顶点、不做平面DP简化：复现发现平面简化令墨卡托裁剪路径错误覆盖海面，而球面面积/点包含仍看似正常。修复保留源几何，没有重新绘制边界；普通环继续0.015°简化与四位小数。派生world.geojson约1.17MB。
- 世界图不再将港澳台作为独立国家/地区选择；旧TWN/HKG/MAC世界链接归到CHN。中国省级图仍可单独查看三个区域。源海岸概化保留，测试使用源几何内部参考点，不把城市附近水域无命中当缺失领土。
- **未完成/明确暂缓**：克什米尔表示、克里米亚/戈兰以及其他争议边界完整归一化、科索沃/北塞浦路斯/索马里兰处理、全部官方标准图对照。它们仍沿用50m源边界；不把本次数据描述为官方标准地图或全部主权归属已验收。SAH与PSX要素仍保留，未将西撒哈拉并入摩洛哥；现有目录类型不作完整外交承认分类认证。
- 许可仍为Natural Earth Public Domain；上游URL、原始SHA256与输出SHA256见manifest，新增normalization记录合并ID和原始数量。统计仍null，照片仍空数组。

复现本次数据：`python scripts/prepare-map-data.py .tmp/maps-stage1 --world-only`（world.geojson为原固定50m输入）；该选项只重新生成世界几何/目录并更新manifest投影配置，不重写其他三图或schema。运行原页面生成器：`python scripts/build-map-page.py`，生成器本身不改。

实际验证及截图见[修订1报告](../../docs/verification-map-revision-1-2026-11-04.md)。下方242行是**实现前来源调查的历史处置清单**，不是当前239要素已完成全部边界认证的证明。

---

## 以下为原来源说明及修订前调查（历史）


数据于2026-11-04获取。运行时只访问本站文件，不调用在线地图服务。
边界（`*.geojson`）仅含geometry/id，名称与未来统计属性位于`../regions/`。
数据集清单、上游原文件SHA256、派生文件SHA256、版本和简化容差见`manifest.json`。

| 地图 | 数据及版本 | 实际要素 | 许可 |
| --- | --- | --- | --- |
| 世界 | [Natural Earth Admin 0 Countries 1:50m](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/)，[v5.1.2 GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson) | 242个国家／地区要素，包含属地，**不是242个主权国家** | [Public Domain](https://www.naturalearthdata.com/about/terms-of-use/) |
| 中国 | [geoBoundaries gbOpen CHN ADM1](https://www.geoboundaries.org/api/current/gbOpen/CHN/ADM1/)，固定提交9469f09；元数据年份2019，来源geoBoundaries/Wikimedia Commons | 34：23省、5自治区、4直辖市、2特别行政区 | 源数据Public Domain；保留geoBoundaries署名 |
| 美国 | [geoBoundaries gbOpen USA ADM1](https://www.geoboundaries.org/api/current/gbOpen/USA/ADM1/)，固定提交9469f09；来源US Census Bureau MAF/TIGER，年份2018 | 从56要素筛出50州＋DC，剔除PR/AS/VI/GU/MP；DC类型为district | 源数据Public Domain；保留Census/geoBoundaries署名 |
| 日本 | [geoBoundaries gbOpen JPN ADM1](https://www.geoboundaries.org/api/current/gbOpen/JPN/ADM1/)，固定提交9469f09；来源OpenStreetMap/Wambacher，年份2017 | 47个都道府县，**非本轮直接获取的日本官方数据** | © OpenStreetMap contributors / Wambacher；[ODbL 1.0](sources/ODbL-1.0.txt) |

原始ADM1元数据在`sources/*-metadata.json`。geoBoundaries文件存储使用Git LFS，实际几何从`https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/{ISO}/ADM1/geoBoundaries-{ISO}-ADM1_simplified.geojson`获取，不能将131字节的LFS指针当作地图。

## 处理与边界口径

- 保留上游所有所选Polygon/MultiPolygon及小岛，不凭空绘制边界。对已经概化的边界进一步执行小容差Douglas-Peucker简化、四位小数坐标量化，并统一为D3的球面环方向。容差：世界0.015°、中国0.003°、美国0.012°、日本0.005°。相邻区域独立简化，不宣称测绘级拓扑精度；视觉探索不用于导航或精确测量。
- 世界使用Natural Earth源数据的概化/实际控制口径；微小区域可通过搜索／区域选择器定位，不删除它们来凑数量。
- 中国沿用该上游2019年省级陆地区域口径，包括台湾、香港、澳门。不自行添加海域线或修改争议边界。
- 源名称`Guangzhou Province`按其广东省几何修正显示为`Guangdong Province / 广东省`；原名保存在`sourceName`。源`Ningxia Ningxia...`去除重复词；其余名称保留。源CHN的shapeISO全部为CHN，不能当省级唯一ID；使用明确的CN行政区代码映射，并保留源shapeID。
- 美国源South Dakota的`SU-SD`更正标识为`US-SD`，不改几何。阿拉斯加和夏威夷由D3 Albers USA插图投影显示，不冒充真实相对位置。
- 中文省/州/都道府县名称是展示翻译，英文名和源shapeID保留作核对。世界中文名称来自Natural Earth NAME_ZH。国旗仅根据有效ISO两字母代码生成emoji，缺失时不杜撰。

## 开放派生数据与复现

日本派生边界`japan.geojson`及名称目录`../regions/japan.json`继续以ODbL 1.0提供；许可说明和官方全文链接在`sources/ODbL-1.0.txt`。本项目的程序代码与其他独立数据不因此被描述为同一许可证。地图界面保留来源、许可和可直接访问的本地边界链接。

生成脚本：`python scripts/prepare-map-data.py .tmp/maps-stage1`，输入为上述固定版本原始文件及元数据；无第三方Python包。统计和照片不从边界文件抽取：本阶段`statistics:null`、`images:[]`，字段schema预留年份、单位、来源、状态，以便第二阶段接入。

投影使用本地D3-geo3.1.1和D3-array3.2.4（`assets/vendor/`），许可证ISC副本随文件分发。只增加这两个必要的投影模块，没有引入完整D3、地图瓦片服务、登录或API密钥。


## 2026-11-04 修订1：来源审计，暂停实现

用户在本轮明确选择 **“暂停实现，先解决克什米尔等边界来源”**。以下是已核实的候选资料与处置清单，**没有应用到运行数据**。当前世界地图仍为上方列出的50m/242要素；其旧边界不能被描述为本轮验收通过。投影开关、600%定位点改动、世界数据再生成均尚未开始。

### 候选源、版本与证据

- 检查固定仓库标签`v5.1.2`的完整文件树，没有`ne_50m_admin_0_countries_chn`；已取得`ne_10m_admin_0_countries_chn.geojson`，246要素、13,205,107字节。**仓库标签v5.1.2不等于图层版本**：其VERSION.txt为5.1.1，Natural Earth官网也列该变体为5.1.1。许可Public Domain。
- 同标签的争议面99要素、争议线、陆地边界515要素已取得，仅存`.tmp/map-revision-1/`。输入SHA256见该目录`source-fingerprints.json`；未生成输出几何，不能声称派生体积或拓扑验证通过。
- 14个D3球面点包含检查针对**未简化的候选源**：台北→CHN，普里什蒂纳→SRB，北尼科西亚→CYP，哈尔格萨→SOM，辛菲罗波尔→UKR，戈兰参考点→SYR，达旺/阿克赛钦→CHN；港澳仍为HKG/MAC，需可复现合并。全部坐标及前后结果见`pov-reference-check.json`。单个参考点通过不能证明整个边界正确。
- 候选比原242面移除TWN/SOL/KOS/CYN/KAS，新增BRI/BRT/CLP/CSI/ESB/GIB/SCR/UMI/WSB；不能按242减6直接声明最终区域数。新增SCR黄岩岛需依据E10并入CHN；其他新增属地/地位未定区域需另行核对，不自动删除或并入宗主国。

### 实际阻塞与可继续的来源路径

1. **克什米尔**：China POV国家面仍把斯利那加放入IND、穆扎法拉巴德放入PAK。原50m的KAS只是锡亚琴冰川，不是整个克什米尔。E2第十二条要求按比例尺表示地区界/停火线及相应标注，分国设色时不能直接以两国整面填色替代争议表示（小比例尺有省略规则，不能忽略放大后场景）。
2. 同版争议面含B05（Jammu and Kashmir）、B08（Gilgit-Baltistan）、B09（Azad Kashmir）、B45（Siachen Glacier）；同版陆地边界含4段IND/PAK `Line of control (please verify)`。**已找到候选几何，不是没有线数据**；尚无官方标准样图对照证明这些区域组合、线型与中国领土分界满足本轮口径，不将“please verify”当验收证据。B06/B07属于中国，不能把同一BRK_GROUP全选当成克什米尔并剥离中国领土。
3. [标准地图服务系统](http://bzdt.ch.mnr.gov.cn/)提供JPG/EPS及审图号，可作参考。代理访问失败；直连首页200，但下载页/公共脚本返回418，浏览器也未成功进入下载页。**没有取得官方EPS或可核对的具体图件**。EPS是制图矢量，尚未证明包含可直接复用的地理坐标/区域标识。
4. [国家地球系统科学数据中心：全球1:100万行政区划（2013）](https://www.geodata.cn/main/face_science_detail?guid=1831573&typeName=face_science)，DOI`10.12041/geodata.1831573.ver1.db`。直连公共元数据API已成功，描述称参照标准地图修正，完整数据108,878,594字节需订单审核，公开使用声明限非商业科研/学术等许可范围。取得的**样例仅PRK朝鲜**，内含GADM2.5/2015许可证，注明未经同意不得再分发；与完整数据元数据ADC WorldMap7.1来源不同。不能用该样例证明完整数据的来源、克什米尔覆盖或网页分发许可；实体未下载，未提交订单。
5. [甘肃生态科学数据中心另一2013全球行政边界集](https://eco.gssdc.cn/metadata/348efb73-847c-40c8-b0c7-6e8209724108)：页面列WGS84、245.6MB、ADC WorldMap7.1、CC BY4.0，但同时提示需登录下载/无实体或离线申请。**未取得实体**，不因同为2013数据便认定与上一项完全相同。
6. [世界银行官方边界](https://datacatalog.worldbank.org/search/dataset/0038272/world-bank-official-boundaries)含地位未定区和制图线、CC BY4.0，可作独立参照；其官方身份是世界银行数据，并非中国官方标准地图。未下载/应用；不将其与NE拼接当作已授权、已核对的方案。

来源尚未解决。继续前需取得可核对的官方标准图件/矢量与使用条件，再检查克什米尔地区界、停火线、中国西部及岛屿等，不能只凭文件名或机构名称宣称合规。没有注册账号、提交申请、发送邮件、付费、安装依赖或引入在线地图服务。

### 审计依据索引

- **E0**：[开工 Natural Earth 50m 源文件，仓库标签 v5.1.2](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson)。
- **E1**：[候选 Natural Earth 10m China POV，同仓库标签 v5.1.2；图层版本5.1.1](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_admin_0_countries_chn.geojson)。
- **E2**：[自然资源部2023年公开地图内容表示规范，外交部存档](https://www.mfa.gov.cn/web/wjb_673085/zzjg_673183/bjhysws_674671/bhflfg/dtdmxgfl/202303/P020230313585504979937.pdf)。
- **E3**：[外交部：中国同巴勒斯坦的关系](https://www.mfa.gov.cn/web/gjhdq_676201/gj_676203/yz_676205/1206_676332/sbgx_676336/)。
- **E4**：[外交部：支持塞尔维亚维护主权和领土完整](https://www.mfa.gov.cn/web/wjdt_674879/zcjd/202409/t20240916_11491613.shtml)。
- **E5**：[外交部领事服务：塞浦路斯概况](https://cs.mfa.gov.cn/zggmcg/ljmdd/oz_652287/spls_654583/)。
- **E6**：[中国驻索马里使馆：索马里兰是索马里领土一部分](https://so.china-embassy.gov.cn/sgxw/202609/t20260916_12023117.htm)。
- **E7**：[外交部：尊重各国主权、独立和领土完整](https://br.china-embassy.gov.cn/chn/fyrth/202304/t20230424_11064751.htm)。
- **E8**：[外交部：戈兰高地问题相关答问](https://ipc.fmprc.gov.cn/chn/fyrth/202412/t20241209_11541220.htm)。
- **E9**：[外交部：西撒哈拉问题政治解决与自决原则](https://www.mfa.gov.cn/zwbd_673032/wjzs/202611/t20261102_12051314.shtml)。
- **E10**：[外交部：黄岩岛是中国固有领土](https://www.fmprc.gov.cn/web/gjhdq_676201/gjhdqzz_681964/lhg_681966/fyrth_681974/202412/t20241217_11495645.shtml)。

### 原242要素逐项处置清单

此表完整覆盖开工242个ID与源分类，记录当前决定/待核查事项，**不是242条边界全部认证通过**。普通条目仅决定维持范围；没有依据UN会员资格筛选，也不把NE的TYPE/SOV字段直接视作中国外交承认。所有运行数据尚未改动。机器记录及候选新增9要素名单见`.tmp/map-revision-1/sovereignty-audit.json`。

| 实体（原ID） | 源要素 NE_ID / TYPE | 决定 | 依据 | 当前结果 | 日期 |
| --- | --- | --- | --- | --- | --- |
| Aruba (ABW) | 1159321097 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Afghanistan (AFG) | 1159320319 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Angola (AGO) | 1159320323 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Anguilla (AIA) | 1159320703 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Albania (ALB) | 1159320325 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Aland (ALD) | 1159320621 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Andorra (AND) | 1159320327 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| United Arab Emirates (ARE) | 1159320329 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Argentina (ARG) | 1159320331 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Armenia (ARM) | 1159320333 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| American Samoa (ASM) | 1159321357 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Antarctica (ATA) | 1159320335 / Indeterminate | 保留南极地区；不把搁置的领土要求判成国家归属 | E0/E1 | 维持地区，不作主权分配；未发布 | 2026-11-04 |
| Ashmore and Cartier Islands (ATC) | 1159320353 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| French Southern and Antarctic Lands (ATF) | 1159320631 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Antigua and Barbuda (ATG) | 1159320345 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Australia (AUS) | 1159320355 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Austria (AUT) | 1159320379 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Azerbaijan (AZE) | 1159320381 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Burundi (BDI) | 1159320387 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Belgium (BEL) | 1159320389 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Benin (BEN) | 1159320399 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Burkina Faso (BFA) | 1159320405 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Bangladesh (BGD) | 1159320407 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Bulgaria (BGR) | 1159320409 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Bahrain (BHR) | 1159320413 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| The Bahamas (BHS) | 1159320415 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Bosnia and Herzegovina (BIH) | 1159320417 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Saint Barthelemy (BLM) | 1159320633 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Belarus (BLR) | 1159320427 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Belize (BLZ) | 1159320431 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Bermuda (BMU) | 1159320705 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Bolivia (BOL) | 1159320439 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Brazil (BRA) | 1159320441 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Barbados (BRB) | 1159320449 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Brunei (BRN) | 1159320451 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Bhutan (BTN) | 1159320453 / Sovereign country | 保留；候选中不边界变化需核对标准画法 | E1/E2 | 未完成官方样图逐段核对；不发布几何变化 | 2026-11-04 |
| Botswana (BWA) | 1159320461 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Central African Republic (CAF) | 1159320463 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Canada (CAN) | 1159320467 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Switzerland (CHE) | 1159320491 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Chile (CHL) | 1159320493 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| China (CHN) | 1159320471 / Country | 核对台港澳、藏南及重要岛屿；克什米尔范围不得误含中国领土 | E1/E2/E10 | 台北/达旺/阿克赛钦点已查；港澳/岛屿及完整国界未验收 | 2026-11-04 |
| Ivory Coast (CIV) | 1159320507 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Cameroon (CMR) | 1159320509 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Democratic Republic of the Congo (COD) | 1159320513 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Republic of the Congo (COG) | 1159320515 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Cook Islands (COK) | 1159321129 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Colombia (COL) | 1159320517 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Comoros (COM) | 1159320521 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Cabo Verde (CPV) | 1159320523 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Costa Rica (CRI) | 1159320525 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Cuba (CUB) | 1159320527 / Sovereignty | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Curaçao (CUW) | 1159321099 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Cayman Islands (CYM) | 1159320707 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Northern Cyprus (CYN) | 1159320531 / Sovereign country | 并入CYP候选 | E1/E5 | 候选源已并入；未发布 | 2026-11-04 |
| Cyprus (CYP) | 1159320533 / Sovereign country | 保留；核对包含北尼科西亚 | E1/E5 | 原始候选参考点通过；未发布 | 2026-11-04 |
| Czechia (CZE) | 1159320535 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Germany (DEU) | 1159320539 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Djibouti (DJI) | 1159320541 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Dominica (DMA) | 1159320543 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Denmark (DNK) | 1159320547 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Dominican Republic (DOM) | 1159320563 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Algeria (DZA) | 1159320565 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Ecuador (ECU) | 1159320567 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Egypt (EGY) | 1159320575 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Eritrea (ERI) | 1159320581 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Spain (ESP) | 1159320587 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Estonia (EST) | 1159320615 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Ethiopia (ETH) | 1159320617 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Finland (FIN) | 1159320623 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Fiji (FJI) | 1159320625 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Falkland Islands (FLK) | 1159320711 / Disputed | 保留争议地区要素；不判作独立主权国家 | E0/E1/用户属地范围 | 不合并或新增主权认定；未发布 | 2026-11-04 |
| France (FRA) | 1159320637 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Faroe Islands (FRO) | 1159320549 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Federated States of Micronesia (FSM) | 1159320691 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Gabon (GAB) | 1159320693 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| United Kingdom (GBR) | 1159320713 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Georgia (GEO) | 1159320779 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Guernsey (GGY) | 1159320715 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Ghana (GHA) | 1159320793 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Guinea (GIN) | 1159320795 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Gambia (GMB) | 1159320797 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Guinea-Bissau (GNB) | 1159320799 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Equatorial Guinea (GNQ) | 1159320801 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Greece (GRC) | 1159320811 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Grenada (GRD) | 1159320813 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Greenland (GRL) | 1159320551 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Guatemala (GTM) | 1159320815 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Guam (GUM) | 1159321359 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Guyana (GUY) | 1159320817 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Hong Kong S.A.R. (HKG) | 1159320473 / Country | 并入CHN候选；中国省级图保持香港独立省级要素 | E1/E2 | 候选源仍独立，待生成器合并；未发布 | 2026-11-04 |
| Heard Island and McDonald Islands (HMD) | 1159320361 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Honduras (HND) | 1159320827 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Croatia (HRV) | 1159320833 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Haiti (HTI) | 1159320839 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Hungary (HUN) | 1159320841 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Indonesia (IDN) | 1159320845 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Isle of Man (IMN) | 1159320721 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| India (IND) | 1159320847 / Sovereign country | 保留国家；不得把克什米尔实际控制区当无争议国土 | E1/E2 | 阻塞：候选国家面仍覆盖斯利那加，缺独立争议表示 | 2026-11-04 |
| Indian Ocean Territories (IOA) | 1159320363 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| British Indian Ocean Territory (IOT) | 1159320723 / Disputed | 保留争议地区要素；不因源SOV字段认定英国主权 | E0/E1/用户属地范围 | 名称与当前归属需另核对，未作现势性认证 | 2026-11-04 |
| Ireland (IRL) | 1159320877 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Iran (IRN) | 1159320881 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Iraq (IRQ) | 1159320887 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Iceland (ISL) | 1159320917 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Israel (ISR) | 1159320895 / Disputed | 保留；戈兰参考点不留在ISR | E1/E8/用户验收要求 | 候选源戈兰参考点不在ISR；未发布 | 2026-11-04 |
| Italy (ITA) | 1159320919 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Jamaica (JAM) | 1159320931 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Jersey (JEY) | 1159320725 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Jordan (JOR) | 1159320935 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Japan (JPN) | 1159320937 / Sovereign country | 保留；钓鱼岛等中国主张需按同源几何与官方依据复核 | E1/E2 | 候选来源已取；未完成岛屿逐环/官方样图对照 | 2026-11-04 |
| Siachen Glacier (KAS) | 1159320963 / Indeterminate | 按印巴争议地区另核对；不并入印度或巴基斯坦来消除要素 | E0/E1/E2 | 阻塞：原KAS仅锡亚琴，候选无KAS；不是完整克什米尔地区 | 2026-11-04 |
| Kazakhstan (KAZ) | 1159320967 / Sovereignty | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Kenya (KEN) | 1159320971 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Kyrgyzstan (KGZ) | 1159320977 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Cambodia (KHM) | 1159320979 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Kiribati (KIR) | 1159320981 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Saint Kitts and Nevis (KNA) | 1159320983 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| South Korea (KOR) | 1159320985 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Kosovo (KOS) | 1159321007 / Disputed | 并入SRB候选 | E1/E4 | 候选源已并入；未发布 | 2026-11-04 |
| Kuwait (KWT) | 1159321009 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Laos (LAO) | 1159321011 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Lebanon (LBN) | 1159321013 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Liberia (LBR) | 1159321015 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Libya (LBY) | 1159321017 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Saint Lucia (LCA) | 1159321019 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Liechtenstein (LIE) | 1159321021 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Sri Lanka (LKA) | 1159321025 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Lesotho (LSO) | 1159321027 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Lithuania (LTU) | 1159321029 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Luxembourg (LUX) | 1159321031 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Latvia (LVA) | 1159321033 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Macao S.A.R (MAC) | 1159320475 / Country | 并入CHN候选；中国省级图保持澳门独立省级要素 | E1/E2 | 候选源仍独立，待生成器合并；未发布 | 2026-11-04 |
| Saint Martin (MAF) | 1159320639 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Morocco (MAR) | 1159321035 / Sovereign country | 保留国家；不把SAH并入本国 | E1/E9/用户默认选择 | 候选源西撒哈拉参考点不在MAR；未发布 | 2026-11-04 |
| Monaco (MCO) | 1159321043 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Moldova (MDA) | 1159321045 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Madagascar (MDG) | 1159321051 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Maldives (MDV) | 1159321053 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Mexico (MEX) | 1159321055 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Marshall Islands (MHL) | 1159321057 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| North Macedonia (MKD) | 1159321061 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Mali (MLI) | 1159321063 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Malta (MLT) | 1159321065 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Myanmar (MMR) | 1159321067 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Montenegro (MNE) | 1159321069 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Mongolia (MNG) | 1159321071 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Northern Mariana Islands (MNP) | 1159321361 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Mozambique (MOZ) | 1159321073 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Mauritania (MRT) | 1159321075 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Montserrat (MSR) | 1159320727 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Mauritius (MUS) | 1159321079 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Malawi (MWI) | 1159321081 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Malaysia (MYS) | 1159321083 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Namibia (NAM) | 1159321085 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| New Caledonia (NCL) | 1159320641 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Niger (NER) | 1159321087 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Norfolk Island (NFK) | 1159320365 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Nigeria (NGA) | 1159321089 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Nicaragua (NIC) | 1159321091 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Niue (NIU) | 1159321133 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Netherlands (NLD) | 1159321101 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Norway (NOR) | 1159321109 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Nepal (NPL) | 1159321121 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Nauru (NRU) | 1159321123 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| New Zealand (NZL) | 1159321135 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Oman (OMN) | 1159321151 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Pakistan (PAK) | 1159321153 / Sovereign country | 保留国家；不得把克什米尔实际控制区当无争议国土 | E1/E2 | 阻塞：候选国家面仍覆盖穆扎法拉巴德，缺独立争议表示 | 2026-11-04 |
| Panama (PAN) | 1159321161 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Pitcairn Islands (PCN) | 1159320729 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Peru (PER) | 1159321163 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Philippines (PHL) | 1159321169 / Sovereign country | 保留；黄岩岛及南海岛礁需单独核对 | E1/E2/E10 | 候选额外SCR需并入CHN；未发布 | 2026-11-04 |
| Palau (PLW) | 1159321171 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Papua New Guinea (PNG) | 1159321173 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Poland (POL) | 1159321179 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Puerto Rico (PRI) | 1159321363 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| North Korea (PRK) | 1159321181 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Portugal (PRT) | 1159321187 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Paraguay (PRY) | 1159321195 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Palestine (PSX) | 1159320899 / Indeterminate | 保留巴勒斯坦国；不能由源TYPE或非UN会员资格否认国家地位 | E1/E3 | 候选源仍存在；需覆盖源Indeterminate分类，未发布 | 2026-11-04 |
| French Polynesia (PYF) | 1159320643 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Qatar (QAT) | 1159321197 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Romania (ROU) | 1159321199 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Russia (RUS) | 1159321201 / Sovereign country | 保留；克里米亚不留在RUS | E1/E7/用户验收要求 | 候选源辛菲罗波尔不在RUS；未发布 | 2026-11-04 |
| Rwanda (RWA) | 1159321219 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Western Sahara (SAH) | 1159321223 / Indeterminate | 保留地位未定的非主权地区；不并入摩洛哥 | E1/E9/用户默认选择 | 候选SAH范围变化，参考点由MAR转SAH；未发布 | 2026-11-04 |
| Saudi Arabia (SAU) | 1159321225 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Sudan (SDN) | 1159321229 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| South Sudan (SDS) | 1159321235 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Senegal (SEN) | 1159321243 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Singapore (SGP) | 1159321247 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| South Georgia and the Islands (SGS) | 1159320731 / Dependency | 保留地区要素；不据源属地字段裁决争议 | E0/E1/用户属地范围 | 不合并或新增主权认定；未发布 | 2026-11-04 |
| Saint Helena (SHN) | 1159320733 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Solomon Islands (SLB) | 1159321249 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Sierra Leone (SLE) | 1159321251 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| El Salvador (SLV) | 1159321253 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| San Marino (SMR) | 1159321255 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Somaliland (SOL) | 1159321259 / Sovereign country | 并入SOM候选 | E1/E6 | 候选源已并入；未发布 | 2026-11-04 |
| Somalia (SOM) | 1159321261 / Sovereign country | 保留；核对包含哈尔格萨 | E1/E6 | 原始候选参考点通过；未发布 | 2026-11-04 |
| Saint Pierre and Miquelon (SPM) | 1159320647 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Republic of Serbia (SRB) | 1159321267 / Sovereign country | 保留；核对包含普里什蒂纳 | E1/E4 | 原始候选参考点通过；未发布 | 2026-11-04 |
| São Tomé and Principe (STP) | 1159321273 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Suriname (SUR) | 1159321281 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Slovakia (SVK) | 1159321283 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Slovenia (SVN) | 1159321285 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Sweden (SWE) | 1159321287 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| eSwatini (SWZ) | 1159321289 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Sint Maarten (SXM) | 1159321103 / Country | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Seychelles (SYC) | 1159321291 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Syria (SYR) | 1159321295 / Sovereign country | 保留；戈兰参考点归SYR | E1/E8/用户验收要求 | 原始候选戈兰参考点在SYR；未发布 | 2026-11-04 |
| Turks and Caicos Islands (TCA) | 1159320737 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Chad (TCD) | 1159321301 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Togo (TGO) | 1159321303 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Thailand (THA) | 1159321305 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Tajikistan (TJK) | 1159321307 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Turkmenistan (TKM) | 1159321309 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| East Timor (TLS) | 1159321313 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Tonga (TON) | 1159321319 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Trinidad and Tobago (TTO) | 1159321321 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Tunisia (TUN) | 1159321327 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Turkey (TUR) | 1159321331 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Tuvalu (TUV) | 1159321333 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Taiwan (TWN) | 1159321335 / Sovereign country | 并入CHN候选；不作为独立国家/地区入口 | E1/E2 | 候选源已并入；未发布 | 2026-11-04 |
| United Republic of Tanzania (TZA) | 1159321337 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Uganda (UGA) | 1159321343 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Ukraine (UKR) | 1159321345 / Sovereign country | 保留；克里米亚属于UKR要素 | E1/E7/用户验收要求 | 原始候选辛菲罗波尔在UKR；未发布 | 2026-11-04 |
| Uruguay (URY) | 1159321353 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| United States of America (USA) | 1159321369 / Country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Uzbekistan (UZB) | 1159321405 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Vatican (VAT) | 1159321407 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Saint Vincent and the Grenadines (VCT) | 1159321409 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Venezuela (VEN) | 1159321411 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| British Virgin Islands (VGB) | 1159320739 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| United States Virgin Islands (VIR) | 1159321371 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Vietnam (VNM) | 1159321417 / Sovereign country | 保留；南海岛礁需按中国官方口径核对 | E1/E2 | 不直接把候选China POV称为官方标准图 | 2026-11-04 |
| Vanuatu (VUT) | 1159321421 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Wallis and Futuna (WLF) | 1159320649 / Dependency | 保留国家/地区入口；不把属地一律并入宗主国 | E0/E1/用户属地范围 | 仅保留要素范围；不据TYPE/SOV字段认定主权 | 2026-11-04 |
| Samoa (WSM) | 1159321423 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Yemen (YEM) | 1159321425 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| South Africa (ZAF) | 1159321431 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Zambia (ZMB) | 1159321439 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
| Zimbabwe (ZWE) | 1159321441 / Sovereign country | 维持国家/地区要素；不新增合并或主权认定 | E0/E1 | 仅核对源标识与分类；未完成逐段国界校核 | 2026-11-04 |
