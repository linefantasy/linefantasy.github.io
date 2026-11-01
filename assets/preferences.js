/* Display preferences share the existing motion key/event with the scene controller. */
(() => {
  'use strict';
  const root=document.documentElement, dock=document.getElementById('lt-quick-settings');
  const gear=document.getElementById('lt-settings-gear'), actions=document.getElementById('lt-quick-actions');
  const themeButton=document.getElementById('lt-theme-toggle'), motionButton=document.getElementById('lt-motion-toggle');
  const themeTip=document.getElementById('lt-theme-tip'), motionTip=document.getElementById('lt-motion-tip');
  const status=document.getElementById('preference-status');
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let preferred=false, pinned=false, hovered=false, suppressFocus=false, closeTimer;
  try { preferred=localStorage.getItem('linetop-reduce-motion')==='true'; } catch (_) { /* Current visit still works. */ }
  function save(key,value) { try { localStorage.setItem(key,value); return true; } catch (_) { return false; } }
  function syncTheme() {
    const dark=root.dataset.theme==='dark', label=dark ? '切换浅色模式' : '切换深色模式';
    root.style.colorScheme=dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content=dark ? '#000000' : '#FFFFFF';
    themeButton.setAttribute('aria-label',label); themeButton.setAttribute('aria-pressed',String(dark)); themeTip.textContent=label;
    document.querySelectorAll('[data-theme-wordmark]').forEach(image => {
      const attr=image.tagName==='OBJECT' ? 'data' : 'src';
      const src=dark ? 'assets/linetop-wordmark-dark.svg' : 'assets/linetop-wordmark.svg';
      if (image.getAttribute(attr)!==src) image.setAttribute(attr,src);
    });
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
    pinned=false;
    // Suppress only the synchronous focusin produced by restoring gear focus.
    // An unrelated page click must never disable the next keyboard visit.
    suppressFocus=true;
    if (restoreFocus || actions.contains(document.activeElement)) gear.focus({preventScroll:true});
    suppressFocus=false;
    setOpen(false);
  }
  function maybeClose() {
    clearTimeout(closeTimer);
    closeTimer=setTimeout(() => {
      if (!pinned && !hovered && !dock.contains(document.activeElement)) setOpen(false);
    },120);
  }
  dock.addEventListener('pointerenter',event => {
    if (event.pointerType!=='mouse') return;
    hovered=true; suppressFocus=false; setOpen(true);
  });
  dock.addEventListener('pointerleave',event => { if (event.pointerType==='mouse') { hovered=false; maybeClose(); } });
  dock.addEventListener('focusin',() => { if (!suppressFocus) setOpen(true); });
  dock.addEventListener('focusout',() => {
    queueMicrotask(() => { if (!dock.contains(document.activeElement)) { suppressFocus=false; maybeClose(); } });
  });
  gear.addEventListener('click',() => {
    if (pinned) dismiss();
    else { pinned=true; suppressFocus=false; setOpen(true); }
  });
  dock.addEventListener('keydown',event => { if (event.key==='Escape') { event.preventDefault(); dismiss(true); } });
  document.addEventListener('pointerdown',event => { if (!dock.contains(event.target)) dismiss(); });
  document.addEventListener('linetop:menuopen',() => dismiss());
  themeButton.addEventListener('click',() => {
    root.dataset.theme=root.dataset.theme==='dark' ? 'light' : 'dark';
    const saved=save('linetop-theme',root.dataset.theme); syncTheme();
    status.textContent=(root.dataset.theme==='dark' ? '已切换深色模式。' : '已切换浅色模式。')+(saved ? '' : '当前浏览器未保存此选择。');
  });
  motionButton.addEventListener('click',() => {
    if (systemMotion.matches) { status.textContent='已跟随系统减少动态效果；请在系统中更改此偏好。'; return; }
    preferred=!preferred;
    const saved=save('linetop-reduce-motion',String(preferred)); syncMotion();
    status.textContent=(preferred ? '已减少动态效果。' : '已开启动效。')+(saved ? '' : '当前浏览器未保存此选择。');
  });
  systemMotion.addEventListener('change',syncMotion);
  syncTheme(); syncMotion(); dock.hidden=false;
})();
