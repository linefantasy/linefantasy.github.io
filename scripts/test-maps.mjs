// Node's built-in runner; no install step. Run: node scripts/test-maps.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createMapDataService} from '../assets/maps/map-data-service.mjs';
import {regionImages} from '../assets/maps/map-image-service.mjs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const index=read('index.html');
const navigation=index.match(/<nav class="lt-tabs sidebar-nav"[\s\S]*?<\/nav>/)[0];
assert.equal((navigation.match(/data-section=/g)||[]).length,4,'Navigation must have exactly 4 entries');
assert.ok(/>首页<\/a>/.test(navigation),'Explore must be renamed Home');
assert.ok(/>首页<\/a>[\s\S]*>项目<\/a>[\s\S]*>故事<\/a>[\s\S]*>关于<\/a>/.test(navigation),'Project must appear between Home and Story');
assert.ok(/id="projects" data-nav-group="projects"/.test(index),'Project scene must own its sidebar state');
assert.ok(/class="tool-catalog-link" href="map.html"/.test(index),'Project AI tool must open the map directly');
assert.ok(!/class="map-launch-card"/.test(index),'About must not keep a duplicate map launcher');
for(const text of ['故事内容待整理。','这里会慢慢留下真实的记录。','也喜欢动起来。','偶尔玩玩游戏。','工具还在整理。','有可以使用的小工具时，再放到这里。','把这里当作一块小小的试验田，记录学习，也慢慢放下自己的作品。']) assert.ok(index.includes(text),`Lost original content: ${text}`);
assert.ok(index.includes('href="map.html"'),'A genuine Map Explorer entry is required');
const manifest=JSON.parse(read('data/maps/manifest.json'));
const context={};vm.createContext(context);vm.runInContext(read('assets/vendor/d3-array.min.js')+'\n'+read('assets/vendor/d3-geo.min.js'),context);
for(const [key,count] of [['world',239],['china',34],['usa',51],['japan',47]]) {
  const entry=manifest.maps.find(m=>m.id===key);assert.ok(entry);
  const projections=key==='usa'?['albers-usa']:key==='world'?['equal-earth','equirectangular','mercator']:['mercator','equirectangular'];
  assert.deepEqual(entry.projections,projections,key+' supported projections');
  assert.equal(entry.projection,projections[0],key+' default projection');
  const geometry=JSON.parse(read(entry.geometry)),catalog=JSON.parse(read(entry.catalog));
  assert.equal(geometry.features.length,count,key);
  assert.equal(Object.keys(catalog.regions).length,count,key+' catalog');
  const ids=new Set();
  for(const feature of geometry.features) {
    assert.ok(!ids.has(feature.id));ids.add(feature.id);
    assert.ok(catalog.regions[feature.id]?.nameZh);
    assert.ok(catalog.regions[feature.id]?.nameEn);
    assert.ok(['Polygon','MultiPolygon'].includes(feature.geometry.type));
    assert.deepEqual(feature.properties,{},'Geometry must not contain statistical or label data');
    const area=context.d3.geoArea(feature);
    assert.ok(area>0&&area<Math.PI*2,`${key}/${feature.id}: polygon winding must not invert into the globe`);
    assert.equal(catalog.regions[feature.id].statistics,null,'Stage 1 must not fabricate statistics');
    const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
    for(const polygon of polygons) for(const ring of polygon) {
      assert.ok(ring.length>=4);assert.deepEqual(ring[0],ring.at(-1));
      for(const [x,y] of ring) assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x)<=180&&Math.abs(y)<=90);
    }
  }
}
const world=JSON.parse(read('data/maps/world.geojson'));
const worldCatalog=JSON.parse(read('data/regions/world.json')).regions;
for(const id of ['TWN','HKG','MAC']) {
  assert.ok(!world.features.some(f=>f.id===id),id+' must be part of CHN');
  assert.ok(!worldCatalog[id],id+' must not remain an independent world option');
}
const chinaWorld=world.features.find(f=>f.id==='CHN');
for(const [name,point] of [['Taipei',[121.5654,25.033]],['Hong Kong inland',[114.15,22.45]],['Macao source interior',[113.51,22.225]]])
  assert.ok(context.d3.geoContains(chinaWorld,point),name+' must hit CHN');
const antarctica=world.features.find(f=>f.id==='ATA');
const mercator=context.d3.geoMercator().fitExtent([[24,24],[976,596]],{type:'Sphere'});
assert.ok(context.d3.geoPath(mercator).bounds(antarctica)[0][1]>400,'Antarctica Mercator path must not cover northern oceans');
const usa=JSON.parse(read('data/regions/usa.json'));
assert.equal(Object.values(usa.regions).filter(r=>r.kind==='state').length,50);
assert.equal(usa.regions['US-DC'].kind,'district');
const china=JSON.parse(read('data/regions/china.json'));
assert.deepEqual(['province','autonomous-region','municipality','special-region'].map(k=>Object.values(china.regions).filter(r=>r.kind===k).length),[23,5,4,2]);
const requests=new Map();
const service=createMapDataService(async url=>{
  const path=url.pathname.slice(1);requests.set(path,(requests.get(path)||0)+1);
  return {ok:true,json:async()=>JSON.parse(read(path))};
},new URL('https://local/'));
const [first,second]=await Promise.all([service.load('china'),service.load('china')]);
assert.equal(first.geometry,second.geometry,'Concurrent loads must share cached geometry');
assert.ok([...requests.values()].every(n=>n===1),'No duplicate map/schema/catalog fetches');
const detail=service.detail(first,'CN-JL');assert.equal(detail.nameZh,'吉林省');
assert.deepEqual(detail.fields.map(f=>f.id),['population','gdp']);assert.ok(detail.fields.every(f=>f.value===null&&f.status==='pending'));
await assert.rejects(()=>service.load('unknown'),/未找到/);
let attempts=0;
const retry=createMapDataService(async()=>{if(++attempts===1)throw Error('network');return {ok:true,json:async()=>manifest}},new URL('https://local/'));
await assert.rejects(()=>retry.manifest(),/network/);assert.equal((await retry.manifest()).version,1);
assert.equal(regionImages({images:[{url:'javascript:alert(1)',alt:'x',source:'x',license:'x'}]}).length,0);
assert.equal(regionImages({images:[{url:'/photo.jpg',alt:'x',source:'x',license:'CC0'}]}).length,1);
console.log('PASS: navigation/content, 239/34/51/47 valid spherical regions, HK/Macao/Taiwan in CHN, projections, catalogs/cache/retry/details');
