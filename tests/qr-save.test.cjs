const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/../qr/qr-app.js','utf8');
function setup(options={}){
 const nodes=new Map(),calls=[];
 const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,classList:{add(){},remove(){}},scrollIntoView(){}});return nodes.get(id)};
 const ctx={$,jwt:'token',owner:true,data:{name:'Café de teste',google:'',reviewV4:{theme:{accent:'#ff0000'}}},active:false,record:{status:'pending'},code:'W900001',message:()=>{},restoreSession:async()=>options.session!==false,absoluteUrl:s=>/^https:\/\//.test(s)?s:'',card:()=>'',setTimeout,clearTimeout,AbortController,
 api:async(...args)=>{calls.push(args);if(options.error)throw Error(options.error);if(options.pending)await options.pending;return options.response||{ok:true}}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let saving=false;'),source.indexOf("$('signOut').onclick")),ctx);
 return {ctx,$,calls};
}
test('publishes without Google link, preserves visual fields, confirms success next to save',async()=>{
 const h=setup();await h.ctx.savePage();assert.equal(h.calls.length,1);
 const body=JSON.parse(h.calls[0][1].body);assert.equal(body.p_page.google,'');assert.equal(body.p_page.reviewV4.theme.accent,'#ff0000');
 assert.equal(h.ctx.record.status,'active');assert.equal(h.ctx.active,true);assert.match(h.$('saveStatus').textContent,/salva e publicada/);assert.equal(h.$('viewPublished').href,'/qr/W900001');assert.equal(h.$('save').disabled,false);
});
test('invalid nonempty Google link stays pending with visible error',async()=>{
 const h=setup();h.ctx.data.google='invalid';await h.ctx.savePage();assert.equal(h.calls.length,0);assert.equal(h.ctx.record.status,'pending');assert.match(h.$('saveStatus').textContent,/inválido/);
});
test('network failure retains edits and does not announce publication',async()=>{
 const h=setup({error:'Sem conexão'});await h.ctx.savePage();assert.match(h.$('saveStatus').textContent,/Sem conexão/);assert.equal(h.ctx.record.status,'pending');assert.equal(h.ctx.data.name,'Café de teste');assert.equal(h.$('save').disabled,false);
});
test('expired session is reported and no save occurs',async()=>{
 const h=setup({session:false});await h.ctx.savePage();assert.equal(h.calls.length,0);assert.match(h.$('saveStatus').textContent,/sessão expirou/);
});
test('requires explicit server acknowledgement',async()=>{
 const h=setup({response:{}});await h.ctx.savePage();assert.equal(h.ctx.record.status,'pending');assert.match(h.$('saveStatus').textContent,/não confirmou/);
});
test('double click only sends one save and button signals work in progress',async()=>{
 let finish;const h=setup({pending:new Promise(r=>finish=r)});const p=h.ctx.savePage();await Promise.resolve();assert.equal(h.$('save').disabled,true);assert.equal(h.$('save').textContent,'Salvando…');await h.ctx.savePage();assert.equal(h.calls.length,1);finish();await p;
});
