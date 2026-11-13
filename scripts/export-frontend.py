"""Export a standalone static starter ZIP from the current working tree.

No dependencies, downloads, source-tree mutations, or remote operations.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / 'templates/frontend'
PREFIX = 'linetop-frontend-starter'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def export(output, storage_prefix, force=False):
    output = output.resolve()
    if output.is_relative_to((ROOT/'public').resolve()):
        raise ValueError('Output must stay outside the live public directory')
    if output.suffix.lower() != '.zip':
        raise ValueError('Output must use the .zip extension')
    if output.exists() and not force:
        raise ValueError('Output already exists; use --force to replace this ZIP')
    payload, origins = {}, {}
    def include(source, destination):
        p=ROOT/source
        if p.is_symlink() or not p.resolve().is_relative_to(ROOT):
            raise ValueError(f'Source is not a regular local file: {source}')
        payload[destination]=p.read_bytes()
        origins[destination]={'source':source,'sourceSha256':sha(payload[destination])}

    for p in sorted((ROOT/'public').rglob('*')):
        if p.is_symlink():
            raise ValueError(f'Symlink not exported: {p}')
        if p.is_file() and p.name != 'CNAME':
            include(p.relative_to(ROOT).as_posix(),p.relative_to(ROOT).as_posix())
    for name in ['scripts/build-map-page.py','scripts/build_components.py',
                 'tests/test-maps.mjs','tests/test-theme.mjs',
                 'tests/test-maps-browser.mjs','tests/test-theme-browser.mjs',
                 'docs/references/Uiverse收藏UI组件与源码整理.md','docs/references/palette.txt']:
        include(name,name)
    for source, target in [('README.md','README.md'),('COMPONENTS.md','docs/COMPONENTS.md'),
                           ('THIRD_PARTY.md','docs/THIRD_PARTY.md'),
                           ('components.css','public/assets/components-demo.css')]:
        include('templates/frontend/'+source,target)
    payload['.gitignore']=b'artifacts/\n__pycache__/\n*.pyc\n'

    # Keep runtime namespaces/events/DOM IDs; use a per-project preference prefix.
    # The palette radio name shares the old storage key; its selectors change
    # consistently in the copied JS/tests too, without touching the live site.
    for name in list(payload):
        if name.endswith(('.js','.mjs')) and '/vendor/' not in name:
            source=payload[name].decode('utf-8')
            for key in ['theme','palette','reduce-motion']:
                source=source.replace('linetop-'+key,storage_prefix+'-'+key)
            payload[name]=source.encode('utf-8')

    index=payload['public/index.html'].decode('utf-8')
    head=re.search(r'<head>[\s\S]*?</head>',index)[0]
    head=re.sub(r'<title>[^<]+</title>','<title>组件示例 · LineTop Starter</title>',head)
    head=re.sub(r'  <script src="assets/scene.js[^\n]+\n','',head)
    head=head.replace('</head>','  <link rel="stylesheet" href="assets/components-demo.css">\n</head>')
    shell=index[index.index('  <button class="menu-trigger"'):index.index('  <main id="main-content">')]
    shell=shell.replace('href="#','href="index.html#')
    dock=index[index.index('  <div class="quick-settings"'):index.index('</body>')]
    def slot(name):
        return re.search(rf'<!-- uiverse:{name}:start -->([\s\S]*?)<!-- uiverse:{name}:end -->',index)[1].strip()
    body=(TEMPLATES/'components.html').read_text(encoding='utf-8')
    body=body.replace('__EXPLORE__',slot('explore').replace('href="#personal"','href="index.html#personal"'))
    body=body.replace('__GITHUB__',slot('github'))
    cards=re.search(r'<div class="project-grid">([\s\S]*?)</section>',index)[0].rsplit('</section>',1)[0].strip()
    body=body.replace('__CARDS__',cards)
    payload['public/components.html']=('<!doctype html>\n<html lang="zh-CN">\n'+head+'\n<body class="reuse-demo">\n  <a class="skip-link" href="#main-content">跳到组件示例</a>\n'+shell+body+'\n'+dock+'</body>\n</html>\n').encode('utf-8')
    origins['public/components.html']={'source':'public/index.html + templates/frontend/components.html'}

    # References to old QA reports are history, not required runtime assets.
    name='public/data/maps/SOURCES.md'
    source=payload[name].decode('utf-8')
    source=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:
        m[1]+'（原仓库历史报告：`'+m[2]+'`）'
        if not urlsplit(m[2]).scheme and 'docs/verification/' in m[2] else m[0],source)
    payload[name]=source.encode('utf-8')

    # Run the existing generator in a private copy, never against live public.
    (ROOT/'artifacts').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='frontend-export-',dir=ROOT/'artifacts') as temp:
        stage=Path(temp)
        for name,data in payload.items():
            path=stage/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
        subprocess.run([sys.executable,str(stage/'scripts/build-map-page.py')],cwd=stage,check=True,capture_output=True)
        for name in list(payload):
            payload[name]=(stage/name).read_bytes()

    # Version the gallery resources after storage-key changes and regeneration.
    gallery=payload['public/components.html'].decode('utf-8')
    gallery=re.sub(r'((?:src|href)=")((?:assets/)[^"?]+)(?:\?v=[a-f0-9]+)?(")',
        lambda m:m[1]+m[2]+'?v='+sha(payload['public/'+m[2]])[:10]+m[3],gallery)
    payload['public/components.html']=gallery.encode('utf-8')
    manifest={'formatVersion':1,'kind':'static-frontend-starter','storagePrefix':storage_prefix,
              'excluded':['CNAME','.git','artifacts','project handoff/history'],
              'files':[{'path':name,'sha256':sha(data),**origins.get(name,{'source':'generated'})}
                       for name,data in sorted(payload.items())]}
    payload['manifest.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    output.parent.mkdir(parents=True,exist_ok=True)
    # Stable entry times/order make repeated exports of the same input identical.
    with tempfile.NamedTemporaryFile(dir=output.parent,suffix='.zip',delete=False) as f:
        temporary=Path(f.name)
    try:
        with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
            for name,data in sorted(payload.items()):
                info=zipfile.ZipInfo(PREFIX+'/'+name,date_time=(1980,1,1,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
                archive.writestr(info,data)
        if output.exists() and not force:
            raise ValueError('Output appeared during export; refusing to replace it')
        if output.exists() and sha(output.read_bytes()) == sha(temporary.read_bytes()):
            # An identical rebuild is already complete. Avoid needlessly
            # replacing an archive another process may currently be reading.
            return {'archive':str(output),'files':len(payload),'bytes':output.stat().st_size,'sha256':sha(output.read_bytes())}
        # Windows may briefly lock a newly written ZIP for indexing/scanning.
        # Retry the atomic rename; never delete the previous archive first.
        for attempt in range(6):
            try:
                temporary.replace(output)
                break
            except PermissionError:
                if attempt == 5: raise
                time.sleep(.1 * (attempt + 1))
    finally:
        if temporary.exists(): temporary.unlink()
    return {'archive':str(output),'files':len(payload),'bytes':output.stat().st_size,'sha256':sha(output.read_bytes())}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist/linetop-frontend-starter.zip')
    parser.add_argument('--storage-prefix',default='linetop-starter',help='Unique lower-case project slug for saved preferences')
    parser.add_argument('--force',action='store_true',help='Replace only the named output ZIP')
    args=parser.parse_args()
    if not re.fullmatch(r'[a-z][a-z0-9-]{0,47}',args.storage_prefix):
        parser.error('storage-prefix must be 1-48 lower-case letters, digits or hyphens, starting with a letter')
    try: result=export(args.output,args.storage_prefix,args.force)
    except (ValueError,OSError,subprocess.CalledProcessError) as e: parser.exit(1,str(e)+'\n')
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__': main()
