// Start the local server and an isolated agent-browser session, then run this.
// AGENT_BROWSER_BIN can point at the native CLI executable on Windows.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const session=process.env.LINETOP_QA_SESSION||'linetop-maps';
const cli=process.env.AGENT_BROWSER_BIN||'agent-browser';
const out=resolve(process.env.LINETOP_QA_OUT||'.tmp/map-revision-1/browser');mkdirSync(out,{recursive:true});
const revisionOnly=process.argv.includes('--revision-only');
const data=JSON.parse(execFileSync(cli,['--session',session,'--json','get','cdp-url'],{encoding:'utf8'}));
const ws=new WebSocket(data.data.cdpUrl);
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
let next=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{
  const m=JSON.parse(e.data),p=pending.get(m.id);
  if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
  if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
  if(m.method==='Log.entryAdded'&&m.params.entry.level==='error') errors.push(m.params.entry);
};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
  const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout: '+method))},20000);
  pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
});
const targets=(await send('Target.getTargets')).targetInfos;
const page=targets.find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1:8765/'));
if(!page) throw Error('Open the verified local URL in the isolated session first');
const ps=(await send('Target.attachToTarget',{targetId:page.targetId,flatten:true})).sessionId;
for(const domain of ['Page','Runtime','Log']) await send(domain+'.enable',{},ps);
const ev=async expression=>{
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},ps);
  if(r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;
};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const tick=()=>ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
const reload=async()=>{
  await send('Page.reload',{ignoreCache:true},ps);await wait(120);
  for(let i=0;i<100;i++){try{if(await ev('document.readyState==="complete"&&!!window.LineTopTheme&&document.querySelectorAll(".palette-option").length===8')){await tick();return}}catch{}await wait(40)}
  throw Error('Reload did not finish');
};
const shot=async name=>{await wait(280);const s=await send('Page.captureScreenshot',{format:'png'},ps);writeFileSync(resolve(out,name+'.png'),Buffer.from(s.data,'base64'))};
const viewport=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},ps);await tick()};
const key=async(key,code=key,number)=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key,code,...(number?{windowsVirtualKeyCode:number}: {})},ps)};
const click=async selector=>{
  await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest',inline:'nearest'})`);
  await wait(380); // Let the preserved dock/filled-layer movement settle before hit testing.
  const r=await ev(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);
  for(const type of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent',{type,x:r.x+r.width/2,y:r.y+r.height/2,button:'left',clickCount:1},ps);
};
const report={checks:[],errors,screenshots:[]};
const save=()=>writeFileSync(resolve(out,'browser-results.json'),JSON.stringify(report,null,2));
const check=(name,ok,detail)=>{report.checks.push({name,passed:!!ok,detail});save();if(!ok)throw Error(name+' '+JSON.stringify(detail))};
const until=async(expression)=>{for(let i=0;i<160;i++){if(await ev(expression))return;await wait(50)}throw Error('Wait failed: '+expression)};
const ready=id=>until(`document.querySelector('#map-explorer')?.dataset.ready==='true'&&document.querySelector('[data-map="${id}"]').getAttribute('aria-selected')==='true'`);
const navigate=async url=>{await send('Page.navigate',{url},ps);await wait(200);await until('document.readyState==="complete"');await wait(350)};
const state=()=>ev(`({zoom:Number(document.querySelector('#map-svg').dataset.zoom),transform:document.querySelector('.map-viewport').getAttribute('transform'),selected:document.querySelector('.map-region.is-selected')?.dataset.region,hash:location.hash})`);
const maps=[['world',239,'BRA'],['china',34,'CN-SC'],['usa',51,'US-TX'],['japan',47,'JP-01']];
async function pointFor(id){return ev(`(()=>{const p=document.querySelector('.map-region[data-region="${id}"]'),b=p.getBBox(),m=p.getScreenCTM();for(let y=.15;y<.95;y+=.1)for(let x=.15;x<.95;x+=.1){const q=new DOMPoint(b.x+b.width*x,b.y+b.height*y);if(p.isPointInFill(q)){const s=q.matrixTransform(m);if(document.elementFromPoint(s.x,s.y)?.closest('[data-region]')?.dataset.region==='${id}')return {x:s.x,y:s.y}}}return null})()`)}
const projectionReady=p=>until(`document.querySelector('#map-explorer')?.dataset.ready==='true'&&document.querySelector('#map-svg').dataset.projection==='${p}'`);
async function setZoom(k){
  await ev('document.querySelector(".map-canvas").scrollIntoView({block:"center"})');await tick();
  const r=await ev('document.querySelector("#map-svg").getBoundingClientRect().toJSON()');
  for(let i=0;i<16;i++){
    const now=(await state()).zoom;if(Math.abs(now-k)<.0006)break;
    const deltaY=Math.max(-180,Math.min(180,-Math.log(k/now)/.003));
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:r.x+r.width/2,y:r.y+r.height/2,deltaX:0,deltaY},ps);await wait(40);
  }
  await tick();
}
async function revisionChecks(){
  await viewport(1440,900);await navigate('http://127.0.0.1:8765/map.html?qa='+Date.now()+'#map=world&region=CHN');await ready('world');
  check('world defaults to original Equal Earth first',await ev('document.querySelector("#map-svg").dataset.projection==="equal-earth"&&location.hash.includes("projection=equal-earth")&&document.querySelector("[data-projection]").dataset.projection==="equal-earth"'));
  check('world HK/Macao/Taiwan share CHN selection',await ev('!["TWN","HKG","MAC"].some(id=>document.querySelector(`.map-region[data-region="${id}"]`)||document.querySelector(`#map-region option[value="${id}"]`))&&document.querySelector("[data-detail-id]").textContent==="CHN"'));
  await ev('window.qaPaths={};window.qaLayers={};window.qaMarkers={};');
  for(const [id] of maps){
    await click(`[data-map="${id}"]`);await ready(id);
    const choices=id==='usa'?['albers-usa']:id==='world'?['equal-earth','equirectangular','mercator']:['mercator','equirectangular'];
    check(id+' projection controls availability',await ev(`document.querySelector('#map-projection').hidden===${id==='usa'}`));
    for(const p of choices){
      if(p!=='albers-usa'){await ev(`document.querySelector('[data-projection="${p}"]').scrollIntoView({block:'center'})`);await click(`[data-projection="${p}"]`)}
      await projectionReady(p);
      const sample=id==='world'?'CHN':id==='china'?'CN-TW':id==='usa'?'US-DC':'JP-13';
      await ev(`document.querySelector('#map-region').value='${sample}';document.querySelector('#map-region').dispatchEvent(new Event('change'));document.querySelector('#map-detail-close').click();document.querySelector('[data-command=reset]').click()`);
      await tick();
      const key=id+':'+p;
      check(key+' real paths/bounds recomputed',await ev(`(()=>{const key='${key}',path=document.querySelector('.map-region[data-region="${sample}"]').getAttribute('d');window.qaPaths[key]=path;window.qaLayers[key]=document.querySelector('.map-layer');window.qaMarkers[key]=[...document.querySelectorAll('.map-small-region')].map(c=>[c.dataset.region,c.getAttribute('cx'),c.getAttribute('cy')]);return !!path&&!path.includes('NaN')})()`));
      for(const [k,label,visible] of [[1,100,false],[5.38,538,false],[6,600,false],[6.004,600,false],[6.006,601,true],[7.53,753,true],[64,6400,true]]){
        await setZoom(k);
        const result=await ev(`({label:document.querySelector('#map-zoom-level').textContent,visible:document.querySelector('#map-svg').dataset.smallRegions,markers:[...document.querySelectorAll('.map-small-region')].map(c=>({display:getComputedStyle(c).display,width:c.getBoundingClientRect().width,aria:c.getAttribute('aria-hidden')}))})`);
        check(`${key} ${k}x/${label}% marker gate`,result.label===label+'%'&&result.visible===(visible?'visible':'hidden')&&result.markers.every(m=>m.aria==='true'&&(visible?m.display!=='none'&&Math.abs(m.width-5)<.6:m.display==='none'&&m.width===0)),result);
      }
      if(id==='world'){
        await click('[data-command=reset]');
        const unchanged=(await state()).selected;
        for(const point of [[0,0],[-140,0],[80,-30]]){
          const q=await ev(`(()=>{const p=window.d3.${p==='equal-earth'?'geoEqualEarth':p==='mercator'?'geoMercator':'geoEquirectangular'}().fitExtent([[24,24],[976,596]],{type:'Sphere'}),xy=p(${JSON.stringify(point)}),q=new DOMPoint(...xy).matrixTransform(document.querySelector('#map-svg').getScreenCTM());return {x:q.x,y:q.y}})()`);
          await send('Input.dispatchMouseEvent',{type:'mouseMoved',...q},ps);await tick();
          check(`${p} ocean ${point} does not hover Antarctica`,await ev('!document.querySelector("#map-svg").dataset.hovered&&document.querySelector("#map-tooltip").hidden'));
          for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,...q,button:'left',clickCount:1},ps);
          check(`${p} ocean ${point} does not select land`,(await state()).selected===unchanged);
        }
        const land=await pointFor('ATA');check(p+' Antarctica land remains clickable',!!land,land);
        if(land){for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,...land,button:'left',clickCount:1},ps);check(p+' Antarctica native land selection',(await state()).selected==='ATA');await ev('document.querySelector("#map-detail-close").click()')}
        await ev('document.querySelector("#map-region").value="VAT";document.querySelector("#map-region").dispatchEvent(new Event("change"));document.querySelector("#map-detail-close").click()');
        for(const k of [6,6.01,64]){
          await setZoom(k);
          const hit=await ev(`(()=>{const c=document.querySelector('.map-small-region[data-region="VAT"]'),v=document.querySelector('.map-viewport'),q=new DOMPoint(c.cx.baseVal.value,c.cy.baseVal.value).matrixTransform(v.getScreenCTM()),x=q.x+8,y=q.y;const hit=document.elementFromPoint(x,y);return {x,y,circle:hit===c,region:hit?.dataset.region,width:c.getBoundingClientRect().width}})()`);
          check(`${p}/${k}x marker real pointer hit`,hit.circle===(k>6),hit);
          if(k>6){for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:hit.x,y:hit.y,button:'left',clickCount:1},ps);check(`${p}/${k}x marker native click`,(await state()).selected==='VAT');await ev('document.querySelector("#map-detail-close").click()')}
          await shot(`marker-world-${p}-${k}`);
        }
      }
      await click('[data-command=reset]');await ev('document.querySelector(".map-canvas").scrollIntoView({block:"center"})');await shot(`${id}-${p}-full`);
    }
    if(id!=='usa')check(id+' projection path actually changes',await ev(`qaPaths['${id}:${choices[0]}']!==qaPaths['${id}:${choices[1]}']`));
    if(id==='world')check('world marker set/positions reprojected',await ev(`JSON.stringify(qaMarkers['world:equirectangular'])!==JSON.stringify(qaMarkers['world:mercator'])`));
  }
  // Same-document switches preserve selection and avoid fetching any map files.
  await click('[data-map=world]');await ready('world');
  await ev('document.querySelector("#map-region").value="CHN";document.querySelector("#map-region").dispatchEvent(new Event("change"));document.querySelector("#map-detail-close").click();document.querySelector("[data-command=reset]").click()');
  await click('[data-projection=equirectangular]');await projectionReady('equirectangular');await setZoom(1.4);await wait(160);
  const requestsBefore=await ev('performance.getEntriesByType("resource").filter(r=>r.name.includes("/data/")).length');
  await ev('document.querySelector("[data-projection=mercator]").focus()');await key(' ','Space',32);await projectionReady('mercator');
  check('keyboard projection retains selection/detail resets camera',(await state()).selected==='CHN'&&(await state()).zoom===1&&await ev('document.querySelector("[data-detail-id]").textContent==="CHN"'));
  check('projection never refetches map resources',await ev('performance.getEntriesByType("resource").filter(r=>r.name.includes("/data/")).length')===requestsBefore);
  check('projection restores cached layer',await ev('document.querySelector(".map-layer")===qaLayers["world:mercator"]'));
  await ev('history.back()');await projectionReady('equirectangular');check('back restores projection and camera',Math.abs((await state()).zoom-1.4)<.005&&(await state()).selected==='CHN');
  await ev('history.forward()');await projectionReady('mercator');check('forward restores projection',(await state()).zoom===1);
  await click('[data-map=china]');await ready('china');check('map restores prior projection',await ev('document.querySelector("#map-svg").dataset.projection==="equirectangular"'));
  await click('[data-map=world]');await ready('world');check('world restores prior projection/selection',await ev('document.querySelector("#map-svg").dataset.projection==="mercator"')&&(await state()).selected==='CHN');
  await reload();await ready('world');check('refresh keeps projection/region',await ev('location.hash.includes("projection=mercator")&&document.querySelector("#map-svg").dataset.projection==="mercator"')&&(await state()).selected==='CHN');
  for(const [region,label] of [['TWN','台湾省'],['HKG','香港特别行政区'],['MAC','澳门特别行政区']]){
    await navigate('http://127.0.0.1:8765/map.html#map=world&region='+region);await ready('world');check(region+' legacy world link selects China',(await state()).selected==='CHN');
    const id={TWN:'CN-TW',HKG:'CN-HK',MAC:'CN-MO'}[region];await navigate('http://127.0.0.1:8765/map.html#map=china&region='+id);await ready('china');check(label+' retained in provincial map',await ev('document.querySelector("[data-detail-title]").textContent')===label);
    await shot('china-'+region);
  }
  for(const [w,h] of [[1440,900],[768,1024],[375,812]])for(const mode of ['light','dark']){
    await viewport(w,h);await navigate('http://127.0.0.1:8765/map.html#map=world');await ready('world');
    await ev(`if(document.documentElement.dataset.theme!=='${mode}')document.querySelector('#lt-theme-toggle').click()`);await wait(190);
    for(const p of ['equal-earth','equirectangular','mercator']){
      await ev(`document.querySelector('[data-projection="${p}"]').scrollIntoView({block:'center'})`);await click(`[data-projection="${p}"]`);await projectionReady(p);
      check(`${w}/${mode}/${p} controls fit/44px/focus`,await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth&&[...document.querySelectorAll('[data-projection]')].every(b=>b.getBoundingClientRect().height>=44)&&document.querySelector('[data-projection="${p}"]').getAttribute('aria-pressed')==='true'`));
      await shot(`projection-${w}-${mode}-${p}`);
      await ev('document.querySelector("#map-region").value="VAT";document.querySelector("#map-region").dispatchEvent(new Event("change"));document.querySelector("#map-detail-close").click()');await setZoom(64);
      check(`${w}/${mode}/${p} 64x dots stable`,await ev('[...document.querySelectorAll(".map-small-region")].every(c=>Math.abs(c.getBoundingClientRect().width-5)<.6)'));
      await shot(`dot-${w}-${mode}-${p}`);
    }
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},ps);
  await click('[data-projection=equirectangular]');await projectionReady('equirectangular');check('reduced motion no region transition',await ev('getComputedStyle(document.querySelector(".map-region")).transitionDuration==="0s"'));
  await send('Emulation.setEmulatedMedia',{features:[]},ps);
}
try {
  await revisionChecks();
  if(!revisionOnly){
  await viewport(1440,900);await navigate('http://127.0.0.1:8765/map.html');await ready('world');
  check('shared four-entry sidebar',await ev('[...document.querySelectorAll(".sidebar-nav a")].map(x=>x.textContent).join(",")==="首页,项目,故事,关于"'));
  await ev(`document.querySelector('[data-command="zoom-in"]').click();document.querySelector('[data-map="china"]').click()`);await ready('china');await ev('history.back()');await ready('world');
  check('quick tab switch flushes source camera',(await state()).zoom>1.3);await click('[data-command="reset"]');
  for(const [id,count,region] of maps){
    await click(`[data-map="${id}"]`);await ready(id);await ev('document.querySelector(".map-canvas").scrollIntoView({block:"center"})');await tick();
    check(id+' exact real SVG regions',await ev(`document.querySelectorAll('.map-region').length===${count}&&document.querySelector('#map-region').options.length===${count+1}`));
    const point=await pointFor(region);check(id+' visible geography hit',!!point,point);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point},ps);await tick();
    check(id+' hover name/lift/highlight',await ev(`document.querySelector('#map-svg').dataset.hovered==='${region}'&&!document.querySelector('#map-tooltip').hidden&&!!document.querySelector('.map-lifted path')`));
    for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,...point,button:'left',clickCount:1},ps);await tick();
    check(id+' native click selects/details',await ev(`document.querySelector('.map-region.is-selected')?.dataset.region==='${region}'&&document.querySelector('[data-detail-id]').textContent==='${region}'`));
    check(id+' honest details',await ev('[...document.querySelectorAll("[data-detail-fields] dd")].length>=2&&[...document.querySelectorAll("[data-detail-fields] dd")].every(e=>e.textContent==="第二阶段接入")'));
    await shot(id+'-selected');report.screenshots.push(id+'-selected.png');
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:-150},ps);await wait(180);check(id+' wheel zoom',(await state()).zoom>1);
    const old=await state();
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1},ps);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x+50,y:point.y+20,button:'left',buttons:1},ps);
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x+50,y:point.y+20,button:'left',clickCount:1},ps);await tick();
    check(id+' mouse drag preserves selection',(await state()).transform!==old.transform&&(await state()).selected===region);
    await click('[data-command="reset"]');check(id+' reset',(await state()).zoom===1);
    await click('[data-command="zoom-in"]');check(id+' plus',(await state()).zoom>1);
    await click('[data-command="zoom-out"]');check(id+' minus',(await state()).zoom===1);
    await click('[data-command="right"]');check(id+' alternative pan',(await state()).transform!=='translate(0 0) scale(1)');await click('[data-command="reset"]');
  }
  await click('[data-map="china"]');await ready('china');await ev(`document.querySelector('#map-region').value='CN-JL';document.querySelector('#map-region').dispatchEvent(new Event('change'))`);await tick();
  check('selector locates Jilin',(await state()).selected==='CN-JL');
  await ev('document.querySelector(".skip-link").click()');await tick();check('skip link preserves current map/region',await ev('location.hash.includes("map=china")&&document.querySelector(".map-region.is-selected")?.dataset.region==="CN-JL"&&document.activeElement.id==="map-svg"'));
  await click('[data-map="usa"]');await ready('usa');await ev('history.back()');await ready('china');check('back restores map and selection',(await state()).selected==='CN-JL');
  await ev('history.forward()');await ready('usa');check('forward restores USA',await ev('location.hash.includes("map=usa")'));
  await navigate('http://127.0.0.1:8765/map.html#map=japan&region=JP-13');await ready('japan');check('deep link restores Tokyo',(await state()).selected==='JP-13');
  await ev('document.querySelector("#map-detail-close").click();document.querySelector("#map-svg").focus()');await key('+','Equal',187);check('keyboard zoom',(await state()).zoom>1);await key('r','KeyR',82);check('keyboard reset',(await state()).zoom===1);
  await ev('document.querySelector("#map-tab-world").focus()');await key('ArrowRight','ArrowRight',39);await ready('china');check('keyboard map tabs',await ev('document.activeElement.id==="map-tab-china"'));
  for(const [w,h] of [[1440,900],[768,1024],[375,812],[320,740]]){
    await viewport(w,h);await navigate('http://127.0.0.1:8765/map.html#map=china&region=CN-HK');await ready('china');
    check(`${w} no overflow`,await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));
    check(`${w} Hong Kong remains selectable`,await ev('document.querySelector("[data-detail-title]").textContent==="香港特别行政区"'));
    if(w<=900){check(`${w} drawer fits`,await ev('(()=>{const r=document.querySelector(".map-detail").getBoundingClientRect();return r.y>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})()'));await shot(`mobile-${w}-drawer`);await click('#map-detail-close');check(`${w} closes drawer`,await ev('document.querySelector(".map-detail").dataset.open==="false"'))}
  }
  await viewport(375,812);await navigate('http://127.0.0.1:8765/map.html#map=china');await ready('china');await ev('document.querySelector(".map-canvas").scrollIntoView({block:"center"})');await tick();
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5},ps);
  const rect=await ev('document.querySelector("#map-svg").getBoundingClientRect().toJSON()'),cx=rect.x+rect.width*.45,cy=rect.y+rect.height*.4;
  const t=(id,x,y)=>({id,x,y,radiusX:1,radiusY:1,force:1});
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[t(1,cx,cy)]},ps);await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[t(1,cx+40,cy+20)]},ps);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},ps);await tick();check('native touch drag',(await state()).transform!=='translate(0 0) scale(1)');
  await click('[data-command="reset"]');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[t(1,cx-25,cy),t(2,cx+25,cy)]},ps);await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[t(1,cx-65,cy),t(2,cx+65,cy)]},ps);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},ps);await tick();check('native two-finger pinch',(await state()).zoom>1.7,await state());
  await send('Emulation.setTouchEmulationEnabled',{enabled:false},ps);await shot('mobile-touch-zoom');
  await viewport(1440,900);await navigate('http://127.0.0.1:8765/map.html');await ready('world');
  for(const palette of await ev('LineTopTheme.palettes.map(p=>p.id)'))for(const mode of ['light','dark']){
    await ev(`(()=>{if(document.documentElement.dataset.theme!=='${mode}')document.querySelector('#lt-theme-toggle').click();const r=document.querySelector('input[value="${palette}"]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}))})()`);await wait(210);
    for(const [id,count] of maps){await ev(`document.querySelector('[data-map="${id}"]').click()`);await ready(id);await wait(180);check(`${palette}/${mode}/${id} themed layout`,await ev(`(()=>{const root=getComputedStyle(document.documentElement),hex=root.getPropertyValue('--color-tertiary-subtle').trim(),rgb='rgb('+hex.slice(1).match(/../g).map(v=>parseInt(v,16)).join(', ')+')';return document.querySelectorAll('.map-region').length===${count}&&document.documentElement.scrollWidth<=document.documentElement.clientWidth&&getComputedStyle(document.querySelector('.map-region:not(.is-selected)')).fill===rgb})()`));if(id==='world'){await ev('document.querySelector(".map-canvas").scrollIntoView({block:"center"})');await shot(`theme-${palette}-${mode}`)}}
  }
  check('all four geometries fetched only once per document',await ev(`['world','china','usa','japan'].every(id=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/data/maps/'+id+'.geojson')).length===1)`));
  await ev('document.querySelector("[data-map=world]").click();document.querySelector("[data-map=china]").click();document.querySelector("[data-map=japan]").click()');await ready('japan');check('rapid switching latest wins',await ev('document.querySelectorAll(".map-region").length===47'));
  const hook=await send('Page.addScriptToEvaluateOnNewDocument',{source:`const original=window.fetch;let failed=false;window.fetch=(url,options)=>{if(String(url).includes('/maps/world.geojson')&&!failed){failed=true;return Promise.reject(new TypeError('fixture network failure'))}return original(url,options)}`},ps);
  await navigate('http://127.0.0.1:8765/map.html');await until('!document.querySelector("#map-error").hidden');check('failure exposes retry',await ev('document.querySelector("#map-retry").getClientRects().length>0'));await click('#map-retry');await ready('world');check('retry recovers',await ev('document.querySelectorAll(".map-region").length===239'));await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:hook.identifier},ps);
  await navigate('http://127.0.0.1:8765/map.html#map=obsolete&region=bad');await ready('world');check('invalid URL defaults safely',await ev('location.hash==="#map=world&projection=equal-earth"'));
  await navigate('http://127.0.0.1:8765/');await wait(650);check('original home scene motion enabled',await ev('document.documentElement.dataset.experience==="scene"'),await ev('document.documentElement.dataset.sceneFallback'));
  for(const [id,u,group] of [['welcome',0,'home'],['personal',.9,'home'],['projects',1.63,'projects'],['story',2.32,'story'],['story-notes',3.07,'story'],['about',3.82,'about'],['likes',4.57,'about'],['footer',5.32,'about']]){await ev(`scrollTo(0,innerHeight*${u})`);await tick();check(id+' group navigation',await ev(`document.documentElement.dataset.sceneCurrent==='${id}'&&document.querySelector('[aria-current="location"]')?.dataset.section==='${group}'`))}
  await click('.sidebar-nav a[data-section="story"]');await wait(1300);check('story route',await ev('location.hash==="#story"&&document.documentElement.dataset.sceneCurrent==="story"'));
  await click('.sidebar-nav a[data-section="about"]');await wait(1300);await ev('history.back()');await wait(250);check('main back restores story',await ev('location.hash==="#story"'));await ev('history.forward()');await wait(250);check('main forward restores about',await ev('location.hash==="#about"'));
  await navigate('http://127.0.0.1:8765/#tools');check('legacy tools link resolves',await ev('document.documentElement.dataset.sceneCurrent==="about"'));
  await viewport(375,812);await navigate('http://127.0.0.1:8765/');await wait(650);await click('.menu-trigger');await click('.sidebar-nav a[data-section="projects"]');await wait(1300);check('mobile four-link navigation',await ev('location.hash==="#projects"&&!document.documentElement.classList.contains("menu-open")'),await ev('document.documentElement.dataset.experience'));await shot('home-mobile-projects');await click('.tool-catalog-link');await ready('world');check('AI tool entry loads map',await ev('location.pathname.endsWith("/map.html")'));
  }
  check('no runtime errors',errors.length===0,errors);report.completed=true;save();console.log(`PASS: ${report.checks.length} map/browser checks`);
}catch(reason){await shot('failure');report.failure=String(reason);save();throw reason}
finally{ws.close()}
