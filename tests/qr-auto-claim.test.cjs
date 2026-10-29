const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync(__dirname+'/../qr/qr-app.js','utf8');
function harness(options={}){
 const calls=[],screens=[];const ctx={jwt:'test-token',active:!!options.active,owner:false,data:{name:'Inicial'},code:'WTEST',activationToken:options.secret||null,location:{pathname:'/qr/WTEST',search:''},history:{replaceState(){}},fill(){},show:x=>screens.push(x),message(){},rpc:async(name,args)=>{calls.push(name);if(options.fail)throw Error('indisponível');return name==='willai_qr_owned'?{page:{name:'Dados preservados'}}:{ok:true,status:'active'}}};
 vm.createContext(ctx);vm.runInContext(src.slice(src.indexOf('async function openEditorAfterAuth'),src.indexOf('function link(k)')),ctx);return {ctx,calls,screens};
}
test('public QR activates and opens editor without approval screen',async()=>{const h=harness();await h.ctx.openEditorAfterAuth();assert.deepEqual(h.calls,['willai_qr_request_claim','willai_qr_owned']);assert.deepEqual(h.screens,['editor']);assert.equal(h.ctx.owner,true);assert.equal(h.ctx.data.name,'Dados preservados')});
test('original secret QR retains secret validation flow',async()=>{const h=harness({secret:'abc'});await h.ctx.openEditorAfterAuth();assert.equal(h.calls[0],'willai_qr_claim');assert.deepEqual(h.screens,['editor'])});
test('existing active plaque only checks ownership',async()=>{const h=harness({active:true});await h.ctx.openEditorAfterAuth();assert.deepEqual(h.calls,['willai_qr_owned'])});
test('rejected claim cannot open editor',async()=>{const h=harness({fail:true});await assert.rejects(h.ctx.openEditorAfterAuth(),/indisponível/);assert.equal(h.ctx.owner,false);assert.deepEqual(h.screens,[])});
