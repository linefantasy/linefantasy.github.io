import {regionImages} from './map-image-service.mjs?v=64cf4cc1c9';
export class MapDetailPanel {
  constructor(element,closeButton) {
    this.element=element;this.closeButton=closeButton;
    closeButton.addEventListener('click',()=>this.close(true));
    element.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();this.close(true)}});
  }
  close(restore=false) {
    this.element.dataset.open='false';
    this.element.querySelector('[data-detail-empty]').hidden=false;
    this.element.querySelector('[data-detail-content]').hidden=true;
    if(restore)this.onClose?.();
  }
  show(detail,{focus=false}={}) {
    this.element.dataset.open='true';
    const title=this.element.querySelector('[data-detail-title]');title.textContent=detail.nameZh;
    this.element.querySelector('[data-detail-en]').textContent=detail.nameEn;
    this.element.querySelector('[data-detail-id]').textContent=detail.id;
    this.element.querySelector('[data-detail-kind]').textContent=detail.kind==='district'?'联邦特区（非州）':detail.kind==='state'?'州':detail.kind==='country-or-territory'?'国家／地区':'行政区域';
    const flag=this.element.querySelector('[data-detail-flag]');
    flag.textContent=detail.flagCode&&/^[A-Z]{2}$/.test(detail.flagCode)?[...detail.flagCode].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join(''):'';
    flag.hidden=!flag.textContent;
    flag.setAttribute('role','img');
    flag.setAttribute('aria-label',`${detail.nameZh}的旗帜（ISO ${detail.flagCode||'未提供'}）`);
    const list=this.element.querySelector('[data-detail-fields]');list.replaceChildren();
    detail.fields.forEach(field=>{
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=field.label;
      dd.textContent=field.value===null?field.pendingLabel:`${field.value}${field.unit?' '+field.unit:''}${field.year?' · '+field.year:''}`;
      if(field.value!==null&&field.source){const source=document.createElement('small');source.textContent='来源：'+field.source;dd.append(source)}
      list.append(dt,dd);
    });
    const images=this.element.querySelector('[data-detail-images]');images.replaceChildren();
    const available=regionImages(detail);
    if(!available.length){const p=document.createElement('p');p.textContent='特色图片 · 第二阶段接入';images.append(p)}
    available.forEach(item=>{const image=document.createElement('img');image.src=item.url;image.alt=item.alt;image.loading='lazy';const caption=document.createElement('p');caption.textContent=item.source+' · '+item.license;images.append(image,caption)});
    this.element.querySelector('[data-detail-empty]').hidden=true;
    this.element.querySelector('[data-detail-content]').hidden=false;
    if(focus){title.tabIndex=-1;title.focus({preventScroll:true})}
  }
  reset() {
    this.close();this.element.querySelector('[data-detail-empty]').hidden=false;
    this.element.querySelector('[data-detail-content]').hidden=true;
  }
}
