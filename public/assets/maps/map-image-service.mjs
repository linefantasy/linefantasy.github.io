// Stage 2 accepts attributed image records; no stock/photo network calls in stage 1.
export function regionImages(region,base=globalThis.location?.href||'https://localhost/') {
  return (region.images||[]).filter(item=>{
    if(!item.url||!item.alt||!item.source||!item.license) return false;
    try {return ['http:','https:'].includes(new URL(item.url,base).protocol)} catch {return false}
  });
}
