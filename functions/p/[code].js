// Cloudflare Pages Function: permanente /p/<code> (NFC e QR usam a mesma URL).
// A resolução consulta uma RPC pública e restrita no Supabase; nenhum segredo administrativo.
const DEFAULT_SUPABASE='https://rnqaktkvwfsetbjsqdrj.supabase.co';
const PUBLIC_KEY='sb_publishable_GdpqjGBR6kOeGuN4lUtDbg_phMb8IYO';
const headers={'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Pragma':'no-cache','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const page=(title,desc,status=200)=>new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | WillAI</title><style>body{font-family:system-ui;background:#f3f7fc;display:grid;min-height:100vh;place-items:center;margin:0;color:#0d3971}main{margin:20px;background:white;border:1px solid #deebf5;border-radius:18px;box-shadow:0 15px 65px #001a3b16;padding:42px;text-align:center;max-width:420px}b{font-size:24px}p{color:#61748b;line-height:1.65}</style></head><body><main><b>WillAI Studio</b><h1>${title}</h1><p>${desc}</p></main></body></html>`,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
export async function onRequestGet({request,params,env}){
 const code=params.code;
 if(typeof code!=='string'|| !/^[0-9a-f]{24}$/.test(code))return page('Código não localizado','Confira a plaquinha ou entre em contato com o estabelecimento.',404);
 try{
   const url=(env.SUPABASE_URL||DEFAULT_SUPABASE).replace(/\/$/,'')+'/rest/v1/rpc/willai_resolve_plaque';
   const r=await fetch(url,{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY||PUBLIC_KEY,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({p_code:code})});
   if(!r.ok)return page('Serviço indisponível','Não foi possível consultar a plaquinha. Tente novamente.',503);
   const result=await r.json();
   if(result?.status==='not_found')return page('Código não localizado','A plaquinha não foi encontrada.',404);
   if(result?.status==='suspended')return page('Plaquinha suspensa','Entre em contato com o estabelecimento.',200);
   if(result?.status!=='active')return page('Plaquinha aguardando ativação','Esta plaquinha ainda não foi vinculada a um estabelecimento.',200);
   let destination;
   if(result.mode==='page'){
     if(typeof result.slug!=='string'|| !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug))return page('Página indisponível','A página ainda está sendo configurada.',503);
     destination=new URL('/'+result.slug,new URL(request.url).origin).href;
   }else if(result.mode==='direct'){
     const target=new URL(result.url);
     if(!['https:','http:'].includes(target.protocol))return page('Destino inválido','O link precisa ser corrigido pelo administrador.',503);
     destination=target.href;
   }else return page('Configuração pendente','O destino ainda não foi configurado.',503);
   return new Response(null,{status:302,headers:{...headers,'Location':destination}});
 }catch{return page('Temporariamente indisponível','Verifique sua conexão e tente novamente.',503)}
}

