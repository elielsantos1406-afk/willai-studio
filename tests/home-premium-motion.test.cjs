'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pub=read('portal/index.html'),studio=read('studio/portal/index.html');
const getCss=s=>s.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
const getMotion=s=>s.slice(s.indexOf('let whMotionObserver=null;'),s.indexOf('function renderContent(){'));
test('Design and animations are isolated to home and identical in editor',()=>{
 const a=getCss(pub),b=getCss(studio),start='/* HOME V2 |';
 assert.ok(a.includes(start)&&b.includes(start));
 assert.equal(a.slice(a.indexOf(start)),b.slice(b.indexOf(start)));
 assert.equal(getMotion(pub),getMotion(studio));
 assert.match(a,/\.home-rework \.wh-hero h1\{/);
 assert.match(a,/\.home-rework \.wh-showcase-frame>img\{height:auto;aspect-ratio:1\.75;object-fit:contain/);
 assert.match(a,/@media\(max-width:480px\)/);
 assert.match(a,/@media\(max-width:345px\)/);
 assert.match(a,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(a,/@keyframes hm-enter/);
 assert.match(a,/@keyframes hm-showcase/);
});
test('Existing site modules, links, and SEO hooks are retained',()=>{
 for(const s of [pub,studio]){
  assert.match(s,/function cityCuritibaPremium\(/);
  assert.match(s,/function supportPage\(/);
  assert.match(s,/function contactPage\(/);
  assert.match(s,/function portfolioPage\(/);
  assert.match(s,/function updateSeoMeta\(/);
  assert.match(s,/updateSeoMeta\(\);initHomeMotion\(\)/);
  assert.match(s,/state\.portfolio/);
  assert.match(s,/goto\('suporte'\)/);
 }
});
test('Motion is progressive and observes only home elements',()=>{
 const node=()=>{const classes=new Set(),styles={};
  return {classList:{add:x=>classes.add(x),contains:x=>classes.has(x)},style:{setProperty:(k,v)=>{styles[k]=v}},has:x=>classes.has(x)};
 };
 const elems=[node(),node(),node(),node()],root=node();
 root.querySelectorAll=()=>elems;
 let created;
 class Observer{
  constructor(cb,opts){this.cb=cb;this.opts=opts;this.items=[];this.disconnected=false;created=this}
  observe(item){this.items.push(item)}
  unobserve(item){this.items=this.items.filter(v=>v!==item)}
  disconnect(){this.disconnected=true}
 }
 const doc={querySelector:()=>root};
 const win={IntersectionObserver:Observer,matchMedia:()=>({matches:false})};
 const start=getMotion(pub);
 assert.ok(start.includes('function initHomeMotion()'));
 const init=new Function('document','window','IntersectionObserver',start+'\nreturn initHomeMotion')(doc,win,Observer);
 init();
 assert.ok(root.has('wh-motion-on'));
 assert.equal(created.items.length,4);
 created.cb([{target:elems[0],isIntersecting:true}],created);
 assert.ok(elems[0].has('wh-inview'));
 doc.querySelector=()=>null;init();
 assert.equal(created.disconnected,true);
});
test('Reduced motion and lack of observers leave every section visible',()=>{
 const node=()=>{const classes=new Set();return {classList:{add:x=>classes.add(x),contains:x=>classes.has(x)},has:x=>classes.has(x)};
 };
 const root=node(),item=node();root.querySelectorAll=()=>[item];
 const code=getMotion(pub);
 const doc={querySelector:()=>root};
 let win={matchMedia:()=>({matches:true}),IntersectionObserver:function(){}};
 new Function('document','window','IntersectionObserver',code+'\nreturn initHomeMotion')(doc,win,win.IntersectionObserver)();
 assert.ok(!root.has('wh-motion-on'));
 win={matchMedia:()=>({matches:false})};
 new Function('document','window','IntersectionObserver',code+'\nreturn initHomeMotion')(doc,win,null)();
 assert.ok(!root.has('wh-motion-on'));
});
