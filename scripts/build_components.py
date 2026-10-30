"""Extract actual local Uiverse source, scope it, and inject adapted markup.

No download, npm dependency, or runtime build step. Run only when changing components.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Uiverse收藏UI组件与源码整理.md'
OUT = ROOT / 'assets' / 'uiverse'
OUT.mkdir(parents=True, exist_ok=True)
text = SOURCE.read_text(encoding='utf-8-sig')
parts = {}
manifest = []
for number in [3, 4, 7, 18, 20]:
    section = re.search(rf'^## {number}\. (.*?)(?=^## |\Z)', text, re.M | re.S)
    body = section.group(0)
    slug = section.group(1).splitlines()[0]
    author = re.search(r'作者：([^\s]+)', body).group(1)
    url = re.search(r'原页面：\[(.*?)\]', body).group(1)
    blocks = dict(re.findall(r'```(html|css)\n(.*?)```', body, re.S))
    parts[number] = blocks
    entry = dict(number=number, slug=slug, author=author, url=url, original={})
    for language, code in blocks.items():
        filename = f'{number:02d}-{slug}.original.{language}'
        (OUT / filename).write_text(code, encoding='utf-8', newline='\n')
        entry['original'][language] = dict(path=filename, sha256=hashlib.sha256(code.encode()).hexdigest())
    manifest.append(entry)

mapping = {
    'checkbox':'lt-checkbox', 'checkmark':'lt-checkmark',
    'container':'lt-nav-container', 'tabs':'lt-tabs', 'tab':'lt-tab', 'glider':'lt-glider', 'notification':'lt-notification',
    'btn-53':'lt-explore', 'original':'lt-original', 'letters':'lt-letters',
    'card':'lt-project-card', 'card2':'lt-project-inner',
    'example-2':'lt-social', 'icon-content':'lt-icon-content', 'filled':'lt-filled', 'tooltip':'lt-tooltip'
}
def scope(code):
    if '<' in code and re.search(r'<(?:div|label|button|ul|li)\b', code):
        # Scope class tokens only: input type="checkbox" is native HTML semantics.
        return re.sub(r'class="([^"]+)"', lambda m: 'class="' + ' '.join(mapping.get(token, token) for token in m.group(1).split()) + '"', code)
    for old, new in sorted(mapping.items(), key=lambda item: -len(item[0])):
        code = re.sub(r'(?<![\w-])' + re.escape(old) + r'(?![\w-])', new, code)
    return code

styles = ['/* Generated from the local collection by scripts/build_components.py. */']
for entry in manifest:
    n = entry['number']
    css = parts[n]['css']
    if n == 3:
        css = css.replace('--checkbox-color: white', '--checkbox-color: var(--ink)')
    elif n == 4:
        # Keep the real flex/tab/glider/translate mechanism. Replace radio-state selectors
        # with link location state in style.css/main.js, remove irrelevant demo badges.
        css = re.sub(r'@media[^{}]*\{\s*\.tabs\s*\{[^}]*\}\s*\}', '', css)
        css = re.sub(r'[^{}]+\{[^{}]*\}', lambda m: '' if 'input' in m.group(0).split('{')[0] or 'notification' in m.group(0).split('{')[0] else m.group(0), css)
        css = re.sub(r'box-shadow:[^;]+;', 'box-shadow: none;', css)
        css = css.replace('#e6eef9', 'var(--lime)').replace('color: black', 'color: var(--ink)')
    elif n == 7:
        css = css.replace('#000', 'var(--ink)').replace('#fff', 'var(--white)')
    elif n == 18:
        css = re.sub(r'background-image:[^;]+;', 'background: var(--lime);', css)
        css = css.replace('#1a1a1a', 'var(--white)').replace('border-radius:;', 'border-radius: 16px;')
        css = re.sub(r'box-shadow:[^;]+;', 'box-shadow: none;', css)
    elif n == 20:
        css = css[:css.index('.example-2 .icon-content a[data-social="linkedin"]')]
        css = re.sub(r'^ul\s*\{', '.lt-social {', css, flags=re.M)
        css = css.replace('#4d4d4d', 'var(--ink)').replace('#000', 'var(--lime)').replace('#fff', 'var(--white)').replace('color: white', 'color: var(--ink)')
        css = re.sub(r'box-shadow:[^;]+;', 'box-shadow: none;', css)
    styles.append(f'\n/* Source: {entry["url"]} ; local item {n}. */\n' + scope(css).strip())
(OUT / 'components.css').write_text('\n'.join(styles) + '\n', encoding='utf-8')
(OUT / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

explore = scope(parts[7]['html'])
explore = explore.replace('<button class="lt-explore">', '<a class="lt-explore" href="#personal" aria-label="向下探索，认识 Line">').replace('</button>', '</a>')
explore = explore.replace('<div class="lt-original">Button</div>', '<div class="lt-original" aria-hidden="true">向下探索 ↓</div>')
explore = re.sub(r'<div class="lt-letters">.*?</div>', '<div class="lt-letters" aria-hidden="true"><span>向</span><span>下</span><span>探</span><span>索</span><span>↓</span></div>', explore, flags=re.S)
explore = explore.replace('<!-- From', '<!-- https://uiverse.io/doniaskima/happy-turtle-32 -->\n<!-- From')
checkbox = scope(parts[3]['html']).replace('<input type="checkbox" />', '<input type="checkbox" id="lt-reduce-motion" name="lt-reduce-motion" aria-describedby="motion-description motion-status" disabled />').replace('<span>Option</span>', '<span>减少动态效果</span>').replace('<svg ', '<svg aria-hidden="true" ')
checkbox = checkbox.replace('<!-- From', '<!-- https://uiverse.io/andrew-manzyk/ancient-turtle-91 -->\n<!-- From')
github = re.search(r'<li class="icon-content">\s*<a href="https://www.github.com/".*?</li>', parts[20]['html'], re.S).group(0)
github = scope(github).replace('https://www.github.com/', 'https://github.com/linefantasy').replace('aria-label="GitHub"', 'aria-label="访问 LineTop 的 GitHub：linefantasy"').replace('<svg\n', '<svg aria-hidden="true"\n')
github = '<!-- From Uiverse.io by wilsondesouza -->\n<!-- https://uiverse.io/wilsondesouza/brave-earwig-75 -->\n<ul class="lt-social">' + github + '</ul>'
page = (ROOT / 'index.html').read_text(encoding='utf-8-sig')
for name, markup in [('explore', explore), ('checkbox', checkbox), ('github', github)]:
    pattern = rf'<!-- uiverse:{name}:start -->.*?<!-- uiverse:{name}:end -->'
    replacement = f'<!-- uiverse:{name}:start -->\n{markup.strip()}\n<!-- uiverse:{name}:end -->'
    page, count = re.subn(pattern, lambda _: replacement, page, flags=re.S)
    assert count == 1, f'Missing/duplicate injection slot: {name}'
assert 'type="checkbox" id="lt-reduce-motion"' in page, 'Native checkbox semantics must survive scoping.'
(ROOT / 'index.html').write_text('\n'.join(line.rstrip() for line in page.splitlines()) + '\n', encoding='utf-8', newline='\n')
print('Extracted 5 local components; generated scoped CSS and actual adapted markup.')
