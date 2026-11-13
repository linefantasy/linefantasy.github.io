/* Single palette registry. Runs before styles to avoid a default-color flash.
   Base colors stay exact; readable text/edges are derived per display mode. */
(() => {
  'use strict';
  const palettes=Object.freeze([
    {id:'original',name:'原始主题',colors:['#D9FF00','#4FFFC4','#31A9FF']},
    {id:'crimson-gold',name:'暗红鎏金',colors:['#AD0000','#FFC300','#C2C2C2']},
    {id:'neon',name:'荧光幻彩',colors:['#4BFF81','#B4FF05','#0D00FF']},
    {id:'blue-rose',name:'蓝橙玫红',colors:['#0496FF','#FFBC42','#D81159']},
    {id:'purple-pink',name:'紫粉明黄',colors:['#9B5DE5','#F15BB5','#FEE440']},
    {id:'forest',name:'森林绿调',colors:['#036B48','#E5F086','#193B2F']},
    {id:'glacier',name:'深蓝冰川',colors:['#072AC8','#1E96FC','#A2D6F9']},
    {id:'ocean-gold',name:'深海鎏金',colors:['#003566','#FFC300','#FFD60A']}
  ].map(p=>Object.freeze({...p,colors:Object.freeze(p.colors)})));
  const rgb=hex=>hex.slice(1).match(/../g).map(n=>parseInt(n,16));
  const mix=(a,b,t)=>'#'+rgb(a).map((v,i)=>Math.round(v+(rgb(b)[i]-v)*t).toString(16).padStart(2,'0')).join('').toUpperCase();
  function luminance(hex) {
    const c=rgb(hex).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return c[0]*.2126+c[1]*.7152+c[2]*.0722;
  }
  function contrast(a,b) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
  function readable(color,background,ratio) {
    const target=luminance(background)>.179 ? '#000000' : '#FFFFFF';
    for(let step=0;step<=100;step++) {
      const candidate=mix(color,target,step/100);
      if(contrast(candidate,background)>=ratio) return candidate;
    }
    return target;
  }
  // Prefer the original ink when it is readable; otherwise use neutral white/black.
  const on=color=>contrast('#12354F',color)>=4.5 ? '#12354F' : contrast('#FFFFFF',color)>=4.5 ? '#FFFFFF' : '#000000';
  const normalizePalette=id=>palettes.find(p=>p.id===id) || palettes[0];
  function apply(mode,id) {
    const root=document.documentElement,palette=normalizePalette(id),dark=mode==='dark';
    const surface=dark ? '#000000' : '#FFFFFF';
    root.dataset.theme=dark ? 'dark' : 'light'; root.dataset.palette=palette.id;
    root.style.colorScheme=root.dataset.theme;
    palette.colors.forEach((base,i)=>{
      const role=['primary','secondary','tertiary'][i],subtle=mix(surface,base,dark?.22:.12);
      const set=(suffix,value)=>root.style.setProperty(`--color-${role}${suffix}`,value);
      set('',base); set('-text',readable(base,surface,4.5)); set('-edge',readable(base,surface,3));
      set('-subtle',subtle); set('-subtle-text',readable(base,subtle,4.5));
      set('-hover',mix(base,on(base)==='#FFFFFF'?'#FFFFFF':'#000000',.1));
      set('-active',mix(base,on(base)==='#FFFFFF'?'#FFFFFF':'#000000',.18));
      root.style.setProperty(`--on-${role}`,on(base));
    });
    root.style.setProperty('--nav-hover',on(palette.colors[0])==='#FFFFFF' ? '#0000001F' : '#FFFFFF29');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',surface);
    const icon=document.querySelector('link[rel="icon"]');
    if(icon) icon.href='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${surface}"/><path d="M15 12h10v34h23v9H15z" fill="${dark?'#F1F4EA':'#12354F'}"/><circle cx="48" cy="17" r="9" fill="${palette.colors[0]}"/></svg>`);
    return palette;
  }
  window.LineTopTheme=Object.freeze({palettes,normalizePalette,apply});
  let theme='light',palette='original';
  // Read independently so a malformed value never invalidates unrelated preferences.
  try { theme=localStorage.getItem('linetop-theme'); palette=localStorage.getItem('linetop-palette'); } catch (_) { /* Defaults remain usable without storage. */ }
  apply(theme,palette);
})();
