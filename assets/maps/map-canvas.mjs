const NS='http://www.w3.org/2000/svg',W=1000,H=620;
const svgNode=(tag,attrs={})=>{const node=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));return node};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class MapCanvas {
  constructor(svg,tooltip) {
    this.svg=svg;this.tooltip=tooltip;this.layers=new Map();this.pointers=new Map();this.view={x:0,y:0,k:1};
    this.viewport=svgNode('g',{'class':'map-viewport'});svg.append(this.viewport);
    this.onSelect=()=>{};this.onView=()=>{};
    this.resizeObserver=new ResizeObserver(()=>this.updateSmallRegions());this.resizeObserver.observe(svg);
    this.bind();
  }
  point(event) {return new DOMPoint(event.clientX,event.clientY).matrixTransform(this.svg.getScreenCTM().inverse())}
  show(map,projectionId=map.meta.projection) {
    this.hover(null);this.selected=null;
    this.map=map;this.projection=map.meta.projections.includes(projectionId)?projectionId:map.meta.projection;
    this.svg.dataset.projection=this.projection;this.svg.dataset.smallRegions='hidden';
    const cacheKey=map.meta.id+':'+this.projection;
    if(!this.layers.has(cacheKey)) {
      const d3=window.d3;
      const projection=this.projection==='albers-usa'?d3.geoAlbersUsa():this.projection==='equal-earth'?d3.geoEqualEarth():this.projection==='equirectangular'?d3.geoEquirectangular():d3.geoMercator();
      projection.fitExtent([[24,24],[W-24,H-24]],map.meta.id==='world'?{type:'Sphere'}:map.geometry);
      const path=d3.geoPath(projection),group=svgNode('g',{'class':'map-layer'}),nodes=new Map(),bounds=new Map(),drawn=new Map();
      if(map.meta.id==='world'){
        group.append(svgNode('path',{d:path({type:'Sphere'}),'class':'map-ocean'}));
        group.append(svgNode('path',{d:path(d3.geoGraticule10()),'class':'map-graticule'}));
      }
      for(const feature of map.geometry.features) {
        const d=path(feature);if(!d)throw Error('区域投影失败：'+feature.id);
        const region=map.regions[feature.id],node=svgNode('path',{d,'class':'map-region','data-region':feature.id,role:'button',tabindex:nodes.size?'-1':'0','aria-label':`${region.nameZh} · ${region.nameEn}`,'aria-pressed':'false'});
        const b=path.bounds(feature);bounds.set(feature.id,b);drawn.set(feature.id,d);nodes.set(feature.id,node);group.append(node);
      }
      // Tiny real polygons stay intact; small, explicitly styled locator dots
      // offer a usable pointer target. The region selector is the keyboard alternative.
      for(const [id,b] of bounds) if(b[1][0]-b[0][0]<3||b[1][1]-b[0][1]<3){
        group.append(svgNode('circle',{cx:(b[0][0]+b[1][0])/2,cy:(b[0][1]+b[1][1])/2,r:2.5,'class':'map-small-region','data-region':id,'aria-hidden':'true'}));
      }
      const lifted=svgNode('g',{'class':'map-lifted','aria-hidden':'true'});group.append(lifted);
      this.layers.set(cacheKey,{group,nodes,bounds,drawn,lifted,markers:[...group.querySelectorAll('.map-small-region')]});
    }
    this.layer=this.layers.get(cacheKey);
    this.viewport.replaceChildren(this.layer.group);
    this.svg.setAttribute('aria-label',`${map.meta.name}，${map.meta.count}个可选区域。方向键平移，加减键缩放，R恢复视角。`);
    this.select(null);this.reset();
  }
  getView(){return {...this.view}}
  setView(view){this.view={x:Number.isFinite(view?.x)?view.x:0,y:Number.isFinite(view?.y)?view.y:0,k:clamp(Number(view?.k)||1,1,64)};this.update()}
  updateSmallRegions(){
    const visible=Math.round(this.view.k*100)>600;
    this.svg.dataset.smallRegions=visible?'visible':'hidden';
    if(!visible||!this.layer)return;
    const m=this.svg.getScreenCTM(),scale=m?Math.hypot(m.a,m.b):1;
    // A 5 CSS-pixel dot plus a non-scaling transparent stroke gives a 19px hit area.
    for(const marker of this.layer.markers)marker.setAttribute('r',2.5/(this.view.k*(scale||1)));
  }
  update(){
    const v=this.view;v.x=clamp(v.x,W-W*v.k-W*.25,W*.25);v.y=clamp(v.y,H-H*v.k-H*.25,H*.25);
    this.viewport.setAttribute('transform',`translate(${v.x} ${v.y}) scale(${v.k})`);
    this.svg.dataset.zoom=v.k.toFixed(3);this.updateSmallRegions();this.onView(this.getView());
  }
  zoom(factor,point={x:W/2,y:H/2}){
    const v=this.view,k=clamp(v.k*factor,1,64),ratio=k/v.k;
    v.x=point.x-(point.x-v.x)*ratio;v.y=point.y-(point.y-v.y)*ratio;v.k=k;this.update();
    this.hover(null);
  }
  pan(dx,dy){this.view.x+=dx;this.view.y+=dy;this.update();this.hover(null)}
  reset(){this.view={x:0,y:0,k:1};this.update();this.hover(null)}
  locate(id){
    const b=this.layer?.bounds.get(id);if(!b)return;
    const k=clamp(.68*Math.min(W/Math.max(.5,b[1][0]-b[0][0]),H/Math.max(.5,b[1][1]-b[0][1])),1,64);
    this.setView({k,x:W/2-(b[0][0]+b[1][0])/2*k,y:H/2-(b[0][1]+b[1][1])/2*k});
  }
  select(id){
    this.layer?.nodes.forEach((node,key)=>{node.classList.toggle('is-selected',key===id);node.setAttribute('aria-pressed',String(key===id));node.setAttribute('tabindex',key===(id||this.map.geometry.features[0].id)?'0':'-1')});
    this.selected=id;
  }
  focusSelected(){this.layer?.nodes.get(this.selected)?.focus({preventScroll:true})}
  hover(id,event){
    if(this.hovered===id){if(event)this.moveTooltip(event);return}
    this.layer?.nodes.get(this.hovered)?.classList.remove('is-hovered');this.layer?.lifted.replaceChildren();this.hovered=id;
    this.tooltip.hidden=!id;this.svg.dataset.hovered=id||'';
    if(!id||!this.layer)return;
    const original=this.layer.nodes.get(id);if(!original)return;
    original.classList.add('is-hovered');
    const b=this.layer.bounds.get(id),cx=(b[0][0]+b[1][0])/2,cy=(b[0][1]+b[1][1])/2;
    const lifted=svgNode('path',{d:this.layer.drawn.get(id),'class':`map-region-lift${id===this.selected?' is-selected':''}`});
    // Geometry/hit area never move; only the pointer-free visual clone lifts.
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.reducedMotion!=='true')lifted.setAttribute('transform',`translate(${cx} ${cy-1.8/this.view.k}) scale(1.006) translate(${-cx} ${-cy})`);
    this.layer.lifted.append(lifted);
    this.tooltip.textContent=this.map.regions[id].nameZh+' · '+this.map.regions[id].nameEn;
    if(event)this.moveTooltip(event);
  }
  moveTooltip(event){
    const box=this.svg.parentElement.getBoundingClientRect();
    this.tooltip.style.left=clamp(event.clientX-box.left+14,8,Math.max(8,box.width-this.tooltip.offsetWidth-8))+'px';
    this.tooltip.style.top=clamp(event.clientY-box.top-38,8,Math.max(8,box.height-this.tooltip.offsetHeight-8))+'px';
  }
  bind(){
    const idOf=target=>target?.closest?.('[data-region]')?.dataset.region;
    this.svg.addEventListener('pointerover',event=>{if(event.pointerType==='mouse'&&!this.pointers.size)this.hover(idOf(event.target),event)});
    this.svg.addEventListener('pointerout',event=>{if(idOf(event.relatedTarget)!==this.hovered)this.hover(null)});
    this.svg.addEventListener('focusin',event=>{const id=idOf(event.target);if(id)this.hover(id)});
    this.svg.addEventListener('focusout',()=>this.hover(null));
    this.svg.addEventListener('click',event=>{if(event.detail===0){const id=idOf(event.target);if(id)this.onSelect(id)}});
    this.svg.addEventListener('wheel',event=>{event.preventDefault();this.zoom(Math.exp(-clamp(event.deltaY,-180,180)*.003),this.point(event))},{passive:false});
    this.svg.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      if(!this.pointers.size){this.suppressClick=false;this.travel=0;this.pendingRegion=idOf(event.target)}
      this.pointers.set(event.pointerId,this.point(event));this.svg.setPointerCapture(event.pointerId);
      if(this.pointers.size>1){this.suppressClick=true;this.pendingRegion=null}
      this.svg.classList.add('is-dragging');this.hover(null);
    });
    this.svg.addEventListener('pointermove',event=>{
      if(!this.pointers.has(event.pointerId)){if(this.hovered)this.moveTooltip(event);return}
      const old=[...this.pointers.values()],previous=this.pointers.get(event.pointerId),point=this.point(event);
      this.travel+=Math.hypot(point.x-previous.x,point.y-previous.y);if(this.travel>6)this.suppressClick=true;
      this.pointers.set(event.pointerId,point);const current=[...this.pointers.values()];
      if(current.length===1)this.pan(point.x-previous.x,point.y-previous.y);
      else if(current.length===2){
        const mid=a=>({x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}),distance=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
        const a=mid(old),b=mid(current);this.zoom(distance(current)/Math.max(1,distance(old)),a);this.pan(b.x-a.x,b.y-a.y);
      }
    });
    const end=event=>{
      if(event.type==='pointerup'&&this.pointers.size===1&&!this.suppressClick&&this.pendingRegion)this.onSelect(this.pendingRegion);
      this.pointers.delete(event.pointerId);
      if(!this.pointers.size){this.svg.classList.remove('is-dragging');this.pendingRegion=null}
      if(event.type==='pointercancel')this.suppressClick=true;
    };
    this.svg.addEventListener('pointerup',end);this.svg.addEventListener('pointercancel',end);this.svg.addEventListener('lostpointercapture',end);
    this.svg.addEventListener('keydown',event=>{
      const commands={ArrowLeft:()=>this.pan(50,0),ArrowRight:()=>this.pan(-50,0),ArrowUp:()=>this.pan(0,50),ArrowDown:()=>this.pan(0,-50),'+':()=>this.zoom(1.35),'=':()=>this.zoom(1.35),'-':()=>this.zoom(1/1.35),r:()=>this.reset(),R:()=>this.reset()};
      if(commands[event.key]){event.preventDefault();commands[event.key]()}
      if(['Enter',' '].includes(event.key)&&idOf(event.target)){event.preventDefault();this.onSelect(idOf(event.target))}
    });
  }
}
