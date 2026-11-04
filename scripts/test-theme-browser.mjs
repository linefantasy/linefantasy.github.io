// Start the local server and an isolated agent-browser session, then run this.
// AGENT_BROWSER_BIN can point at the native CLI executable on Windows.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const session=process.env.LINETOP_QA_SESSION||'linetop-palettes';
const cli=process.env.AGENT_BROWSER_BIN||'agent-browser';
const out=resolve(process.env.LINETOP_QA_OUT||'.tmp/palettes-2026-11-04');mkdirSync(out,{recursive:true});
const quick=process.argv.includes('--quick');
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
  await wait(380); // Let the preserved dock/filled-layer movement settle before hit testing.
  const r=await ev(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);
  for(const type of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent',{type,x:r.x+r.width/2,y:r.y+r.height/2,button:'left',clickCount:1},ps);
};
const report={checks:[],matrix:[],screenshots:[],errors};
const save=()=>writeFileSync(resolve(out,quick?'browser-quick-results.json':'browser-results.json'),JSON.stringify(report,null,2));
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});save();if(!passed)throw Error(name+' '+JSON.stringify(detail))};
const state=()=>ev(`({palette:document.documentElement.dataset.palette,mode:document.documentElement.dataset.theme,y:scrollY,hash:location.hash,current:document.documentElement.dataset.sceneCurrent,experience:document.documentElement.dataset.experience})`);
const choose=async id=>{
  await ev(`(()=>{const input=document.querySelector('input[value="${id}"]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  await wait(220);await tick();
};
const open=async()=>{
  await ev('document.querySelector("#lt-settings-gear").focus()');await tick();
  if(await ev('document.querySelector(".quick-settings").dataset.open!=="true"')) await click('#lt-settings-gear');
  if(await ev('document.querySelector("#lt-palette-panel").hidden')) await click('#lt-palette-toggle');
  await wait(380);
};
try {
  await viewport(1440,900);
  await ev('localStorage.clear()');await reload();await wait(650);
  check('first visit: original + light',await ev('document.documentElement.dataset.palette==="original"&&document.documentElement.dataset.theme==="light"'));
  check('8 native accessible radio options',await ev('document.querySelectorAll("input[type=radio][name=linetop-palette]").length===8&&document.querySelectorAll("input:checked").length===1'));
  check('inline wordmarks preserve two unique instances',await ev('document.querySelectorAll("svg.hero-wordmark,svg.mini-wordmark").length===2&&new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size===document.querySelectorAll("[id]").length'));
  await open();await key('ArrowDown','ArrowDown',40);await wait(220);
  check('native keyboard arrow selects and persists',await ev('document.documentElement.dataset.palette==="crimson-gold"&&localStorage.getItem("linetop-palette")==="crimson-gold"'));
  await key('Escape','Escape',27);
  check('Escape closes palette, focus returns to palette button',await ev('document.querySelector("#lt-palette-panel").hidden&&document.activeElement.id==="lt-palette-toggle"'));
  await key('Escape','Escape',27);
  check('second Escape collapses dock and returns gear',await ev('document.querySelector(".quick-settings").dataset.open==="false"&&document.activeElement.id==="lt-settings-gear"'));
  await open();await click('#lt-palette-close');
  check('close button and reopen work',await ev('document.querySelector("#lt-palette-panel").hidden'));await open();
  await ev('document.querySelector("#lt-motion-toggle").focus()');
  check('focus leaving popover closes it before another dock action is obscured',await ev('document.querySelector("#lt-palette-panel").hidden'));await open();
  await ev('document.querySelector(".hero-greeting").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');
  check('outside pointer closes settings',await ev('document.querySelector("#lt-palette-panel").hidden&&document.querySelector(".quick-settings").dataset.open==="false"'));
  await open();await choose('forest');await click('#lt-theme-toggle');await wait(220);
  check('mode and palette saved independently',await ev('localStorage.getItem("linetop-theme")==="dark"&&localStorage.getItem("linetop-palette")==="forest"'),await state());
  await reload();
  check('reload preserves both dimensions',await ev('document.documentElement.dataset.theme==="dark"&&document.documentElement.dataset.palette==="forest"'));
  const scenes=[['welcome',0],['personal',.9],['projects',1.63],['story',2.32],['story-notes',3.07],['about',3.82],['likes',4.57],['footer',5.32]];
  const palettes=await ev('LineTopTheme.palettes.map(p=>p.id)');
  for(const [width,height] of (quick?[]:[[1440,900],[768,1024],[375,812]])) {
    await viewport(width,height);await reload();await wait(100);
    for(const id of palettes) for(const mode of ['light','dark']) {
      await open();await choose(id);
      if((await state()).mode!==mode){await key('Escape','Escape',27);await click('#lt-theme-toggle');await wait(220);await open()}
      const info=await ev(`(()=>{const c=getComputedStyle(document.documentElement);return {palette:document.documentElement.dataset.palette,mode:document.documentElement.dataset.theme,bases:['primary','secondary','tertiary'].map(x=>c.getPropertyValue('--color-'+x).trim()),panel:document.querySelector('#lt-palette-panel').getBoundingClientRect().toJSON(),checked:document.querySelector('input:checked').value}})()`);
      check(`${width}/${id}/${mode}: setting and panel fit`,info.palette===id&&info.mode===mode&&info.checked===id&&info.panel.x>=0&&info.panel.right<=width&&info.panel.top>=0&&info.panel.bottom<=height,info);
      if(id!=='original') {
        const residues=await ev(`(()=>{const old=['rgb(217, 255, 0)','rgb(79, 255, 196)','rgb(49, 169, 255)'];const properties=['color','backgroundColor','borderTopColor','borderRightColor','outlineColor','fill','stroke','boxShadow','textShadow','backgroundImage'];return [...document.querySelectorAll('body *')].filter(e=>!e.closest('.palette-swatches')).flatMap(e=>[null,'::before','::after'].flatMap(p=>{const c=getComputedStyle(e,p);return properties.filter(k=>old.some(v=>c[k]?.includes(v))).map(k=>({tag:e.tagName,cls:e.getAttribute('class'),pseudo:p,property:k,value:c[k]}))}))})()`);
        check(`${width}/${id}/${mode}: no original accent in DOM/styles/pseudo-elements`,residues.length===0,residues);
      }
      if(width===1440||width===375){await shot(`${width}-${id}-${mode}-settings`);report.screenshots.push(`${width}-${id}-${mode}-settings.png`)}
      await key('Escape','Escape',27);await key('Escape','Escape',27);
      const before=await state();
      for(const [scene,u] of scenes) {
        await ev(`scrollTo(0,innerHeight*${u})`);await tick();
        const row=await ev(`(()=>{const root=document.documentElement,el=document.querySelector('[data-scene="${scene}"]'),c=getComputedStyle(el);return {scene:${JSON.stringify(scene)},current:root.dataset.sceneCurrent,experience:root.dataset.experience,overflow:root.scrollWidth>root.clientWidth+1,fit:el.scrollHeight<=innerHeight+2,opacity:c.opacity,sun:getComputedStyle(document.querySelector('.shared-sun')).fill,band:getComputedStyle(el.querySelector('.scene-backdrop'),'::before').backgroundColor}})()`);
        report.matrix.push({width,height,id,mode,...row});
        check(`${width}/${id}/${mode}/${scene}: layout`,!row.overflow&&row.fit&&row.current===scene&&Number(row.opacity)>.99,row);
        if(width===1440||width===375){const name=`${width}-${id}-${mode}-${scene}`;await shot(name);report.screenshots.push(name+'.png')}
      }
      // Switch color at an existing scene without changing route, progress, or mode.
      const prev=await state();await open();await choose(id===palettes[0]?palettes[1]:palettes[0]);const after=await state();
      check(`${width}/${id}/${mode}: live switch preserves scene`,prev.mode===after.mode&&prev.hash===after.hash&&prev.current===after.current&&Math.abs(prev.y-after.y)<1,{prev,after});
    }
  }
  // Narrow/landscape and long-panel scrolling; native controls must remain reachable.
  for(const [w,h] of [[320,740],[812,375]]) {
    await viewport(w,h);await reload();await open();
    check(`${w}x${h}: palette fits viewport`,await ev('(()=>{const r=document.querySelector(".palette-panel").getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&document.documentElement.scrollWidth<=document.documentElement.clientWidth})()'));
    await ev('document.querySelector("input[value=ocean-gold]").focus()');await key(' ','Space',32);await wait(220);
    check(`${w}x${h}: last radio reachable by keyboard`,await ev('document.documentElement.dataset.palette==="ocean-gold"'));
  }
  await viewport(375,812);await reload();await open();await key('Escape','Escape',27);await key('Escape','Escape',27);
  await click('.menu-trigger');
  check('mobile navigation isolates and closes palette dock',await ev('document.querySelector(".quick-settings").inert&&document.querySelector("#lt-palette-panel").hidden&&document.documentElement.classList.contains("menu-open")'));
  await click('.sidebar-nav a[data-section="about"]');await wait(1200);
  check('mobile navigation still reaches scene',await ev('location.hash==="#about"&&!document.documentElement.classList.contains("menu-open")'));
  await viewport(1440,900);await reload();
  await ev('localStorage.setItem("linetop-theme","bad");localStorage.setItem("linetop-palette","expired");localStorage.setItem("linetop-reduce-motion","true")');await reload();
  check('invalid palette/mode fallback preserves motion preference',await ev('document.documentElement.dataset.palette==="original"&&document.documentElement.dataset.theme==="light"&&document.documentElement.dataset.reducedMotion==="true"'));
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},ps);await open();await choose('glacier');
  check('reduced motion disables theme transitions and keeps selection usable',await ev('!document.documentElement.classList.contains("theme-changing")&&getComputedStyle(document.body).transitionDuration==="0s"&&document.documentElement.dataset.palette==="glacier"'));
  await send('Emulation.setEmulatedMedia',{features:[]},ps);
  await ev('localStorage.clear()');await reload();
  const hook=await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(Storage.prototype,"getItem",{value(){throw Error("blocked")}});Object.defineProperty(Storage.prototype,"setItem",{value(){throw Error("blocked")}})'},ps);
  await reload();await open();await choose('crimson-gold');
  check('blocked storage: usable current selection and honest feedback',await ev('document.documentElement.dataset.palette==="crimson-gold"&&document.querySelector("#lt-palette-status").textContent.includes("未保存")'));
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:hook.identifier},ps);await reload();
  // No-JS fallback uses CSS original palette and retains all content.
  await send('Emulation.setScriptExecutionDisabled',{value:true},ps);await send('Page.reload',{},ps);await wait(300);
  check('no JS: eight readable natural scenes, settings hidden',await ev('["welcome","personal","projects","story","story-notes","about","likes","footer"].every(id=>{const e=document.getElementById(id);return e&&!e.inert&&getComputedStyle(e).visibility!=="hidden"})&&document.querySelector(".quick-settings").hidden&&getComputedStyle(document.body).backgroundColor==="rgb(255, 255, 255)"'));
  await send('Emulation.setScriptExecutionDisabled',{value:false},ps);await reload();
  check('no console errors or unhandled exceptions',errors.length===0,errors);
  report.userAgent=await ev('navigator.userAgent');report.completed=true;save();
  console.log(`PASS: ${report.checks.length} checks, ${report.matrix.length} scene layouts, ${report.screenshots.length} screenshots`);
} catch(error) {await shot('failure');report.failure=String(error);save();throw error}
finally {ws.close()}
