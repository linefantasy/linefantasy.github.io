"""Prepare local, version-pinned map data; no third-party Python dependencies.

python scripts/prepare-map-data.py .tmp/maps-stage1
Input files: world.geojson, CHN/USA/JPN.geojson and *-metadata.json.
Runtime geometry and region catalogs are deliberately separate. Japan's derived
geometry/catalog are distributed under ODbL 1.0; see data/maps/SOURCES.md.
"""
import hashlib
import json
import sys
import copy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / '.tmp/maps-stage1'
WORLD_ONLY = '--world-only' in sys.argv

CN = [
 ('Hainan Province','HI','海南省','province'),('Taiwan Province','TW','台湾省','province'),
 ('Guangxi Zhuang Autonomous Region','GX','广西壮族自治区','autonomous-region'),('Fujian Province','FJ','福建省','province'),
 ('Yunnan Province','YN','云南省','province'),('Guizhou Province','GZ','贵州省','province'),('Jiangxi Province','JX','江西省','province'),
 ('Hunan Province','HN','湖南省','province'),('Zhejiang Province','ZJ','浙江省','province'),('Shanghai Municipality','SH','上海市','municipality'),
 ('Chongqing Municipality','CQ','重庆市','municipality'),('Hubei Province','HB','湖北省','province'),('Sichuan Province','SC','四川省','province'),
 ('Anhui Province','AH','安徽省','province'),('Jiangsu Province','JS','江苏省','province'),('Henan Province','HA','河南省','province'),
 ('Tibet Autonomous Region','XZ','西藏自治区','autonomous-region'),('Shandong Province','SD','山东省','province'),('Qinghai Province','QH','青海省','province'),
 ('Ningxia Ningxia Hui Autonomous Region','NX','宁夏回族自治区','autonomous-region'),('Shaanxi Province','SN','陕西省','province'),
 ('Tianjin Municipality','TJ','天津市','municipality'),('Shanxi Province','SX','山西省','province'),('Beijing Municipality','BJ','北京市','municipality'),
 ('Gansu Province','GS','甘肃省','province'),('Hebei Province','HE','河北省','province'),('Liaoning Province','LN','辽宁省','province'),
 ('Jilin Province','JL','吉林省','province'),('Xinjiang Uyghur Autonomous Region','XJ','新疆维吾尔自治区','autonomous-region'),
 ('Inner Mongolia Autonomous Region','NM','内蒙古自治区','autonomous-region'),('Heilongjiang Province','HL','黑龙江省','province'),
 ('Macau Special Administrative Region','MO','澳门特别行政区','special-region'),('Hong Kong Special Administrative Region','HK','香港特别行政区','special-region'),
 ('Guangzhou Province','GD','广东省','province')]
US_CODES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split()
US_ZH = '亚拉巴马州 阿拉斯加州 亚利桑那州 阿肯色州 加利福尼亚州 科罗拉多州 康涅狄格州 特拉华州 佛罗里达州 佐治亚州 夏威夷州 爱达荷州 伊利诺伊州 印第安纳州 艾奥瓦州 堪萨斯州 肯塔基州 路易斯安那州 缅因州 马里兰州 马萨诸塞州 密歇根州 明尼苏达州 密西西比州 密苏里州 蒙大拿州 内布拉斯加州 内华达州 新罕布什尔州 新泽西州 新墨西哥州 纽约州 北卡罗来纳州 北达科他州 俄亥俄州 俄克拉何马州 俄勒冈州 宾夕法尼亚州 罗得岛州 南卡罗来纳州 南达科他州 田纳西州 得克萨斯州 犹他州 佛蒙特州 弗吉尼亚州 华盛顿州 西弗吉尼亚州 威斯康星州 怀俄明州 华盛顿哥伦比亚特区'.split()
JP_ZH = '北海道 青森县 岩手县 宫城县 秋田县 山形县 福岛县 茨城县 栃木县 群马县 埼玉县 千叶县 东京都 神奈川县 新潟县 富山县 石川县 福井县 山梨县 长野县 岐阜县 静冈县 爱知县 三重县 滋贺县 京都府 大阪府 兵库县 奈良县 和歌山县 鸟取县 岛根县 冈山县 广岛县 山口县 德岛县 香川县 爱媛县 高知县 福冈县 佐贺县 长崎县 熊本县 大分县 宫崎县 鹿儿岛县 冲绳县'.split()


def dump(path, obj):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def simplify_open(points, tolerance):
    """Iterative Douglas-Peucker. Small islands/rings are retained, never dropped."""
    if len(points) <= 2:
        return points
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        x, y = points[a]; dx, dy = points[b][0] - x, points[b][1] - y
        length = dx * dx + dy * dy
        best, split = tolerance * tolerance, None
        for i in range(a + 1, b):
            px, py = points[i]
            t = max(0, min(1, ((px - x) * dx + (py - y) * dy) / length)) if length else 0
            distance = (px - x - t * dx) ** 2 + (py - y - t * dy) ** 2
            if distance > best:
                best, split = distance, i
        if split is not None:
            keep.add(split); stack.extend([(a, split), (split, b)])
    return [points[i] for i in sorted(keep)]


def ring(points, tolerance, hole):
    original = [[round(p[0], 4), round(p[1], 4)] for p in points]
    # Split closed rings at an opposite vertex to avoid the zero-length baseline.
    pivot = max(range(len(original)-1), key=lambda i: (original[i][0]-original[0][0])**2+(original[i][1]-original[0][1])**2)
    result = simplify_open(original[:pivot+1], tolerance)[:-1] + simplify_open(original[pivot:], tolerance)
    # Planar DP can collapse a polar antimeridian seam into a great-circle arc
    # that Mercator clips through the opposite pole, covering ocean hit areas.
    # Retain the source vertices on such rings; never invent a closing boundary.
    if max(p[0] for p in original)-min(p[0] for p in original)>359 and (min(p[1] for p in original)<-80 or max(p[1] for p in original)>80):
        result = original
    if len(result) < 4 or len({tuple(p) for p in result}) < 3:
        result = original
    if result[-1] != result[0]:
        result.append(result[0])
    area = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(result,result[1:]))
    # D3's spherical convention: clockwise exterior, anticlockwise holes.
    if (area > 0) != hole:
        result.reverse()
    return result


def geometry(g, tolerance):
    polygons = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
    converted = [[ring(r, tolerance, n > 0) for n,r in enumerate(poly)] for poly in polygons]
    return {'type':g['type'],'coordinates':converted[0] if g['type']=='Polygon' else converted}


manifest = json.loads((ROOT/'data/maps/manifest.json').read_text(encoding='utf-8')) if WORLD_ONLY else {'version':1,'maps':[]}
projection_options = {'world':['equal-earth','equirectangular','mercator'],'china':['mercator','equirectangular'],
                      'usa':['albers-usa'],'japan':['mercator','equirectangular']}
cn_lookup = {row[0]:row[1:] for row in CN}
us_lookup = dict(zip(US_CODES, US_ZH))
for key, code, name, projection, tolerance in [
 ('world', None, '世界地图', 'equal-earth', .015), ('china','CHN','中国地图','mercator',.003),
 ('usa','USA','美国地图','albers-usa',.012), ('japan','JPN','日本地图','mercator',.005)]:
    if WORLD_ONLY and key != 'world':
        continue
    source_path = RAW / ('world.geojson' if code is None else code+'.geojson')
    source = json.loads(source_path.read_text(encoding='utf-8'))
    if key == 'world':
        # Preserve every source ring/island. Append same-source geometries instead
        # of drawing/cutting disputed borders. Other boundary revisions are deferred.
        source = copy.deepcopy(source)
        by_id = {f['properties']['ADM0_A3']:f for f in source['features']}
        merged = []
        for rid in ['CHN','TWN','HKG','MAC']:
            g = by_id[rid]['geometry']
            merged.extend([g['coordinates']] if g['type']=='Polygon' else g['coordinates'])
        by_id['CHN']['geometry'] = {'type':'MultiPolygon','coordinates':merged}
        source['features'] = [f for f in source['features'] if f['properties']['ADM0_A3'] not in ['TWN','HKG','MAC']]
    features, records = [], {}
    for f in source['features']:
        p = f['properties']
        if key == 'world':
            rid = p['ADM0_A3']; en = p['ADMIN']; zh = p.get('NAME_ZH') or en
            iso = p.get('ISO_A2_EH') or p.get('ISO_A2'); kind='country-or-territory'
        elif key == 'china':
            suffix, zh, kind = cn_lookup[p['shapeName']];rid='CN-'+suffix
            en = 'Guangdong Province' if suffix=='GD' else p['shapeName'].replace('Ningxia Ningxia','Ningxia');iso=None
        elif key == 'usa':
            suffix = 'SD' if p['shapeName']=='South Dakota' else p['shapeISO'].split('-')[-1]
            if suffix not in us_lookup:
                continue
            rid='US-'+suffix;en=p['shapeName'];zh=us_lookup[suffix];iso=None;kind='district' if suffix=='DC' else 'state'
        else:
            rid=p['shapeISO'];en=p['shapeName'];zh=JP_ZH[int(rid[-2:])-1];iso=None;kind='prefecture'
        assert rid not in records, rid
        records[rid]={'id':rid,'nameZh':zh,'nameEn':en,'kind':kind,'flagCode':iso if iso and len(iso)==2 else None,
                      'sourceId':p.get('shapeID') or p.get('NE_ID'),'sourceName':p.get('shapeName') or en,'statistics':None,'images':[]}
        features.append({'type':'Feature','id':rid,'properties':{},'geometry':geometry(f['geometry'],tolerance)})
    features.sort(key=lambda f:f['id'])
    filename=f'data/maps/{key}.geojson'; catalog=f'data/regions/{key}.json'
    dump(filename,{'type':'FeatureCollection','features':features})
    dump(catalog,{'version':1,'regions':dict(sorted(records.items()))})
    metadata = json.loads((RAW/(code+'-metadata.json')).read_text(encoding='utf-8')) if code else {'boundarySource':'Natural Earth v5.1.2 / Admin 0 Countries 1:50m','boundaryYearRepresented':'v5.1.2','boundaryLicense':'Public Domain'}
    if code:
        dump(f'data/maps/sources/{key}-metadata.json',metadata)
    attribution = '© OpenStreetMap contributors · Wambacher · geoBoundaries · ODbL 1.0' if key=='japan' else 'Made with Natural Earth' if key=='world' else metadata['boundarySource']+' · geoBoundaries'
    notes = {
      'world':'239个国家／地区要素；台湾、香港、澳门已并入中国。其余沿用Natural Earth 1:50m源边界；争议边界完整校核暂缓，不代表官方标准地图。含属地，不等同于主权国家数量。',
      'china':'34个省级区域：23省、5自治区、4直辖市、2特别行政区。依据源数据2019年口径；概化陆地区域，不另绘海域界线。',
      'usa':'50州＋华盛顿哥伦比亚特区；特区单独标记，剔除5个属地。阿拉斯加、夏威夷使用插图投影。',
      'japan':'47个都道府县。geoBoundaries收录的2017年OpenStreetMap/Wambacher边界，非日本官方实时地图。'
    }
    entry = {'id':key,'name':name,'geometry':filename,'catalog':catalog,'projection':projection,'projections':projection_options[key],'count':len(features),
      'attribution':attribution,'sourceUrl':'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/' if key=='world' else f'https://www.geoboundaries.org/api/current/gbOpen/{code}/ADM1/',
      'license':metadata['boundaryLicense'],'licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/' if key=='japan' else 'https://www.naturalearthdata.com/about/terms-of-use/' if key=='world' else 'https://www.geoboundaries.org/',
      'note':notes[key],'simplificationToleranceDegrees':tolerance,'sourceSha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
      'sha256':hashlib.sha256((ROOT/filename).read_bytes()).hexdigest()}
    if key == 'world':
        entry['normalization'] = {'mergedIntoCHN':['TWN','HKG','MAC'],'sourceCount':242,'boundaryReview':'Other boundary revisions deferred by user'}
    if WORLD_ONLY:
        manifest['maps'] = [entry if m['id']==key else m for m in manifest['maps']]
    else:
        manifest['maps'].append(entry)
    print(key,len(features),(ROOT/filename).stat().st_size,'bytes')
for entry in manifest['maps']:
    entry['projections'] = projection_options[entry['id']]
    entry['projection'] = entry['projections'][0]
dump('data/maps/manifest.json',manifest)
if not WORLD_ONLY:
    dump('data/regions/schema.json',{'version':1,'pendingLabel':'第二阶段接入','fields':[
 {'id':'population','label':'人口','maps':['world','china','usa','japan']},
 {'id':'gdp','label':'GDP','maps':['world','china','usa','japan']},
 {'id':'ethnicGroups','label':'民族／族群构成','maps':['world']},
 {'id':'officialLanguages','label':'官方语言','maps':['world']},
 {'id':'majorLanguages','label':'主要语言','maps':['world']}]})
