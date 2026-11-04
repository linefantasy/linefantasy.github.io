/* Display preferences share the existing motion key/event with the scene controller. */
(() => {
  'use strict';
  const root=document.documentElement, dock=document.getElementById('lt-quick-settings');
  const gear=document.getElementById('lt-settings-gear'), actions=document.getElementById('lt-quick-actions');
  const themeButton=document.getElementById('lt-theme-toggle'), motionButton=document.getElementById('lt-motion-toggle');
  const themeTip=document.getElementById('lt-theme-tip'), motionTip=document.getElementById('lt-motion-tip');
  const status=document.getElementById('preference-status');
  const paletteButton=document.getElementById('lt-palette-toggle'), palettePanel=document.getElementById('lt-palette-panel');
  const paletteOptions=document.getElementById('lt-palette-options'), paletteStatus=document.getElementById('lt-palette-status');
  const theme=window.LineTopTheme;
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let preferred=false, pinned=false, hovered=false, suppressFocus=false, closeTimer, transitionTimer;
  try { preferred=localStorage.getItem('linetop-reduce-motion')==='true'; } catch (_) { /* Current visit still works. */ }
  function save(key,value) { try { localStorage.setItem(key,value); return true; } catch (_) { return false; } }
  function announce(message) { status.textContent=message; paletteStatus.textContent=message; }
  function colorTransition() {
    clearTimeout(transitionTimer);
    if (systemMotion.matches || root.dataset.reducedMotion==='true') return;
    root.classList.add('theme-changing');
    transitionTimer=setTimeout(()=>root.classList.remove('theme-changing'),200);
  }
  function setPaletteOpen(open,restoreFocus=false) {
    palettePanel.hidden=!open; dock.dataset.paletteOpen=String(open); paletteButton.setAttribute('aria-expanded',String(open));
    if(open) {
      pinned=true; setOpen(true);
      paletteOptions.querySelector('input:checked')?.focus({preventScroll:true});
    } else if(restoreFocus) paletteButton.focus({preventScroll:true});
  }
  theme.palettes.forEach(palette=>{
    const label=document.createElement('label'); label.className='palette-option';
    const input=document.createElement('input'); input.type='radio'; input.name='linetop-palette'; input.value=palette.id;
    const card=document.createElement('span'); card.className='palette-card';
    const swatches=document.createElement('span'); swatches.className='palette-swatches'; swatches.setAttribute('aria-hidden','true');
    palette.colors.forEach(color=>{ const swatch=document.createElement('i'); swatch.style.backgroundColor=color; swatches.append(swatch); });
    const title=document.createElement('span'); title.className='palette-name'; title.textContent=palette.name;
    const mark=document.createElement('span'); mark.className='palette-check'; mark.textContent='✓'; mark.setAttribute('aria-hidden','true');
    card.append(swatches,title,mark); label.append(input,card); paletteOptions.append(label);
  });
  function syncPalette() {
    const palette=theme.normalizePalette(root.dataset.palette);
    paletteOptions.querySelectorAll('input').forEach(input=>input.checked=input.value===palette.id);
    paletteButton.setAttribute('aria-label',`主题配色：${palette.name}`);
  }
  function syncTheme() {
    const dark=root.dataset.theme==='dark', label=dark ? '切换浅色模式' : '切换深色模式';
    root.style.colorScheme=dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content=dark ? '#000000' : '#FFFFFF';
    themeButton.setAttribute('aria-label',label); themeButton.setAttribute('aria-pressed',String(dark)); themeTip.textContent=label;
  }
  function syncMotion() {
    const reduced=systemMotion.matches || preferred;
    const label=systemMotion.matches ? '系统已减少动态效果' : reduced ? '开启动效' : '减少动态效果';
    root.dataset.reducedMotion=String(reduced);
    motionButton.setAttribute('aria-label',label); motionButton.setAttribute('aria-pressed',String(reduced));
    motionButton.setAttribute('aria-disabled',String(systemMotion.matches)); motionTip.textContent=label;
    document.dispatchEvent(new CustomEvent('linetop:motionchange'));
  }
  function setOpen(open) {
    clearTimeout(closeTimer);
    dock.dataset.open=String(open); gear.setAttribute('aria-expanded',String(open));
    gear.setAttribute('aria-label',open ? '收起显示设置' : '展开显示设置');
    actions.inert=!open; actions.setAttribute('aria-hidden',String(!open));
  }
  function dismiss(restoreFocus=false) {
    setPaletteOpen(false);
    pinned=false;
    // Suppress only the synchronous focusin produced by restoring gear focus.
    // An unrelated page click must never disable the next keyboard visit.
    suppressFocus=true;
    if (restoreFocus || actions.contains(document.activeElement) || palettePanel.contains(document.activeElement)) gear.focus({preventScroll:true});
    suppressFocus=false;
    setOpen(false);
  }
  function maybeClose() {
    clearTimeout(closeTimer);
    closeTimer=setTimeout(() => {
      if (!dock.contains(document.activeElement) && !hovered && (!pinned || !palettePanel.hidden)) dismiss();
    },120);
  }
  dock.addEventListener('pointerenter',event => {
    if (event.pointerType!=='mouse') return;
    hovered=true; suppressFocus=false; setOpen(true);
  });
  dock.addEventListener('pointerleave',event => { if (event.pointerType==='mouse') { hovered=false; maybeClose(); } });
  dock.addEventListener('focusin',event => {
    // The narrow-screen popover overlaps the other actions. Close it before
    // keyboard focus enters one of those controls, keeping focus unobscured.
    if(!palettePanel.hidden && !palettePanel.contains(event.target) && event.target!==paletteButton) setPaletteOpen(false);
    if (!suppressFocus) setOpen(true);
  });
  dock.addEventListener('focusout',() => {
    queueMicrotask(() => { if (!dock.contains(document.activeElement)) { suppressFocus=false; maybeClose(); } });
  });
  gear.addEventListener('click',() => {
    if (pinned) dismiss();
    else { pinned=true; suppressFocus=false; setOpen(true); }
  });
  dock.addEventListener('keydown',event => {
    if (event.key==='Escape') {
      event.preventDefault();
      if(!palettePanel.hidden) setPaletteOpen(false,true);
      else dismiss(true);
    }
  });
  document.addEventListener('pointerdown',event => { if (!dock.contains(event.target)) dismiss(); });
  document.addEventListener('linetop:menuopen',() => dismiss());
  themeButton.addEventListener('click',() => {
    colorTransition();
    theme.apply(root.dataset.theme==='dark' ? 'light' : 'dark',root.dataset.palette);
    const saved=save('linetop-theme',root.dataset.theme); syncTheme();
    announce((root.dataset.theme==='dark' ? '已切换深色模式。' : '已切换浅色模式。')+(saved ? '' : '当前浏览器未保存此选择。'));
  });
  paletteButton.addEventListener('click',()=>setPaletteOpen(palettePanel.hidden));
  document.getElementById('lt-palette-close').addEventListener('click',()=>setPaletteOpen(false,true));
  paletteOptions.addEventListener('change',event=>{
    if(!event.target.matches('input[name="linetop-palette"]')) return;
    colorTransition();
    const palette=theme.apply(root.dataset.theme,event.target.value),saved=save('linetop-palette',palette.id);
    syncPalette(); announce(`已切换${palette.name}。`+(saved ? '' : '当前浏览器未保存此选择。'));
  });
  motionButton.addEventListener('click',() => {
    if (systemMotion.matches) { status.textContent='已跟随系统减少动态效果；请在系统中更改此偏好。'; return; }
    preferred=!preferred;
    const saved=save('linetop-reduce-motion',String(preferred)); syncMotion();
    status.textContent=(preferred ? '已减少动态效果。' : '已开启动效。')+(saved ? '' : '当前浏览器未保存此选择。');
  });
  systemMotion.addEventListener('change',syncMotion);
  // Keep a second tab (and restored BFCache documents) in sync without rewriting storage.
  function restore() {
    let mode=root.dataset.theme,palette=root.dataset.palette;
    try { mode=localStorage.getItem('linetop-theme'); palette=localStorage.getItem('linetop-palette'); } catch (_) { /* Preserve this visit's choice. */ }
    theme.apply(mode,palette); syncTheme(); syncPalette();
  }
  window.addEventListener('storage',event=>{ if(event.key===null || ['linetop-theme','linetop-palette'].includes(event.key)) restore(); });
  window.addEventListener('pageshow',event=>{ if(event.persisted) restore(); });
  syncTheme(); syncPalette(); syncMotion(); dock.hidden=false;
})();
