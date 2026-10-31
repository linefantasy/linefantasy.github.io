/* LineTop: local-only avatar. No network upload, account or remote storage. */
(() => {
  'use strict';
  const input = document.getElementById('lt-avatar-file');
  if (!input) return;
  const panel = document.getElementById('lt-panel');
  const sidebar = document.querySelector('.avatar-button img');
  const preview = document.getElementById('lt-avatar-preview');
  const state = document.getElementById('lt-avatar-state');
  const feedback = document.getElementById('avatar-feedback');
  const controls = document.getElementById('lt-avatar-controls');
  const saveButton = document.getElementById('lt-avatar-save');
  const cancelButton = document.getElementById('lt-avatar-cancel');
  const resetButton = document.getElementById('lt-avatar-reset');
  const DEFAULT = new URL('assets/avatar-default.svg',document.baseURI).href;
  const MAX_FILE = 5*1024*1024, MAX_PIXELS = 16000000, MAX_OUTPUT = 300*1024;
  const DB = 'linetop-personal', STORE = 'avatars', KEY = 'current';
  const TYPES = ['image/png','image/jpeg','image/webp'];
  let loading = true, preparing = false, mutating = false, generation = 0, loadVersion = 0;
  let displayFailed = false;
  let saved = null, currentURL = '', pending = null, closedDuringWrite = false;

  function tell(text, error = false) { feedback.textContent = text; feedback.dataset.state = error ? 'error' : 'info'; }
  function sync() {
    input.disabled = loading || mutating;
    saveButton.disabled = loading || mutating || preparing || !pending;
    cancelButton.disabled = loading || mutating || (!pending && !preparing);
    resetButton.disabled = loading || mutating;
    controls.setAttribute('aria-busy',String(loading || preparing || mutating));
    state.textContent = pending ? '未保存的预览' : displayFailed ? '已回退默认头像（本地保存未更改）' : saved ? '已保存的头像' : '当前使用默认头像。';
  }
  function discardPreview() {
    generation++; preparing = false;
    preview.src = currentURL || DEFAULT;
    preview.alt = saved ? '当前已保存的头像' : '当前头像，默认图案';
    if (pending) URL.revokeObjectURL(pending.url);
    pending = null; input.value = ''; sync();
  }
  function leaveSettings() {
    if (mutating) { closedDuringWrite = true; return; }
    if (pending || preparing) { discardPreview(); tell('已取消未保存的预览，当前头像未改变。'); }
  }
  function showSaved(blob, url = '') {
    const old = currentURL;
    saved = blob;
    displayFailed = false;
    currentURL = blob ? (url || URL.createObjectURL(blob)) : '';
    sidebar.src = currentURL || DEFAULT;
    sidebar.alt = blob ? 'line 的本地头像' : '默认头像';
    preview.src = currentURL || DEFAULT;
    preview.alt = blob ? '当前已保存的头像' : '当前头像，默认图案';
    if (old && old !== currentURL) URL.revokeObjectURL(old);
  }
  function dimensions(width,height) {
    if (width < 32 || height < 32 || width > 8192 || height > 8192 || width*height > MAX_PIXELS) throw new Error('图片尺寸需至少 32×32，单边不超过 8192，且最多 1600 万像素。');
  }
  function inspect(bytes) {
    const d = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const word = (p,n) => String.fromCharCode(...bytes.subarray(p,p+n));
    let type = '', width = 0, height = 0;
    if (bytes.length >= 24 && d.getUint32(0) === 0x89504e47 && d.getUint32(4) === 0x0d0a1a0a) {
      type = 'image/png'; width = d.getUint32(16); height = d.getUint32(20);
      for (let p=8;p+12<=bytes.length;) {
        const length = d.getUint32(p), chunk = word(p+4,4);
        if (chunk === 'acTL') throw new Error('请选择静态图片，暂不支持动画 PNG。');
        if (length > bytes.length-p-12) break;
        p += length+12;
      }
    } else if (bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216) {
      type = 'image/jpeg';
      for (let p=2;p+4<bytes.length;) {
        if (bytes[p++] !== 255) break;
        while (p<bytes.length && bytes[p] === 255) p++;
        const marker = bytes[p++];
        if (marker === 217 || marker === 218) break;
        if (p+2>bytes.length) break;
        const length = d.getUint16(p);
        if (length<2 || p+length>bytes.length) break;
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length>=7) { height=d.getUint16(p+3); width=d.getUint16(p+5); break; }
        p += length;
      }
    } else if (bytes.length >= 30 && word(0,4) === 'RIFF' && word(8,4) === 'WEBP') {
      type = 'image/webp';
      const chunk = word(12,4);
      if (chunk === 'VP8X') {
        if (bytes[20]&2) throw new Error('请选择静态图片，暂不支持动画 WebP。');
        width = 1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);
        height = 1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);
      } else if (chunk === 'VP8 ' && word(23,3) === '\x9d\x01\x2a') {
        width=d.getUint16(26,true)&16383; height=d.getUint16(28,true)&16383;
      } else if (chunk === 'VP8L' && bytes[20] === 47) {
        const bits=d.getUint32(21,true); width=(bits&16383)+1; height=((bits>>>14)&16383)+1;
      }
    }
    if (!type) throw new Error('请选择静态 PNG、JPEG 或 WebP 图片。');
    dimensions(width,height);
    return type;
  }
  async function decode(blob) {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(blob);
      return {image:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close()};
    }
    return new Promise((resolve,reject) => {
      const image = new Image(), url = URL.createObjectURL(blob);
      const close = () => { image.onload = image.onerror = null; image.src = ''; URL.revokeObjectURL(url); };
      const timeout = setTimeout(() => { close(); reject(new Error('图片载入超时，请换一张图片。')); },8000);
      image.onload = () => { clearTimeout(timeout); resolve({image,width:image.naturalWidth,height:image.naturalHeight,close}); };
      image.onerror = () => { clearTimeout(timeout); close(); reject(new Error('图片无法解码，请重新选择。')); };
      image.src = url;
    });
  }
  async function processFile(file) {
    if (!file.size || file.size>MAX_FILE) throw new Error('图片最大为 5 MiB，请选择更小的有效图片。');
    if (file.type && !TYPES.includes(file.type)) throw new Error('请选择静态 PNG、JPEG 或 WebP 图片。');
    const type = inspect(new Uint8Array(await file.arrayBuffer()));
    if (file.type && type !== file.type) throw new Error('图片内容与文件类型不一致，请重新导出图片。');
    let decoded;
    try {
      decoded = await decode(file); dimensions(decoded.width,decoded.height);
      const edge = Math.min(decoded.width,decoded.height);
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
      if (!context) throw new Error('当前浏览器无法处理图片。');
      for (const limit of [512,384,256]) {
        canvas.width = canvas.height = Math.min(limit,edge);
        context.clearRect(0,0,canvas.width,canvas.height);
        context.drawImage(decoded.image,(decoded.width-edge)/2,(decoded.height-edge)/2,edge,edge,0,0,canvas.width,canvas.height);
        for (const quality of [.84,.70,.55]) {
          const blob = await new Promise((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片压缩失败，请换一张图片。')),type === 'image/jpeg' ? 'image/jpeg' : 'image/webp',quality));
          if (blob.size<=MAX_OUTPUT) return blob;
        }
      }
      throw new Error('图片处理后仍然过大，请选择更简单或更小的图片。');
    } catch (error) {
      if (error?.name === 'InvalidStateError' || error?.name === 'EncodingError') throw new Error('图片损坏或无法解码，请重新选择。');
      throw error;
    } finally { decoded?.close(); }
  }
  function openDatabase() {
    return new Promise((resolve,reject) => {
      let request, done = false;
      const fail = error => { if (!done) { done=true; clearTimeout(timeout); reject(error); } };
      const timeout = setTimeout(() => fail(new DOMException('Storage timeout','TimeoutError')),4000);
      try { request = indexedDB.open(DB,1); } catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        if (done) { request.transaction.abort(); return; }
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onblocked = () => fail(new DOMException('Database blocked','InvalidStateError'));
      request.onerror = () => fail(request.error);
      request.onsuccess = () => {
        if (done) { request.result.close(); return; }
        done=true; clearTimeout(timeout);
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }
  async function storage(action, blob) {
    const db = await openDatabase();
    try {
      return await new Promise((resolve,reject) => {
        let tx, value, request;
        const timeout = setTimeout(() => { try { tx?.abort(); } catch (_) {} reject(new DOMException('Transaction timeout','TimeoutError')); },4000);
        const fail = error => { clearTimeout(timeout); reject(error); };
        try {
          tx = db.transaction(STORE,action === 'read' ? 'readonly' : 'readwrite');
          tx.onabort = () => fail(tx.error || request?.error || new DOMException('Transaction aborted','AbortError'));
          tx.onerror = () => { /* The default abort is handled above. */ };
          tx.oncomplete = () => { clearTimeout(timeout); resolve(value); };
          const store = tx.objectStore(STORE);
          request = action === 'read' ? store.get(KEY) : action === 'save' ? store.put({version:1,blob},KEY) : store.delete(KEY);
          request.onsuccess = () => { value = request.result; };
        } catch (error) { try { tx?.abort(); } catch (_) {} fail(error); }
      });
    } finally { db.close(); }
  }
  function storageError(error, action) {
    const reason = error?.name === 'QuotaExceededError' ? '浏览器存储空间不足' : error?.name === 'TimeoutError' ? '本地存储响应超时' : error?.name === 'AbortError' ? '本地存储事务未完成' : '本地存储不可用或被占用';
    return `${action}：${reason}。当前头像未改变，请重试；预览不代表已保存。`;
  }
  async function select() {
    const file = input.files?.[0]; input.value = '';
    if (!file || mutating || loading) return;
    const token = ++generation;
    preparing = true; sync(); tell('正在处理图片，尚未保存。');
    try {
      const blob = await processFile(file);
      if (token !== generation) return;
      const url = URL.createObjectURL(blob), old = pending;
      pending = {blob,url}; preview.src = url; preview.alt = '未保存的头像预览';
      if (old) URL.revokeObjectURL(old.url);
      tell('预览尚未保存，侧栏仍显示原头像。点击“保存头像”后才会在本浏览器生效。');
    } catch (error) { if (token === generation) tell(error?.message || '图片处理失败，当前头像未改变。',true); }
    finally { if (token === generation) { preparing=false; sync(); } }
  }
  input.addEventListener('change',select);
  input.addEventListener('cancel',() => tell(pending ? '已取消选择，保留当前未保存预览。' : '已取消选择，当前头像未改变。'));
  cancelButton.addEventListener('click',() => { discardPreview(); tell('已取消未保存的预览，当前头像未改变。'); });
  saveButton.addEventListener('click',async() => {
    if (!pending || mutating || preparing) return;
    const candidate = pending;
    mutating=true; closedDuringWrite=false; saveButton.textContent='正在保存…'; sync(); tell('正在保存到当前浏览器…');
    try {
      await storage('save',candidate.blob);
      pending=null; showSaved(candidate.blob,candidate.url);
      tell('已保存到当前浏览器。其他设备或访客不会同步看到。');
    } catch (error) { tell(storageError(error,'未保存'),true); }
    finally {
      mutating=false; saveButton.textContent='保存头像';
      if (closedDuringWrite && pending) discardPreview();
      sync();
    }
  });
  resetButton.addEventListener('click',async() => {
    if (loading || mutating) return;
    generation++; preparing=false; mutating=true; closedDuringWrite=false; resetButton.textContent='正在恢复…'; sync();
    try {
      await storage('reset'); discardPreview(); showSaved(null);
      tell('已恢复默认头像，并删除本浏览器保存的头像。');
    } catch (error) { tell(storageError(error,'未恢复默认'),true); }
    finally {
      mutating=false; resetButton.textContent='恢复默认头像';
      if (closedDuringWrite && pending) discardPreview();
      sync();
    }
  });
  panel.addEventListener('close',leaveSettings);
  document.addEventListener('linetop:panelchange',event => { if (event.detail.name !== 'settings') leaveSettings(); });
  preview.addEventListener('error',() => {
    if (preview.src === DEFAULT) return;
    if (pending) discardPreview();
    else preview.src = DEFAULT;
    tell('图片载入失败，已回退有效头像或默认图案；没有保存此次预览。',true);
  });
  sidebar.addEventListener('error',() => {
    if (sidebar.src === DEFAULT) return;
    sidebar.src = DEFAULT; sidebar.alt = '默认头像';
    if (!pending) preview.src = DEFAULT;
    if (currentURL) URL.revokeObjectURL(currentURL);
    currentURL=''; displayFailed=true; sync();
    tell('头像载入失败，已回退默认图案。可重新选择或恢复默认头像。',true);
  });
  async function load() {
    const ticket = ++loadVersion;
    tell('正在读取当前浏览器保存的头像…'); sync();
    try {
      const record = await storage('read');
      if (ticket !== loadVersion) return;
      if (record !== undefined) {
        let decoded;
        try {
          if (record?.version !== 1 || !(record.blob instanceof Blob) || !record.blob.size || record.blob.size>MAX_OUTPUT || !TYPES.includes(record.blob.type)) throw new Error('Invalid stored avatar');
          inspect(new Uint8Array(await record.blob.arrayBuffer()));
          decoded=await decode(record.blob);
          if (ticket !== loadVersion) return;
          if (decoded.width !== decoded.height || decoded.width>512 || decoded.width<32) throw new Error('Invalid stored dimensions');
          showSaved(record.blob); tell('已恢复本浏览器保存的头像。');
        } catch (_) { if (ticket === loadVersion) { showSaved(null); tell('本地头像损坏或无法载入，已显示默认头像。可重新选择，或恢复默认清除此项。',true); } }
        finally { decoded?.close(); }
      } else { showSaved(null); tell('当前使用默认头像。选择图片后可先预览，再保存到当前浏览器。'); }
    } catch (error) { if (ticket === loadVersion) tell(storageError(error,saved ? '无法重新读取头像，保留当前有效头像' : '无法读取头像，暂用默认图案'),true); }
    finally { if (ticket === loadVersion) { loading=false; sync(); } }
  }
  window.addEventListener('pagehide',event => {
    generation++; loadVersion++; preparing=false;
    if (mutating) closedDuringWrite=true;
    else discardPreview();
    // A cached document still owns and may resume its current/committing image.
    if (!event.persisted) {
      if (currentURL) URL.revokeObjectURL(currentURL);
      if (pending) URL.revokeObjectURL(pending.url);
    }
  });
  window.addEventListener('pageshow',event => {
    if (!event.persisted) return;
    if (mutating) { closedDuringWrite=true; return; }
    discardPreview(); loading=true; load();
  });
  load();
})();
