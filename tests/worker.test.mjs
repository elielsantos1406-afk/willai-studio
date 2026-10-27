import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../functions/p/[code].js',import.meta.url),'utf8');
const {onRequestGet}=await import('data:text/javascript,'+encodeURIComponent(source));
const original=globalThis.fetch;
const contexts=(code)=>({params:{code},env:{},request:new Request('https://willai-studio.pages.dev/p/'+code)});
const code='0123456789abcdef01234567';
try {
let calls=0;
globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({status:'inactive'}),{status:200,headers:{'Content-Type':'application/json'}})};
let response=await onRequestGet(contexts('bad'));assert.equal(response.status,404);assert.equal(calls,0);
response=await onRequestGet(contexts(code));assert.equal(response.status,200);assert.match(await response.text(),/aguardando ativação/);
globalThis.fetch=async()=>new Response(JSON.stringify({status:'active',mode:'direct',url:'https://google.com/review'}),{status:200});
response=await onRequestGet(contexts(code));assert.equal(response.status,302);assert.equal(response.headers.get('Location'),'https://google.com/review');assert.match(response.headers.get('Cache-Control'),/no-store/);
globalThis.fetch=async()=>new Response(JSON.stringify({status:'active',mode:'page',slug:'plurita'}),{status:200});
response=await onRequestGet(contexts(code));assert.equal(response.headers.get('Location'),'https://willai-studio.pages.dev/plurita');
globalThis.fetch=async()=>new Response(JSON.stringify({status:'suspended'}),{status:200});
response=await onRequestGet(contexts(code));assert.match(await response.text(),/suspensa/);
globalThis.fetch=async()=>new Response(JSON.stringify({status:'active',mode:'direct',url:'javascript:alert(1)'}),{status:200});
response=await onRequestGet(contexts(code));assert.equal(response.status,503);
console.log('6 testes da rota /p/:code passaram');
}finally{globalThis.fetch=original}

