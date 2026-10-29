const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('participant editing preserves legacy additional fields and notes',()=>{
 const source=read('studio/gestao/index.html');
 const fn=source.slice(source.indexOf('function splitNotes('),source.indexOf('function resetParticipantForm('));
 const ctx={};vm.createContext(ctx);vm.runInContext(fn,ctx);
 for(const separator of ['\n','\\n']){
  const parsed=ctx.splitNotes('Observação'+separator+'DADOS ADICIONAIS: '+JSON.stringify({email:'qa@example.com',category:'Café'}));
  assert.equal(parsed.notes,'Observação');assert.equal(parsed.detail.email,'qa@example.com');assert.equal(parsed.detail.category,'Café');
 }
 assert.equal(ctx.splitNotes('Texto livre').notes,'Texto livre');
 assert.equal(ctx.splitNotes('DADOS ADICIONAIS: inválido').notes,'DADOS ADICIONAIS: inválido');
});
test('stock navigation delegates to real inventory instead of resetting counters',()=>{
 const source=read('studio/qr/index.html');
 const start=source.indexOf('function showStock(');const end=source.indexOf('\n',start);
 const calls=[];const node={classList:{add(){},remove(){}},style:{},scrollIntoView(){}};
 const ctx={window:{scrollTo(){},WILLAI_REAL_STOCK:{render:()=>calls.push('real')}},$:()=>node,document:{querySelector:()=>node,querySelectorAll:()=>[]},stockRender:()=>calls.push('mock')};
 vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);ctx.showStock();assert.deepEqual(calls,['real']);
});
