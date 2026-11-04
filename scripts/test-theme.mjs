// Zero-dependency checks: node scripts/test-theme.mjs
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('../assets/theme-init.js',import.meta.url),'utf8');
const expected=[
  ['original','#D9FF00','#4FFFC4','#31A9FF'],
  ['crimson-gold','#AD0000','#FFC300','#C2C2C2'],
  ['neon','#4BFF81','#B4FF05','#0D00FF'],
  ['blue-rose','#0496FF','#FFBC42','#D81159'],
  ['purple-pink','#9B5DE5','#F15BB5','#FEE440'],
  ['forest','#036B48','#E5F086','#193B2F'],
  ['glacier','#072AC8','#1E96FC','#A2D6F9'],
  ['ocean-gold','#003566','#FFC300','#FFD60A']
];
function boot(saved={},unavailable=false) {
  const styles={}, dataset={}, meta={}, icon={};
  const context={window:{},document:{documentElement:{dataset,style:{setProperty:(k,v)=>styles[k]=v}},
    querySelector:s=>s.startsWith('meta') ? {setAttribute:(k,v)=>meta[k]=v} : icon},
    localStorage:{getItem:k=>{if(unavailable) throw Error('denied');return saved[k]??null}}};
  vm.runInNewContext(source,context);
  return {api:context.window.LineTopTheme,styles,dataset,meta,icon};
}
function luminance(hex) {
  const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const fresh=boot();
assert.ok(fresh.api,'Central palette API must exist');
assert.equal(fresh.dataset.palette,'original');
assert.equal(fresh.dataset.theme,'light');
assert.equal(fresh.api.palettes.length,8);
for(const [id,...colors] of expected) for(const mode of ['light','dark']) {
  const b=boot({'linetop-theme':mode,'linetop-palette':id,'linetop-reduce-motion':'true'});
  assert.equal(b.dataset.palette,id); assert.equal(b.dataset.theme,mode);
  const bg=mode==='dark'?'#000000':'#FFFFFF';
  ['primary','secondary','tertiary'].forEach((role,i)=>{
    const get=s=>b.styles[`--${s}`];
    assert.equal(get(`color-${role}`),colors[i]);
    assert.ok(contrast(get(`on-${role}`),colors[i])>=4.5,`${id}/${mode}/${role}: solid label`);
    assert.ok(contrast(get(`color-${role}-text`),bg)>=4.5,`${id}/${mode}/${role}: text`);
    assert.ok(contrast(get(`color-${role}-edge`),bg)>=3,`${id}/${mode}/${role}: boundary`);
    assert.ok(contrast(get(`color-${role}-subtle-text`),get(`color-${role}-subtle`))>=4.5,`${id}/${mode}/${role}: subtle label`);
  });
  b.api.apply(mode,id);
  assert.equal(b.dataset.theme,mode); assert.equal(b.dataset.palette,id);
}
for(const b of [boot({'linetop-theme':'invalid','linetop-palette':'expired'}),boot({},true)]) {
  assert.equal(b.dataset.theme,'light');assert.equal(b.dataset.palette,'original');
}
const malformed=boot();malformed.api.apply('bad','bad');
assert.equal(malformed.dataset.theme,'light');assert.equal(malformed.dataset.palette,'original');
console.log('PASS: 8 exact palettes × 2 modes, 192 contrast pairs, startup, invalid/blocked storage fallback');
