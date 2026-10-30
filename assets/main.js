/* Stage 3: sidebar/panels only. No scroll-scene transforms or avatar file processing. */
(() => {
  'use strict';
  const root = document.documentElement;
  const sidebar = document.getElementById('lt-sidebar');
  const main = document.getElementById('main-content');
  const menuButton = document.querySelector('.menu-trigger');
  const menuClose = document.querySelector('.sidebar-close');
  const backdrop = document.querySelector('.menu-backdrop');
  const nav = document.querySelector('.sidebar-nav');
  const panel = document.getElementById('lt-panel');
  const panelTitle = document.getElementById('panel-title');
  const openers = [...document.querySelectorAll('[data-open-panel]')];
  const panelSections = [...document.querySelectorAll('[data-panel-content]')];
  const toggle = document.getElementById('lt-reduce-motion');
  const status = document.getElementById('motion-status');
  const narrow = matchMedia('(max-width: 900px)');
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sectionLinks = [...nav.querySelectorAll('a[data-section]')];
  const sections = ['personal', 'about', 'projects', 'footer'].map(id => document.getElementById(id));
  const titles = {story:'故事', likes:'喜好', settings:'设置'};
  let menuOpen = false;
  let menuScroll = 0;
  let panelReturn = menuButton;
  let restorePanelFocus = true;
  let modalScroll = null;
  let frame = 0;
  let preferred = false;
  try { preferred = localStorage.getItem('linetop-reduce-motion') === 'true'; } catch (_) { /* Optional storage. */ }

  function updateCurrent() {
    frame = 0;
    const threshold = Math.min(200, innerHeight * .35);
    let active = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top <= threshold) active = section.id; });
    if (active === 'footer') active = '';
    sectionLinks.forEach(link => {
      if (link.dataset.section === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const link = sectionLinks.find(item => item.dataset.section === active);
    if (link) {
      nav.style.setProperty('--glider-y', `${link.offsetTop}px`);
      nav.style.setProperty('--glider-height', `${link.offsetHeight}px`);
    }
    nav.style.setProperty('--glider-visible', link ? '1' : '0');
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(updateCurrent); }
  function focusableMenu() {
    return [...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  }
  function syncSidebar() {
    const closedOnMobile = narrow.matches && !menuOpen;
    sidebar.inert = closedOnMobile;
    sidebar.setAttribute('aria-hidden', String(closedOnMobile));
    if (narrow.matches && menuOpen) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('aria-label', '导航菜单');
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      sidebar.setAttribute('aria-label', '个人与导航');
    }
    schedule();
  }
  function openMenu() {
    if (!narrow.matches || menuOpen) return;
    menuScroll = scrollY;
    menuOpen = true;
    root.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    main.inert = true;
    syncSidebar();
    // Wait for the formerly hidden drawer to become focusable after a breakpoint change.
    requestAnimationFrame(() => { if (menuOpen) menuClose.focus({preventScroll:true}); });
  }
  function closeMenu(restoreFocus = true) {
    if (!menuOpen) return;
    menuOpen = false;
    root.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    main.inert = false;
    syncSidebar();
    window.scrollTo(0, menuScroll);
    if (restoreFocus) menuButton.focus({preventScroll:true});
  }
  function closePanel(restoreFocus = true) {
    if (!panel.open) return;
    restorePanelFocus = restoreFocus;
    panel.close();
    releaseModalScroll();
  }
  function releaseModalScroll() {
    if (modalScroll === null) return;
    const y = modalScroll;
    modalScroll = null;
    root.classList.remove('panel-modal-open');
    window.scrollTo(0, y);
  }
  function openPanel(name, trigger) {
    if (!Object.hasOwn(titles, name)) return;
    closeMenu(false);
    panelReturn = narrow.matches ? menuButton : trigger;
    restorePanelFocus = true;
    panelTitle.textContent = titles[name];
    panelSections.forEach(section => { section.hidden = section.dataset.panelContent !== name; });
    openers.forEach(opener => opener.setAttribute('aria-expanded', String(opener.dataset.openPanel === name)));
    if (!panel.open) {
      if (narrow.matches) {
        modalScroll = scrollY;
        root.classList.add('panel-modal-open');
        panel.showModal();
      }
      else panel.show();
    }
    panel.querySelector('.panel-close').focus({preventScroll:true});
  }
  function syncMotion() {
    const reduced = systemMotion.matches || preferred;
    root.dataset.reducedMotion = String(reduced);
    toggle.checked = reduced;
    toggle.disabled = systemMotion.matches;
    status.textContent = systemMotion.matches ? '已跟随系统偏好，减少动态效果。' : preferred ? '已减少动态效果。' : '已开启轻量动态反馈。';
  }

  menuButton.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
  menuClose.addEventListener('click', () => closeMenu());
  backdrop.addEventListener('click', () => closeMenu());
  sectionLinks.forEach(link => link.addEventListener('click', () => { closePanel(false); closeMenu(false); }));
  sidebar.querySelectorAll('a[href="#top"]').forEach(link => link.addEventListener('click', () => { closePanel(false); closeMenu(false); }));
  openers.forEach(opener => {
    opener.disabled = false;
    opener.addEventListener('click', () => openPanel(opener.dataset.openPanel, opener));
  });
  panel.querySelector('.panel-close').addEventListener('click', () => closePanel());
  panel.addEventListener('cancel', event => { event.preventDefault(); closePanel(); });
  panel.addEventListener('close', () => {
    releaseModalScroll();
    openers.forEach(opener => opener.setAttribute('aria-expanded', 'false'));
    if (restorePanelFocus && panelReturn?.getClientRects().length && !panelReturn.closest('[inert]')) panelReturn.focus({preventScroll:true});
  });
  document.addEventListener('click', event => {
    if (!panel.open || event.target.closest('[data-open-panel]')) return;
    if (!narrow.matches && !panel.contains(event.target)) closePanel(false);
    else if (narrow.matches && event.target === panel) {
      const rect = panel.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePanel();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (panel.open) closePanel();
      else if (menuOpen) closeMenu();
    }
    if (event.key === 'Tab' && menuOpen) {
      const list = focusableMenu();
      const first = list[0], last = list[list.length - 1];
      if (!sidebar.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  toggle.addEventListener('change', () => {
    preferred = toggle.checked;
    let saved = true;
    try { localStorage.setItem('linetop-reduce-motion', String(preferred)); } catch (_) { saved = false; }
    syncMotion();
    if (!saved && !systemMotion.matches) status.textContent = preferred ? '已减少动态效果。当前浏览器未保存此选择。' : '已开启轻量动态反馈。当前浏览器未保存此选择。';
  });
  systemMotion.addEventListener('change', syncMotion);
  narrow.addEventListener('change', () => { closePanel(false); closeMenu(false); syncSidebar(); });
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  menuButton.hidden = false;
  menuClose.hidden = false;
  toggle.disabled = false;
  root.classList.add('js');
  root.dataset.experience = 'stage3-static';
  syncMotion();
  syncSidebar();
})();
