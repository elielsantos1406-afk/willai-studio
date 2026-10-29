'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../studio/qr/admin-real.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../studio/qr/index.html'),'utf8');
const now=()=>Math.floor(Date.now()/1000);
const response=(status,obj)=>({ok:status>=200&&status<300,status,json:async()=>obj});
const idle=()=>new Promise(resolve=>setTimeout(resolve,25));
function harness(options={}){
 const nodes=new Map(),calls=[],items=options.session ? [['willai_portal_session',JSON.stringify(options.session)]] : [];
 const storage=new Map(items);
 const element=id=>{
  if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',hidden:true,disabled:false,
   options:[],dispatchEvent(){},add(){},click(){},addEventListener(){},querySelectorAll(){return[];}});
  return nodes.get(id);
 };
 const tokens={refresh:0,inventory:0,generate:0,generateHeaders:[]};
 const fetch=async(url,opts={})=>{
  calls.push({url,auth:opts.headers?.Authorization,body:opts.body});
  if(url.includes('grant_type=refresh_token')){
   tokens.refresh++;
   return options.failRefresh?response(401,{error:'invalid_grant'}):
    response(200,{access_token:'new-token',refresh_token:'new-refresh',
       expires_at:now()+3600,user:{id:'test-account'}});
  }
  if(url.endsWith('/willai_qr_admin_inventory')){tokens.inventory++;return response(200,[])};
  if(url.endsWith('/willai_qr_admin_claim_requests'))return response(200,[]);
  if(url.endsWith('/willai_qr_admin_generate_batch')){
   tokens.generate++;tokens.generateHeaders.push(opts.headers.Authorization);
   if(options.networkFailure)throw Error('Falha na conexão');
   if(options.jwt401&&tokens.generate===1)return response(401,{code:'PGRST301',message:'JWT expired'});
   return response(200,{batch_id:'batch-test',items:Array.from({length:50},(_,i)=>({
    code:'W'+String(i+1).padStart(3,'0'),link:'https://willai.com.br/qr/W001',
    secret:'123456789012345678901234567890123456789012345678'
   }))});
  }
  throw Error('Unexpected fetch '+url);
 };
 const mockWindow={WILLAI_CONFIG:{url:'https://example.supabase.co',publishableKey:'sb_publishable_example'}};
 vm.runInNewContext(source,{document:{getElementById:element},window:mockWindow,sessionStorage:{
  getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)
 },fetch,confirm:()=>true,setTimeout,clearTimeout,Date,Event:class Event{constructor(type){this.type=type}},
 atob,Blob,URL,console});
 return {element,tokens,calls,storage};
}
test('Javascript of real stock system compiles',()=>assert.doesNotThrow(()=>new vm.Script(source)));
test('expired JWT is renewed before generating a single batch',async()=>{
 const h=harness({session:{access_token:'old-token',refresh_token:'old-refresh',expires_at:now()-10}});
 await idle();
 await h.element('realGenerate').onclick();
 assert.equal(h.tokens.refresh,1);
 assert.equal(h.tokens.generate,1);
 assert.equal(h.tokens.generateHeaders[0],'Bearer new-token');
 assert.equal(JSON.parse(h.storage.get('willai_portal_session')).refresh_token,'new-refresh');
 assert.equal(h.element('realExportSecrets').disabled,false);
});
test('401 JWT expired is retried only once after a successful refresh',async()=>{
 const h=harness({session:{access_token:'old-token',refresh_token:'old-refresh',expires_at:now()+1200},jwt401:true});
 await idle();await h.element('realGenerate').onclick();
 assert.equal(h.tokens.generate,2);
 assert.equal(h.tokens.refresh,1);
 assert.deepEqual(h.tokens.generateHeaders,['Bearer old-token','Bearer new-token']);
});
test('network error never retries the mutating generation',async()=>{
 const h=harness({session:{access_token:'current-token',refresh_token:'secret-refresh',expires_at:now()+3600},networkFailure:true});
 await idle();await h.element('realGenerate').onclick();
 assert.equal(h.tokens.generate,1);
 assert.equal(h.tokens.refresh,0);
 assert.match(h.element('realStatus').textContent,/Geração não confirmada/);
});
test('without refresh token it requests login rather than create a batch',async()=>{
 const h=harness({session:{access_token:'expired-token',expires_at:now()-100}});
 await idle();await h.element('realGenerate').onclick();
 assert.equal(h.tokens.generate,0);
 assert.equal(h.element('realAuthAgain').hidden,false);
 assert.match(h.element('realStatus').textContent,/Sua sessão expirou/);
});
test('invalid refresh token reports login and never creates a batch',async()=>{
 const h=harness({session:{access_token:'expired-token',refresh_token:'revoked',expires_at:now()-100},failRefresh:true});
 await idle();await h.element('realGenerate').onclick();
 assert.equal(h.tokens.generate,0);
 assert.equal(h.element('realAuthAgain').hidden,false);
 assert.equal(h.storage.get('willai_portal_session'),undefined);
});
test('QR Studio provides visible re-login link',()=>{
 assert.match(html,/id="realAuthAgain"/);
 assert.match(html,/href="\/studio\/portal\/#\/login"/);
});