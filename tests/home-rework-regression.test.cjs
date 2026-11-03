'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pub=read('portal/index.html'),admin=read('studio/portal/index.html');
const homeSource=s=>s.slice(s.indexOf('function home(){'),s.indexOf('function project(){'));
const seedCode=pub.slice(pub.indexOf('const seed={'),pub.indexOf('let state=structuredClone(seed)'));
const seed=new Function('A',seedCode+';return seed;')('/assets/');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=x=>/^(https?:\\/\\/|mailto:|tel:|#)/i.test(String(x||''))?esc(x):'#';
const state={...seed,portfolio:[
 {title:'Autoescola - Demo',category:'Demonstração',image:'https://example.org/a.webp',url:'https://example.org/a',visible:true},
 {title:'Pet Shop - Demo',category:'Demonstração',image:'https://example.org/b.webp',url:'https://example.org/b',visible:true},
 {title:'Rascunho',image:'https://example.org/hidden.webp',url:'https://example.org/hidden',visible:false},
 {title:'Inseguro',image:'https://example.org/js.webp',url:'javascript:alert(1)',visible:true}
]};
function render(source,isAdmin){return new Function('state','adminMode','esc','link','icon','A',homeSource(source)+';return home();')(state,isAdmin,esc,link,()=>'<svg/>','/assets/')}
test('home change is identical in public and admin portal',()=>assert.equal(homeSource(pub),homeSource(admin)));
test('home uses safe routes, actual demos and four services',()=>{
 const html=render(pub,false);
 assert.match(html,/href="\/contato"/);
 assert.match(html,/href="\/portfolio"/);
 assert.match(html,/href="\/servicos"/);
 assert.match(html,/href="\/projeto"/);
 assert.match(html,/href="\/suporte"/);
 assert.equal((html.match(/class="wh-service"/g)||[]).length,4);
 assert.equal((html.match(/class="wh-project"/g)||[]).length,2);
 assert.ok(!html.includes('Rascunho')&&!html.includes('Inseguro'));
 assert.match(html,/Demonstração/);
});
test('admin preview stays in portal routes',()=>{
 const html=render(admin,true);
 assert.match(html,/href="#\/contato"/);
 assert.match(html,/href="#\/portfolio"/);
 assert.match(html,/href="#\/projeto"/);
 assert.match(html,/href="#\/suporte"/);
});
test('CSS resides in first inline style imported by SPA router',()=>{
 for(const source of [pub,admin]){
  const css=source.match(/<style>([\\s\\S]*?)<\\/style>/)?.[1]||'';
  assert.match(css,/\\.home-rework \\.wh-hero-grid/);
  assert.match(css,/@media\\(max-width:480px\\)/);
 }
 const router=read('assets/router.js');
 assert.match(router,/doc\\.querySelector\\('style'\\)/);
});
test('other pages and admin editor remain in place',()=>{
 for(const source of [pub,admin]){
  for(const needle of ['function contactPage()','function supportPage()','function cityCuritibaPremium(','function project()','function editor()','function serviceCards(']){
   assert.ok(source.includes(needle),needle);
  }
 }
});
