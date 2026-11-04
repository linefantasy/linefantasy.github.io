// Boundary, labels, future statistics and images are separate resources.
export function createMapDataService(fetcher=globalThis.fetch.bind(globalThis),base=new URL('../../',import.meta.url)) {
  const cache=new Map();
  function json(path) {
    if(!cache.has(path)) {
      const promise=(async()=>{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
        try {
          const response=await fetcher(new URL(path,base),{signal:controller.signal});
          if(!response.ok) throw Error(`地图文件读取失败（${response.status}）`);
          return await response.json();
        } finally {clearTimeout(timer)}
      })().catch(error=>{cache.delete(path);throw error});
      cache.set(path,promise);
    }
    return cache.get(path);
  }
  const manifest=async()=>{
    const result=await json('data/maps/manifest.json');
    if(result.version!==1 || !Array.isArray(result.maps)) throw Error('地图清单格式不兼容');
    return result;
  };
  async function load(id) {
    const meta=(await manifest()).maps.find(m=>m.id===id);
    if(!meta) throw Error('未找到这张地图');
    if(!Array.isArray(meta.projections)||!meta.projections.length||!meta.projections.includes(meta.projection)||meta.projections.some(p=>!['equal-earth','equirectangular','mercator','albers-usa'].includes(p))) throw Error('地图投影配置无效');
    const [geometry,catalog,schema]=await Promise.all([json(meta.geometry),json(meta.catalog),json('data/regions/schema.json')]);
    if(geometry.type!=='FeatureCollection'||geometry.features?.length!==meta.count||!catalog.regions||!Array.isArray(schema.fields)) throw Error('地图数据不完整，请重试');
    const ids=new Set();
    for(const f of geometry.features) {
      if(ids.has(f.id)||!catalog.regions[f.id]||!['Polygon','MultiPolygon'].includes(f.geometry?.type)) throw Error('区域标识或边界数据无效');
      ids.add(f.id);
    }
    return {meta,geometry,regions:catalog.regions,schema};
  }
  function detail(map,id) {
    const region=map.regions[id];if(!region) return null;
    return {...region,fields:map.schema.fields.filter(f=>f.maps.includes(map.meta.id)).map(f=>{
      const value=region.statistics?.[f.id];
      return {...f,value:value?.value??null,status:value?.status||'pending',unit:value?.unit||null,year:value?.year||null,source:value?.source||null,pendingLabel:map.schema.pendingLabel};
    })};
  }
  // Clear even a structurally invalid successful JSON response on explicit retry.
  const clear=()=>cache.clear();
  return {manifest,load,detail,clear};
}
