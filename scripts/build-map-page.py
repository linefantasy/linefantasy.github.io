"""Regenerate map.html from the current index sidebar/settings shell and map template.
Static generation only; no runtime include requests and no third-party dependencies.
"""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1]
index = (root/'index.html').read_text(encoding='utf-8')
index = re.sub(r'(assets/[^"?]+)\?v=[a-f0-9]+',lambda m:m[1]+'?v='+hashlib.sha256((root/m[1]).read_bytes()).hexdigest()[:10],index)
(root/'index.html').write_text(index,encoding='utf-8')
# Leaf-first dependency hashes prevent an updated entry module from importing a
# stale cached canvas/detail module after publishing static files.
for filename in ['map-detail.mjs','map-explorer.mjs']:
    path = root/'assets/maps'/filename
    original = path.read_text(encoding='utf-8')
    source = re.sub(r"(from ['\"])(\./[^'\"?]+\.mjs)(?:\?v=[a-f0-9]+)?(['\"])",lambda m:m[1]+m[2]+'?v='+hashlib.sha256((path.parent/m[2]).read_bytes()).hexdigest()[:10]+m[3],original)
    if source != original:
        path.write_text(source,encoding='utf-8')
head = re.search(r'<head>[\s\S]*?</head>',index)[0]
head = head.replace('<title>LineTop. — line fantasy</title>','<title>地图 · Map Explorer — LineTop</title>')
head = re.sub(r'  <script src="assets/scene.js[^\n]+\n','',head)
head = head.replace('</head>','  <link rel="stylesheet" href="assets/maps/map.css">\n  <script src="assets/vendor/d3-array.min.js" defer></script>\n  <script src="assets/vendor/d3-geo.min.js" defer></script>\n  <script type="module" src="assets/maps/map-explorer.mjs"></script>\n</head>')
shell = index[index.index('  <button class="menu-trigger"'):index.index('  <main id="main-content">')]
shell = shell.replace('href="#','href="index.html#')
dock = index[index.index('  <div class="quick-settings"'):index.index('</body>')]
template = (root/'assets/maps/map-page.template.html').read_text(encoding='utf-8')
out = '<!doctype html>\n<html lang="zh-CN" data-page="projects">\n'+head+'\n<body class="map-page">\n  <a class="skip-link" href="#map-svg">跳到地图</a>\n'+shell+template+'\n'+dock+'</body>\n</html>\n'
# Version every first-party and vendored asset. ESM imports use the versioned
# entry URL; all modules are local and servers retain normal cache validation.
out = re.sub(r'((?:src|href)=")((?:assets/)[^"?]+)(?:\?v=[a-f0-9]+)?(")',lambda m:m[1]+m[2]+'?v='+hashlib.sha256((root/m[2]).read_bytes()).hexdigest()[:10]+m[3],out)
(root/'map.html').write_text(out,encoding='utf-8')
print('Generated map.html from current shared shell; no source snapshots overwritten')
