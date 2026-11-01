/* LineTop: one sidebar, fixed project avatar, and shared scene navigation. */
(() => {
  'use strict';
  const root = document.documentElement;
  const sidebar = document.getElementById('lt-sidebar');
  const main = document.getElementById('main-content');
  const dock = document.getElementById('lt-quick-settings');
  const menuButton = document.querySelector('.menu-trigger');
  const menuClose = document.querySelector('.sidebar-close');
  const backdrop = document.querySelector('.menu-backdrop');
  const nav = document.querySelector('.sidebar-nav');
  const narrow = matchMedia('(max-width: 900px)');
  const sectionLinks = [...nav.querySelectorAll('a[data-section]')];
  const sections = [...document.querySelectorAll('.site-body>.section-frame')];
  let menuOpen = false, menuScroll = 0, menuExperience = '', frame = 0;
  function updateCurrent() {
    frame = 0;
    let active = '';
    if (root.dataset.experience === 'scene') active = root.dataset.sceneCurrent;
    else sections.forEach(section => { if (section.getBoundingClientRect().top <= Math.min(200,innerHeight*.35)) active = section.id; });
    if (active === 'footer') active = '';
    sectionLinks.forEach(link => {
      if (link.dataset.section === active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    const link = sectionLinks.find(item => item.dataset.section === active);
    if (link) {
      nav.style.setProperty('--glider-y',`${link.offsetTop}px`);
      nav.style.setProperty('--glider-height',`${link.offsetHeight}px`);
    }
    nav.style.setProperty('--glider-visible',link ? '1' : '0');
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(updateCurrent); }
  function syncSidebar() {
    sidebar.inert = narrow.matches && !menuOpen;
    sidebar.setAttribute('aria-hidden',String(sidebar.inert));
    if (narrow.matches && menuOpen) {
      sidebar.setAttribute('role','dialog'); sidebar.setAttribute('aria-modal','true'); sidebar.setAttribute('aria-label','导航菜单');
    } else {
      sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); sidebar.setAttribute('aria-label','个人与导航');
    }
    schedule();
  }
  function openMenu() {
    if (!narrow.matches || menuOpen) return;
    menuScroll = scrollY; menuExperience = root.dataset.experience; menuOpen = true;
    document.dispatchEvent(new CustomEvent('linetop:menuopen'));
    root.classList.add('menu-open'); menuButton.setAttribute('aria-expanded','true');
    backdrop.hidden = false; main.inert = true; dock.inert = true;
    syncSidebar();
    requestAnimationFrame(() => { if (menuOpen) menuClose.focus({preventScroll:true}); });
  }
  function closeMenu(restoreFocus = true) {
    if (!menuOpen) return;
    menuOpen = false; root.classList.remove('menu-open'); menuButton.setAttribute('aria-expanded','false');
    backdrop.hidden = true; main.inert = false; dock.inert = false; syncSidebar();
    if (menuExperience === root.dataset.experience) window.scrollTo(0,menuScroll);
    if (restoreFocus) menuButton.focus({preventScroll:true});
  }
  const avatar = document.getElementById('lt-avatar');
  function avatarFallback() {
    if (avatar.dataset.failed) return;
    avatar.dataset.failed = 'true'; avatar.src = avatar.dataset.fallback; avatar.alt = 'line 的默认头像';
  }
  avatar.addEventListener('error',avatarFallback);
  if (avatar.complete && !avatar.naturalWidth) avatarFallback();
  const wordmark=document.querySelector('.hero-wordmark');
  function wordmarkFallback() {
    wordmark.hidden=true; document.querySelector('.wordmark-fallback').hidden=false;
  }
  wordmark.addEventListener('error',wordmarkFallback);
  wordmark.addEventListener('load',() => { wordmark.hidden=false; document.querySelector('.wordmark-fallback').hidden=true; });
  if (wordmark.complete && !wordmark.naturalWidth) wordmarkFallback();
  menuButton.addEventListener('click',() => menuOpen ? closeMenu() : openMenu());
  menuClose.addEventListener('click',() => closeMenu());
  backdrop.addEventListener('click',() => closeMenu());
  sidebar.querySelectorAll('a[href]').forEach(link => link.addEventListener('click',event => {
    if (!event.defaultPrevented && event.button===0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) closeMenu(false);
  }));
  document.addEventListener('keydown',event => {
    if (event.key==='Escape' && menuOpen) closeMenu();
    if (event.key==='Tab' && menuOpen) {
      const list = [...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');
      const first=list[0], last=list.at(-1);
      if (!list.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
    }
  });
  narrow.addEventListener('change',() => { closeMenu(false); syncSidebar(); });
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  document.addEventListener('linetop:scenechange',schedule);
  menuButton.hidden=false; menuClose.hidden=false;
  root.classList.add('js'); root.dataset.experience='document'; syncSidebar();
})();
