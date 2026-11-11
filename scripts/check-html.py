from html.parser import HTMLParser
from pathlib import Path
import json, os, subprocess

ROOT = Path(__file__).resolve().parents[1]
VOID = {'meta','input','br','hr','img','link','source','wbr','area','base','embed','param','track','col'}
class Structure(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack=[]
        self.ids=[]
        self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if 'href' in attrs: self.links.append(attrs['href'])
        if tag not in VOID: self.stack.append(tag)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID: self.stack.pop()
    def handle_endtag(self,tag):
        assert self.stack and self.stack[-1]==tag,(tag,self.stack[-3:])
        self.stack.pop()

def validate(name,html):
    p=Structure(); p.feed(html)
    assert not p.stack,(name,p.stack)
    assert len(p.ids)==len(set(p.ids)),name+' duplicate IDs'
    for link in p.links:
        if link.startswith(('https:','http:','data:','#','mailto:')): continue
        assert (ROOT/link.split('#')[0]).exists(),(name,link)

validate('index.html',(ROOT/'index.html').read_text(encoding='utf-8'))
result=subprocess.run([os.environ.get('NODE_BINARY','node'),'--input-type=module','-','--views'],input=(ROOT/'scripts/check.mjs').read_text(encoding='utf-8'),cwd=ROOT/'scripts',capture_output=True,text=True,encoding='utf-8',check=True)
views=json.loads(result.stdout)
for name,html in views.items(): validate(name,html)
for name in ['LICENSE','README.md','SOURCES.md','EDUCATIONAL-NOTES.md','assets/social-preview.png','assets/social-preview.svg']:
    assert (ROOT/name).is_file(),name
print('PASS: complete page, '+str(len(views))+' rendered views, unique IDs and local assets.')
