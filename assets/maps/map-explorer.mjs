import {createMapDataService} from './map-data-service.mjs?v=ce4c1e10ce';
import {MapCanvas} from './map-canvas.mjs?v=279ae070b3';
import {MapDetailPanel} from './map-detail.mjs?v=cf4cd81eb8';

const service=createMapDataService(),root=document.getElementById('map-explorer');
const tabs=[...root.querySelectorAll('[data-map]')],selector=root.querySelector('#map-region');
const canvas=new MapCanvas(root.querySelector('#map-svg'),root.querySelector('#map-tooltip'));
const detail=new MapDetailPanel(root.querySelector('#map-detail'),root.querySelector('#map-detail-close'));
const status=root.querySelector('#map-status'),error=root.querySelector('#map-error'),busy=root.querySelector('#map-loading');
const views=new Map();let current=null,selected=null,request=0,cameraTimer;
const projectionButtons=[...root.querySelectorAll('[data-projection]')];let projection=null;
const ids=tabs.map(t=>t.dataset.map);
function params(){const p=new URLSearchParams(location.hash.slice(1));return {map:ids.includes(p.get('map'))?p.get('map'):'world',region:p.get('region'),projection:p.get('projection')}}
function route(push=false){
  if(!current)return;
  const p=new URLSearchParams({map:current.meta.id,projection});if(selected)p.set('region',selected);
  history[push?'pushState':'replaceState']({...history.state,mapExplorerVersion:2,mapId:current.meta.id,mapProjection:projection,mapView:canvas.getView()},'',location.pathname+location.search+'#'+p);
}
function projectionControls(){
  const fixed=current.meta.projections.length===1;
  root.querySelector('#map-projection').hidden=fixed;
  root.querySelector('#map-projection-help').textContent=fixed?'美国地图固定使用 Albers USA，阿拉斯加、夏威夷为插图。':(current.meta.id==='world'?'Equal Earth 保留上一版世界地图的曲线轮廓与面积比例；':'')+'等距圆柱是常见的矩形地图，墨卡托会放大高纬地区。切换投影保留所选区域并恢复全图视角。';
  projectionButtons.forEach(b=>{b.hidden=!current.meta.projections.includes(b.dataset.projection);b.disabled=b.hidden;b.setAttribute('aria-pressed',String(b.dataset.projection===projection))});
}
projectionButtons.forEach(button=>button.addEventListener('click',()=>{
  const next=button.dataset.projection;if(!current||next===projection||!current.meta.projections.includes(next))return;
  route();clearTimeout(cameraTimer);
  const map=current,id=selected;current=null;projection=next;
  canvas.show(map,projection);canvas.select(id);current=map;
  projectionControls();views.set(map.meta.id,{projection,region:id,view:canvas.getView()});
  route(true);status.textContent=`已切换${button.textContent}投影，恢复全图视角，所选区域保持。放大超过 600% 显示微小区域定位点。`;
}));
function select(id,{push=true,locate=false,focus=false,write=true}={}){
  if(!current?.regions[id])return;
  if(push&&write)route(); // Flush the source camera before creating the selection entry.
  selected=id;canvas.select(id);selector.value=id;
  const data=service.detail(current,id);detail.show(data,{focus});
  root.querySelector('#map-locate').disabled=false;root.querySelector('#map-show-detail').disabled=false;
  status.textContent=`已选择${data.nameZh}，基本信息已显示。统计数据第二阶段接入。`;
  if(locate)canvas.locate(id);
  if(write)route(push);
}
canvas.onSelect=id=>select(id);
detail.onClose=()=>canvas.focusSelected();
canvas.onView=view=>{
  root.querySelector('#map-zoom-level').textContent=Math.round(view.k*100)+'%';
  root.querySelector('[data-command="zoom-in"]').disabled=view.k>=64;
  root.querySelector('[data-command="zoom-out"]').disabled=view.k<=1;
  if(!current)return;
  clearTimeout(cameraTimer);cameraTimer=setTimeout(()=>{if(current)route()},140);
};
async function load(id,{push=false,region=null,view=null,restore=false,projection:requestedProjection=null}={}) {
  if(current&&push)route(); // Do not discard a pending camera save on a quick tab switch.
  if(current)views.set(current.meta.id,{view:canvas.getView(),region:selected,projection});
  const token=++request;clearTimeout(cameraTimer);current=null;selected=null;root.dataset.ready='false';
  detail.reset();error.hidden=true;busy.hidden=false;selector.disabled=true;
  projectionButtons.forEach(b=>b.disabled=true);
  root.querySelector('#map-locate').disabled=true;root.querySelector('#map-show-detail').disabled=true;
  root.querySelector('#map-panel').setAttribute('aria-busy','true');
  root.querySelector('#map-panel').setAttribute('aria-labelledby','map-tab-'+id);
  tabs.forEach(tab=>{const active=tab.dataset.map===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
  try {
    const map=await service.load(id);if(token!==request)return;
    const saved=restore?null:views.get(id),wanted=requestedProjection||saved?.projection;
    projection=map.meta.projections.includes(wanted)?wanted:map.meta.projection;
    canvas.show(map,projection);current=map;projectionControls();
    let chosen=region||saved?.region;
    if(id==='world'&&['TWN','HKG','MAC'].includes(chosen))chosen='CHN';
    selector.replaceChildren(new Option('选择国家或行政区域…',''));
    Object.values(map.regions).sort((a,b)=>a.nameZh.localeCompare(b.nameZh,'zh')).forEach(r=>selector.add(new Option(r.nameZh+' · '+r.nameEn,r.id)));
    selector.disabled=false;
    root.querySelector('#map-title').textContent=map.meta.name;
    root.querySelector('#map-count').textContent=map.meta.count+' 个可交互区域';
    root.querySelector('#map-source-note').textContent=map.meta.note;
    const attribution=root.querySelector('#map-attribution');attribution.textContent=map.meta.attribution;attribution.href=map.meta.sourceUrl;
    const license=root.querySelector('#map-license');license.textContent=map.meta.license;license.href=map.meta.licenseUrl;
    root.querySelector('#map-boundary-download').href=map.meta.geometry;
    if(chosen&&map.regions[chosen])select(chosen,{write:false});
    else status.textContent=map.meta.name+'已加载。悬停查看名称，点击区域查看详情。';
    canvas.setView(view||(saved?.projection===projection?saved.view:null)||{x:0,y:0,k:1});
    route(push);root.dataset.ready='true';
  } catch(reason) {
    if(token!==request)return;
    error.hidden=false;root.querySelector('#map-error-message').textContent=reason.name==='AbortError'?'地图加载超时，请检查连接后重试。':reason.message||'地图加载失败，请重试。';
    status.textContent='地图加载失败，可以重试或切换地图。';
  } finally {
    if(token===request){busy.hidden=true;root.querySelector('#map-panel').setAttribute('aria-busy','false')}
  }
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>{if(current?.meta.id!==tab.dataset.map)load(tab.dataset.map,{push:true})});
  tab.addEventListener('keydown',event=>{
    let target;if(event.key==='ArrowRight')target=(index+1)%tabs.length;if(event.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')target=0;if(event.key==='End')target=tabs.length-1;
    if(target!==undefined){event.preventDefault();tabs[target].focus();tabs[target].click()}
  });
});
selector.addEventListener('change',()=>{if(selector.value)select(selector.value,{locate:true})});
root.querySelector('#map-search').addEventListener('input',event=>{
  const query=event.target.value.trim().toLowerCase();
  [...selector.options].forEach(option=>{option.hidden=!!option.value&&!option.textContent.toLowerCase().includes(query)&&!option.value.toLowerCase().includes(query)});
});
root.querySelector('#map-locate').addEventListener('click',()=>{if(selected)canvas.locate(selected)});
root.querySelector('#map-show-detail').addEventListener('click',()=>{if(selected)detail.show(service.detail(current,selected),{focus:true})});
root.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{
  if(!current)return;
  const commands={'zoom-in':()=>canvas.zoom(1.4),'zoom-out':()=>canvas.zoom(1/1.4),reset:()=>canvas.reset(),left:()=>canvas.pan(70,0),right:()=>canvas.pan(-70,0),up:()=>canvas.pan(0,70),down:()=>canvas.pan(0,-70)};
  commands[button.dataset.command]?.();
}));
root.querySelector('#map-retry').addEventListener('click',()=>{service.clear();const id=tabs.find(t=>t.getAttribute('aria-selected')==='true')?.dataset.map||'world';const p=params();load(id,{restore:true,projection:p.map===id?p.projection:null})});
const restore=()=>{const p=params(),s=history.state;load(p.map,{...p,view:s?.mapExplorerVersion===2&&s.mapId===p.map&&s.mapProjection===p.projection?s.mapView:null,restore:true})};
window.addEventListener('popstate',restore);window.addEventListener('hashchange',()=>{const p=params();if(current?.meta.id!==p.map||selected!==p.region||projection!==p.projection)restore()});
document.querySelector('.skip-link').addEventListener('click',event=>{
  event.preventDefault();canvas.svg.scrollIntoView({block:'center'});canvas.svg.focus({preventScroll:true});
});
restore();
