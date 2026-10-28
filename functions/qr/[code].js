// Cloudflare Pages: caminhos /qr/W002 e demais codigos.
export async function onRequestGet({request,env,params}) {
 const code=String(params.code||'').toUpperCase();
 if(!/^W[0-9]{3,8}$/.test(code)) return new Response('QR inválido',{status:404});
 const asset=await env.ASSETS.fetch(new Request(new URL('/qr/',request.url)));
 if(!asset.ok)return new Response('Tela QR indisponível',{status:503});
 const headers=new Headers(asset.headers);
 headers.set('Content-Type','text/html; charset=utf-8');
 headers.set('Cache-Control','no-cache');
 headers.set('Referrer-Policy','no-referrer');
 return new Response(asset.body,{status:200,headers});
}