/* Run before styles: restore only the explicitly saved theme, never infer it from OS. */
(() => {
  let theme = 'light';
  try { if (localStorage.getItem('linetop-theme')==='dark') theme='dark'; } catch (_) { /* Light remains usable without storage. */ }
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark' ? '#444444' : '#FFFFFF');
})();
