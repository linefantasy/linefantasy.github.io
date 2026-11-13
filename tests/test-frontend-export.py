"""ZIP contract and a clean extracted project's real checks; stdlib only."""
from pathlib import Path
import hashlib
from html.parser import HTMLParser
import json
import re
import subprocess
import sys
import tempfile
import unittest
import zipfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts/export-frontend.py'

class ExportTests(unittest.TestCase):
    def test_portable_complete_reproducible_archive(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'artifacts') as temp:
            base=Path(temp); archive=base/'starter.zip'
            cmd=[sys.executable,str(SCRIPT),'--output',str(archive),'--storage-prefix','my-demo']
            subprocess.run(cmd,check=True,capture_output=True)
            digest=hashlib.sha256(archive.read_bytes()).hexdigest()
            with zipfile.ZipFile(archive) as z:
                z.extractall(base/'unpacked')
            kit=base/'unpacked/linetop-frontend-starter'
            files={p.relative_to(kit).as_posix() for p in kit.rglob('*') if p.is_file()}
            self.assertTrue({'public/index.html','public/map.html','public/components.html',
                'docs/COMPONENTS.md','docs/THIRD_PARTY.md','README.md','manifest.json',
                'public/assets/maps/map-data-service.mjs','public/data/maps/japan.geojson',
                'scripts/build-map-page.py','scripts/build_components.py'} <= files)
            self.assertFalse(any('CNAME' in p or '.git/' in p or 'artifacts/' in p or 'WORK_STATUS' in p for p in files))
            manifest=json.loads((kit/'manifest.json').read_text(encoding='utf-8'))
            self.assertEqual(manifest['storagePrefix'],'my-demo')
            self.assertEqual({e['path'] for e in manifest['files']},files-{'manifest.json'})
            for entry in manifest['files']:
                self.assertEqual(entry['sha256'],hashlib.sha256((kit/entry['path']).read_bytes()).hexdigest())
            class Resources(HTMLParser):
                def handle_starttag(parser,tag,attrs):
                    for key,url in attrs:
                        if key not in ['src','href','data-fallback'] or not url: continue
                        parsed=urlsplit(url)
                        if parsed.scheme or parsed.netloc or not parsed.path: continue
                        resource=page.parent/unquote(parsed.path)
                        self.assertTrue(resource.is_file(),f'{page.name}: {url}')
                        if parsed.query.startswith('v='):
                            self.assertEqual(parsed.query[2:],hashlib.sha256(resource.read_bytes()).hexdigest()[:10])
            for page in (kit/'public').glob('*.html'):
                Resources().feed(page.read_text(encoding='utf-8'))
            for page in [kit/'README.md',kit/'docs/COMPONENTS.md',kit/'docs/THIRD_PARTY.md',kit/'public/data/maps/SOURCES.md']:
                content=re.sub(r'```[\s\S]*?```','',page.read_text(encoding='utf-8'))
                for url in re.findall(r'\[[^\]]+\]\(([^)]+)\)',content):
                    parsed=urlsplit(url)
                    if not parsed.scheme and parsed.path:
                        self.assertTrue((page.parent/unquote(parsed.path)).exists(),f'{page}: {url}')
            source=(kit/'public/assets/theme-init.js').read_text(encoding='utf-8')
            self.assertIn('my-demo-theme',source);self.assertNotIn("'linetop-theme'",source)
            for command in [[sys.executable,'scripts/build-map-page.py'],['node','tests/test-maps.mjs'],['node','tests/test-theme.mjs']]:
                subprocess.run(command,cwd=kit,check=True,capture_output=True)
            rejected=subprocess.run(cmd,capture_output=True)
            self.assertNotEqual(rejected.returncode,0)
            self.assertEqual(digest,hashlib.sha256(archive.read_bytes()).hexdigest())
            forced=subprocess.run(cmd+['--force'],capture_output=True)
            self.assertEqual(forced.returncode,0,forced.stderr.decode('utf-8',errors='replace'))
            self.assertEqual(digest,hashlib.sha256(archive.read_bytes()).hexdigest())

    def test_invalid_prefix_does_not_create_output(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'artifacts') as temp:
            archive=Path(temp)/'bad.zip'
            p=subprocess.run([sys.executable,str(SCRIPT),'--output',str(archive),'--storage-prefix','../bad'],capture_output=True)
            self.assertNotEqual(p.returncode,0);self.assertFalse(archive.exists())
            self.assertIn(b'storage-prefix',p.stderr)

    def test_live_public_directory_is_never_an_output(self):
        archive=ROOT/'public/forbidden-export.zip'
        self.assertFalse(archive.exists())
        p=subprocess.run([sys.executable,str(SCRIPT),'--output',str(archive)],capture_output=True)
        self.assertNotEqual(p.returncode,0)
        self.assertIn(b'live public directory',p.stderr)
        self.assertFalse(archive.exists())

if __name__=='__main__': unittest.main()
