'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../studio/qr/artes-engine.js'),'utf8');
const admin=fs.readFileSync(path.join(__dirname,'../studio/qr/admin-real.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../studio/qr/index.html'),'utf8');
const secret='a'.repeat(48);
const templates={
 willai:'<svg xmlns="http://www.w3.org/2000/svg"><image x="40" y="50" width="140" height="140" href="data:image/png;base64,LOGO"/><!-- QR W001 — https://willai.com.br/qr/W001 --><rect x="240" y="260" width="520" height="520" fill="#ffffff"/><image x="240" y="260" width="520" height="520" image-rendering="pixelated" href="data:image/png;base64,OLD-W001-QR"/></svg>',
 google:'<svg xmlns="http://www.w3.org/2000/svg"><image x="50" y="70" width="50" height="50" href="data:image/png;base64,PHOTO"/><!-- QR W001 — https://willai.com.br/qr/W001 --><rect x="102" y="955" width="330" height="330" fill="white"/><image x="102" y="955" width="330" height="330" image-rendering="pixelated" href="data:image/png;base64,OLD-W001-QR"/></svg>'
};
function harness(){
 const nodes=new Map(),urls=[],payloads=[];
 const el=id=>{if(!nodes.has(id))nodes.set(id,{
  value:id==='artCode'?'W002':'',textContent:'',innerHTML:'',disabled:false,style:{},
  src:'',classList:{toggle(){}},listeners:{},
  addEventListener(type,cb){this.listeners[type]=cb},
  removeAttribute(prop){delete this[prop]},
  click(){},append(){},remove(){}
 });return nodes.get(id)};
 let blobId=0;
 const URLFake={createObjectURL(){return 'blob:sample-'+(++blobId)},revokeObjectURL(x){urls.push(x)}};
 const document={getElementById:el,createElement:()=>({getContext:()=>({}),click(){},remove(){}}),body:{append(){}}};
 const qrcode=()=>({input:'',addData(value){this.input=value;payloads.push(value)},make(){},getModuleCount(){return 2},isDark(y,x){return y===x}});
 const win={};
 vm.runInNewContext(src,{window:win,document,fetch:async url=>({ok:true,text:async()=>templates[url.includes('google')?'google':'willai']}),URL:URLFake,
  qrcode,Blob,atob,Uint8Array,TextEncoder,Image:class Image{},setTimeout,clearTimeout,JSZip:class {},console});
 return {api:win.WILLAI_ARTES,el,payloads,urls};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
test('scripts parse and searchable picker exists',()=>{
 new vm.Script(src);new vm.Script(admin);
 assert.match(html,/id="artCodeGrid"/);assert.match(html,/id="artFindCode"/);
 assert.match(admin,/data-quick-art/);
});
test('W002 and W003 both show previews without CSV, downloads stay locked',async()=>{
 const h=harness();h.api.useRealInventory([{code:'W001',status:'active'},{code:'W002',status:'available'},{code:'W003',status:'held'}]);
 await tick();
 assert.match(h.el('artStatus').textContent,/Prévia de W002 pronta/);
 assert.equal(h.el('artSVG').disabled,true);
 assert.equal(h.el('artPDF').disabled,true);
 assert.match(h.el('artLink').textContent,/W002/);
 assert.equal(h.api.readyForPrint('W003').ready,false);
 h.el('artCode').value='W003';
 h.el('artCode').listeners.change();
 await tick();
 assert.match(h.el('artStatus').textContent,/Prévia de W003 pronta/);
});
test('on import CSV, all registered codes become individually exportable',async()=>{
 const h=harness();h.api.useRealInventory([{code:'W001',status:'active'},{code:'W002',status:'available'},{code:'W003',status:'held'}]);
 h.api.setActivationSecrets([{code:'W002',secret},{code:'W003',secret:'b'.repeat(48)}]);
 await tick();
 assert.equal(h.api.readyForPrint('W002').ready,true);
 assert.equal(h.el('artSVG').disabled,false);
 const w2=await h.api.makeSvg('W002','willai');
 const w3=await h.api.makeSvg('W003','willai');
 assert.match(w2,/W002/);assert.match(w3,/W003/);
 assert.ok(!w2.includes('OLD-W001-QR'));
 assert.ok(!w3.includes('OLD-W001-QR'));
 assert.ok(h.payloads.some(url=>url==='https://willai.com.br/qr/W002#ativar='+secret));
 assert.ok(h.payloads.some(url=>url==='https://willai.com.br/qr/W003#ativar='+('b'.repeat(48))));
});
test('the Google model also removes its sample W001 QR and preserves other photos',async()=>{
 const h=harness();h.api.useRealInventory([{code:'W002',status:'available'}]);
 h.api.setActivationSecrets([{code:'W002',secret}]);
 const w2=await h.api.makeSvg('W002','google');
 assert.ok(!w2.includes('OLD-W001-QR'));
 assert.match(w2,/data:image\/png;base64,PHOTO/);
 assert.match(w2,/W002/);
 assert.ok(w2.includes('fill="#070b0e"'));
});
test('without CSV no SVG can be produced for an inactive plaque',async()=>{
 const h=harness();h.api.useRealInventory([{code:'W002',status:'available'}]);
 await assert.rejects(h.api.makeSvg('W002','willai'),/CSV de segredos/);
});
test('an active plaque is printable from its permanent public URL',async()=>{
 const h=harness();h.api.useRealInventory([{code:'W001',status:'active'}]);
 const svg=await h.api.makeSvg('W001','willai');
 assert.match(svg,/W001/);
 assert.ok(h.payloads.some(x=>x==='https://willai.com.br/qr/W001'));
});