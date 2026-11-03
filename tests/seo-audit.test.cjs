'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const get=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pub=get('portal/index.html'),adm=get('studio/portal/index.html'),root=get('index.html'),robot=get('robots.txt'),site=get('sitemap.xml');
const tool=get('ferramentas/gerador-link-whatsapp/index.html'),toolList=get('ferramentas/index.html');
test('Sitemap valid URL list; no admin or QR paths',()=>{
 const urls=[...site.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert.equal(new Set(urls).size,urls.length);
 const required=['/','/servicos','/portfolio','/sobre','/contato','/suporte','/projeto','/curitiba','/pinhais','/ferramentas','/ferramentas/gerador-link-whatsapp/'];
 for(const route of required)assert.ok(urls.includes('https://willai.com.br'+route),route);
 assert.ok(urls.every(x=>x.startsWith('https://willai.com.br/')&&!x.includes('/studio/')&&!x.includes('/qr/')));
});
test('Robots allows required public resources and advertises sitemap',()=>{
 assert.match(robot,/User-agent:\s*\*/);
 assert.match(robot,/Allow:\s*\//);
 assert.match(robot,/Sitemap:\s*https:\/\/willai\.com\.br\/sitemap\.xml/);
 assert.doesNotMatch(robot,/Disallow:\s*\/portal/);
 assert.doesNotMatch(robot,/Disallow:\s*\/assets/);
});
test('SEO for SPA routes: title, descriptions, canonical, noindex for private routes',()=>{
 for(const source of [pub,adm]){
  assert.match(source,/function updateSeoMeta\(\)/);
  assert.match(source,/function setSeoTag\(/);
  assert.match(source,/updateSeoMeta\(\)\}/);
  assert.match(source,/https:\/\/willai\.com\.br/);
  for(const route of ['servicos','portfolio','sobre','contato','suporte','projeto'])assert.ok(source.includes(route+':[')||source.includes(route+': ['),route);
  assert.match(source,/noindex,follow/);
  assert.match(source,/application\/ld\+json/);
 }
});
test('Static tool SEO retains correct canonical and structured data',()=>{
 assert.match(tool,/rel="canonical" href="https:\/\/willai\.com\.br\/ferramentas\/gerador-link-whatsapp\/"/);
 assert.match(tool,/application\/ld\+json/);
 assert.match(toolList,/rel="canonical" href="https:\/\/willai\.com\.br\/ferramentas"/);
});
test('No SEO directives block public home, internal images have alt',()=>{
 assert.doesNotMatch(root,/name="robots"\s+content="noindex/);
 for(const page of [root,tool,toolList]){
  assert.equal([...page.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)].length,0);
 }
});
test('SEO-sensitive user routes were not removed',()=>{
 for(const name of ['function home(){','function cityCuritibaPremium(','function contactPage(){','function supportPage(){','function portfolioPage(){']){
  assert.ok(pub.includes(name),name);
 }
});
test('Optional llms.txt cannot replace sitemap',()=>{
 const data=get('llms.txt');
 assert.match(data,/https:\/\/willai\.com\.br\//);
 assert.match(data,/não garante indexação/);
});
