// WillAI QR: rota publica permanente; arquivos estaticos NUNCA viram QR dinamico.
// Os assets tambem foram excluidos de _routes.json para evitar interceptacao.
export async function onRequestGet({request,env,params}) {
 const raw=String(params.code||'');
 if(raw==='qr-app.js'||raw==='index.html'){
   return env.ASSETS.fetch(request);
 }
 const code=raw.toUpperCase();
 if(!/^W[0-9]{3,8}$/.test(code))return new Response('Código de plaquinha inválido',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 const asset=await env.ASSETS.fetch(new Request(new URL('/qr/',request.url),{method:'GET'}));
 if(!asset.ok)return new Response('Tela do QR Studio indisponível',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 const headers=new Headers(asset.headers);
 headers.set('Content-Type','text/html; charset=utf-8');
 headers.set('Cache-Control','no-store');
 headers.set('Referrer-Policy','no-referrer');
 headers.set('X-Robots-Tag','noindex');
 return new Response(asset.body,{status:200,headers});
}
