/* LineTop Stage 4: native scroll is the single clock. No wheel/touchmove interception. */
(() => {
  'use strict';
  const root = document.documentElement;
  const stage = document.getElementById('lt-scene-stage');
  const track = document.getElementById('lt-scene-track');
  const ids = ['welcome', 'personal', 'about', 'projects', 'footer'];
  const scenes = ids.map(id => document.getElementById(id));
  const sun = document.querySelector('.shared-sun');
  const start = document.getElementById('lt-sun-start');
  const end = document.getElementById('lt-sun-end');
  const overlay = stage?.querySelector('.scene-overlay');
  const personalParts = scenes[1] ? [...scenes[1].children].flatMap(el => el.classList.contains('personal-layout') ? [...el.children] : [el]) : [];
  const stops = [0, .90, 1.63, 2.32, 2.97];
  const spans = [[0,.90], [1.18,1.63], [1.87,2.32], [2.62,2.97]];
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = (a,b,x) => { const t = clamp((x-a)/(b-a)); return t*t*(3-2*t); };
  let enabled = false, failed = false, measuring = false, viewportFallback = false;
  let H = 0, geometry, progress = 0, active = 'welcome', frame = 0, measureFrame = 0, driver = 0;
  // Our manual restoration setting survives reload; natural documents must return to auto.
  let navigation = null, intro = [], oldRestoration = 'auto';
  let lastEntry = '', lastMode = '', routing = false;
  let lastHistoryWrite = -Infinity, historyTimer = 0;
  const animations = () => { intro.forEach(animation => animation.cancel()); intro = []; };
  const reduced = () => root.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function notify() { document.dispatchEvent(new CustomEvent('linetop:scenechange')); }
  function canonical(id) { return id === 'welcome' ? '#top' : `#${id}`; }
  function idFromHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return null; }
    if (!id || id === 'top') return 'welcome';
    return ids.includes(id) ? id : null;
  }
  function focusScene(id) {
    const scene = scenes[ids.indexOf(id)];
    const heading = scene?.querySelector('h1,h2') || scene;
    if (heading) { heading.setAttribute('tabindex','-1'); heading.focus({preventScroll:true}); }
  }
  function cancelDrive() { cancelAnimationFrame(driver); driver = 0; navigation = null; }
  function updateEntry(u, force = false) {
    if (routing) return;
    const hash = active === 'welcome' && !location.hash ? '' : canonical(active);
    const key = `${hash}:${u.toFixed(5)}`;
    if (key === lastEntry) return;
    const now = performance.now();
    // Native high-refresh displays can exceed Chrome's history IPC budget if this
    // follows every animation frame. Rendering stays continuous; persistence is bounded.
    if (!force && history.state?.ltScene === active && now-lastHistoryWrite < 200) {
      if (!historyTimer) historyTimer = setTimeout(() => {
        historyTimer = 0;
        if (enabled) updateEntry(progress,true);
      },200-(now-lastHistoryWrite));
      return;
    }
    clearTimeout(historyTimer); historyTimer = 0;
    history.replaceState({...history.state, ltScene:active, ltScenePosition:u}, '', `${location.pathname}${location.search}${hash}`);
    lastEntry = key; lastHistoryWrite = now;
  }
  function setCurrent(id) {
    const changed = active !== id || root.dataset.sceneCurrent !== id;
    const focused = document.activeElement?.closest('[data-scene]');
    active = id;
    scenes.forEach(scene => {
      const current = scene.id === id;
      scene.inert = !current; scene.setAttribute('aria-hidden', String(!current));
      scene.dataset.current = String(current);
    });
    root.dataset.sceneCurrent = id;
    if (focused && focused.id !== id) focusScene(id);
    if (changed) notify();
  }
  function render() {
    frame = 0;
    if (!enabled) return;
    // A viewport change may clamp scrollY before resize handlers run. Preserve the last
    // rendered semantic progress until new geometry has been measured.
    if (root.clientHeight !== H || stage.clientWidth !== geometry.width) { requestMeasure(); return; }
    const max = root.scrollHeight - H;
    const u = Math.max(0, Math.min(3.17, scrollY >= max-1 ? 3.17 : scrollY/H));
    progress = u;
    const p = clamp(u/.90);
    const alpha = [1-ease(.15,.75,p), 1, 0, 0, 0];
    let current = p < .46 ? 0 : 1;
    for (let i=1; i<spans.length; i++) {
      const [a,b] = spans[i];
      if (u < a) break;
      const fade = ease(.15,.85,clamp((u-a)/(b-a)));
      alpha[i] = 1-fade; alpha[i+1] = fade;
      current = fade < .5 ? i : i+1;
    }
    scenes.forEach((scene,i) => { scene.style.opacity = String(alpha[i]); });
    personalParts.forEach(el => { el.style.opacity = String(ease(el.classList.contains('personal-art') ? .32 : .20, el.classList.contains('personal-art') ? .84 : .72,p)); });
    const w = alpha[0];
    scenes[0].querySelector('.welcome-bottom').style.opacity = String(w > 0 ? (1-ease(.15,.50,p))/w : 0);
    const q = ease(.08,.94,p), t = 1-q;
    const {A,B,C,size,finalSize} = geometry;
    const x = t*t*A.x + 2*t*q*C.x + q*q*B.x;
    const y = t*t*A.y + 2*t*q*C.y + q*q*B.y;
    const d = size + (finalSize-size)*q;
    sun.style.width = `${d}px`; sun.style.height = `${d}px`;
    sun.style.transform = `translate(${x-d/2}px,${y-d/2}px) rotate(${135*q}deg)`;
    sun.style.opacity = String(u <= 1.18 ? 1 : alpha[1]);
    sun.dataset.owner = p >= .94 ? 'personal' : 'handoff';
    setCurrent(ids[current]); updateEntry(u);
  }
  function safeRender() { try { render(); } catch (_) { fallback('runtime-failure',true); } }
  function schedule() { if (enabled && !frame) frame = requestAnimationFrame(safeRender); }
  function fallback(reason, permanent = false) {
    const wasEnabled = enabled, id = active;
    enabled = false; failed ||= permanent;
    clearTimeout(historyTimer); historyTimer = 0;
    cancelDrive(); animations(); cancelAnimationFrame(frame); frame = 0;
    root.classList.remove('scene-enabled','scene-layout');
    root.style.removeProperty('--scene-height');
    root.dataset.experience = 'document'; root.dataset.sceneFallback = reason;
    delete root.dataset.sceneCurrent;
    scenes.forEach(scene => {
      scene.style.removeProperty('opacity'); scene.inert = false;
      scene.classList.remove('scene-compact');
      scene.classList.remove('scene-minimal');
      scene.removeAttribute('aria-hidden'); delete scene.dataset.current;
    });
    personalParts.forEach(el => el.style.removeProperty('opacity'));
    scenes[0]?.querySelector('.welcome-bottom')?.style.removeProperty('opacity');
    if (sun) {
      const home = id === 'welcome' ? start : end;
      if (sun.parentNode !== home) home.append(sun);
      sun.removeAttribute('style'); delete sun.dataset.owner;
    }
    history.scrollRestoration = oldRestoration;
    if (wasEnabled) {
      const destination = scenes[ids.indexOf(id)];
      if (destination) window.scrollTo({top:id === 'welcome' ? 0 : destination.getBoundingClientRect().top+scrollY,behavior:'instant'});
    }
    lastMode = reason; notify();
  }
  function visibleViewportFits() {
    const v = window.visualViewport;
    return !v || (Math.abs(v.height-root.clientHeight)<=2 && Math.abs(v.scale-1)<.01);
  }
  function measure() {
    measureFrame = 0;
    if (failed || measuring) return;
    measuring = true;
    try {
      if (!enabled && lastMode) {
        active = 'welcome';
        scenes.forEach(scene => { if (scene.getBoundingClientRect().top <= Math.min(200,innerHeight*.35)) active = scene.id; });
      }
      if (reduced()) { fallback('reduced-motion'); return; }
      if (idFromHash() === null) { fallback('unmapped-anchor'); return; }
      if (viewportFallback || !visibleViewportFits()) { viewportFallback = true; fallback('visual-viewport'); return; }
      const prior = enabled ? progress : null, remembered = active, resumeTarget = navigation?.id;
      H = root.clientHeight;
      if (H < 420 || stage.clientWidth < 360) { fallback('small-viewport'); return; }
      root.style.setProperty('--scene-height',`${H}px`);
      root.classList.add('scene-layout');
      // Browser page zoom changes CSS space, not device class. Try the existing layout,
      // then reclaim decorative space only in scenes that actually overflow. Never shrink
      // text or the whole page, and keep the final measured-fit guard for real overflow.
      const fitsScene = scene => scene.scrollHeight <= H+2 && scene.scrollWidth <= stage.clientWidth+2;
      scenes.forEach(scene => scene.classList.remove('scene-compact','scene-minimal'));
      scenes.forEach(scene => { if (!fitsScene(scene)) scene.classList.add('scene-compact'); });
      scenes.forEach(scene => { if (!fitsScene(scene)) scene.classList.add('scene-minimal'); });
      const fits = getComputedStyle(stage).position === 'sticky' && Math.abs(stage.getBoundingClientRect().height-H)<=2 && scenes.every(scene => scene.scrollHeight <= H+2 && scene.scrollWidth <= stage.clientWidth+2);
      if (!fits) { fallback('content-overflow'); return; }
      const r = stage.getBoundingClientRect(), a = start.getBoundingClientRect(), b = end.getBoundingClientRect();
      const A = {x:a.left+a.width/2-r.left,y:a.top+a.height/2-r.top};
      const B = {x:b.left+b.width/2-r.left,y:b.top+b.height/2-r.top};
      geometry = {A,B,C:{x:Math.min(r.width-a.width,Math.max(A.x,B.x)+a.width*.4),y:(A.y+B.y)/2},size:a.width,finalSize:Math.min(a.width*1.7,160),width:stage.clientWidth};
      if (sun.parentNode !== overlay) overlay.append(sun);
      const wasEnabled = enabled;
      enabled = true; root.classList.add('scene-enabled');
      root.dataset.experience = 'scene'; delete root.dataset.sceneFallback;
      history.scrollRestoration = 'manual'; cancelDrive();
      const u = prior ?? (lastMode ? stops[ids.indexOf(remembered)] : initialPosition());
      lastEntry = '';
      window.scrollTo({top:u*H,behavior:'instant'}); safeRender();
      lastMode = 'scene';
      if (resumeTarget && enabled) drive(resumeTarget,false);
    } catch (_) { fallback('initialization-failure',true); }
    finally { measuring = false; }
  }
  function initialPosition() {
    const id = idFromHash() || 'welcome', state = history.state;
    return state?.ltScene === id && Number.isFinite(state.ltScenePosition) ? Math.max(0,Math.min(3.17,state.ltScenePosition)) : stops[ids.indexOf(id)];
  }
  function requestMeasure() { if (!failed && !measureFrame) measureFrame = requestAnimationFrame(measure); }
  function enter() {
    const items = ['.hero-greeting','.hero-title','.hero-identity','.welcome-bottom'];
    if (!Element.prototype.animate) return;
    intro = items.map((selector,i) => scenes[0].querySelector(selector).animate([{opacity:0},{opacity:1}],{duration:420,delay:i*60,easing:'ease-out'}));
  }
  function drive(id, recordHistory = true) {
    if (navigation?.id === id) return;
    cancelDrive(); animations();
    safeRender();
    if (!enabled) return;
    const target = stops[ids.indexOf(id)]*H, from = scrollY;
    // Create one history entry, then keep its URL/state aligned with the visible scene.
    if (recordHistory && Math.abs(target-from)>1) {
      updateEntry(progress,true);
      history.pushState({...history.state},'',location.href);
    }
    lastEntry = '';
    const duration = Math.min(1000,420+Math.abs(target-from)/H*220);
    navigation = {id,from,target,start:performance.now(),duration,expected:from};
    function step(now) {
      if (!enabled || !navigation) return;
      // Scroll events may be coalesced until after this frame; check before writing too.
      if (Math.abs(scrollY-navigation.expected)>2) { cancelDrive(); safeRender(); return; }
      const n = navigation, t = clamp((now-n.start)/n.duration);
      n.expected = n.from+(n.target-n.from)*ease(0,1,t);
      window.scrollTo({top:n.expected,behavior:'instant'}); safeRender();
      if (!navigation) return;
      if (t < 1) driver = requestAnimationFrame(step);
      else { driver = 0; navigation = null; updateEntry(progress,true); focusScene(id); }
    }
    driver = requestAnimationFrame(step);
  }
  function routeHistory(moveFocus = true) {
    if (!enabled) return;
    cancelDrive(); animations();
    const id = idFromHash();
    if (!id) { fallback('unmapped-anchor'); return; }
    routing = true;
    const u = initialPosition();
    window.scrollTo({top:u*H,behavior:'instant'}); safeRender();
    routing = false; lastEntry = ''; safeRender();
    if (moveFocus) focusScene(active);
  }
  function userTakeover() { cancelDrive(); animations(); }
  try {
    if (!stage || !track || !overlay || !sun || scenes.some(scene=>!scene) || !('inert' in HTMLElement.prototype)) return;
    scenes.forEach(scene => { scene.dataset.scene = scene.id; });
    document.addEventListener('click', event => {
      if (!enabled || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href,location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      let id; try { id = decodeURIComponent(url.hash.slice(1)); } catch (_) { return; }
      if (id === 'top') id = 'welcome';
      if (!ids.includes(id)) return;
      event.preventDefault(); drive(id);
    });
    window.addEventListener('scroll', () => {
      if (!enabled) return;
      if (navigation && Math.abs(scrollY-navigation.expected)>2) cancelDrive();
      animations(); schedule();
    },{passive:true});
    window.addEventListener('wheel',userTakeover,{passive:true});
    window.addEventListener('touchstart',userTakeover,{passive:true});
    window.addEventListener('pointerdown',event => { if (!event.target.closest('a,button,input,label')) userTakeover(); },{passive:true});
    window.addEventListener('keydown',event => {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key) && !event.target.closest('input,textarea,select,[contenteditable=true]')) userTakeover();
    });
    window.addEventListener('resize',requestMeasure,{passive:true});
    window.visualViewport?.addEventListener('resize',requestMeasure,{passive:true});
    window.addEventListener('popstate',routeHistory); window.addEventListener('hashchange',routeHistory);
    window.addEventListener('pageshow',requestMeasure);
    window.addEventListener('pagehide', () => { if (enabled) { try { updateEntry(progress,true); } catch (_) { /* Page is closing. */ } } });
    document.addEventListener('linetop:motionchange', () => { viewportFallback = false; requestMeasure(); });
    const observer = new ResizeObserver(requestMeasure);
    observer.observe(stage); observer.observe(document.querySelector('main'));
    const contentObserver = new MutationObserver(requestMeasure);
    contentObserver.observe(stage,{subtree:true,childList:true,characterData:true});
    document.fonts?.ready.then(requestMeasure).catch(()=>{});
    measure();
    requestAnimationFrame(() => {
      if (!enabled) {
        const id = idFromHash();
        if (id && location.hash && scrollY < 1) {
          const destination = scenes[ids.indexOf(id)];
          window.scrollTo({top:id === 'welcome' ? 0 : destination.getBoundingClientRect().top+scrollY,behavior:'instant'});
        }
        return;
      }
      routeHistory(Boolean(location.hash));
      if (scrollY === 0) enter();
    });
  } catch (_) { fallback('initialization-failure',true); }
})();
