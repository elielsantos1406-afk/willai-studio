(()=>{
'use strict';
// Favicon do painel: identidade WillAI, independente da empresa editada.
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/svg+xml';
favicon.href = '/assets/willai-favicon.svg?v=2';
document.head.appendChild(favicon);
const E=id=>document.getElementById(id),cfg=window.WILLAI_CONFIG,bridge=window.WillAIBridge;
if(!cfg||!bridge)return;
let session=null,userId=null,records=[],portalSession=false;
const storageKey='willai_cloud_domain';
function message(v,ok=true){E('cloudStatus').textContent=v;E('cloudStatus').style.color=ok?'#206c54':'#bb4545'}
function slugify(s){return String(s||'empresa').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'empresa'}
function sync(){E('cloudSlug').value=bridge.currentSlug();}
function urlFor(slug){const site=E('cloudDomain').value.trim().replace(/\/+$/,'');return site?site+'/'+slug:''}
async function call(path,options={}){
 const h={apikey:cfg.publishableKey,'Content-Type':'application/json',...(session?.access_token?{Authorization:'Bearer '+session.access_token}:{})};
 let response=await fetch(cfg.url+path,{...options,headers:{...h,...(options.headers||{})}});
 if(response.status===401&&session?.refresh_token){const r=await fetch(cfg.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});if(r.ok){session=await r.json();if(portalSession)sessionStorage.setItem('willai_portal_session',JSON.stringify(session));h.Authorization='Bearer '+session.access_token;response=await fetch(cfg.url+path,{...options,headers:{...h,...(options.headers||{})}})}}
 if(!response.ok){let detail='';try{const e=await response.json();detail=e.message||e.msg||e.error_description||e.error||JSON.stringify(e)}catch{}throw Error(detail||'Erro HTTP '+response.status)}
 if(response.status===204)return null;const raw=await response.text();return raw?JSON.parse(raw):null;
}
function imageMime(bytes){return bytes.startsWith('data:image/png')?'image/png':bytes.startsWith('data:image/jpeg')?'image/jpeg':'image/webp'}
const builtins={'builtin:plurita':'/assets/plurita-logo.png','builtin:anderson':'/assets/banner-anderson.png','builtin:projeto':'/assets/banner-projeto.png','builtin:parceria':'/assets/banner-parceria.png'};
async function uploadMedia(dataUrl,folder){const mime=imageMime(dataUrl);const content=dataUrl.split(',')[1];if(!content)throw Error('Imagem inválida');const binary=atob(content),arr=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);
 const name=crypto.randomUUID()+'.'+(mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'webp');const path=folder+'/'+name;
 const response=await fetch(cfg.url+'/storage/v1/object/'+cfg.bucket+'/'+path,{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':mime,'x-upsert':'false'},body:arr});
 if(!response.ok){let t=await response.text();throw Error('Falha ao salvar a imagem no Storage: '+t.slice(0,240))}
 return cfg.url+'/storage/v1/object/public/'+cfg.bucket+'/'+path;
}
async function makeRemote(value,folder){if(typeof value==='string'){
 if(builtins[value])return builtins[value];if(value.startsWith('data:image/'))return await uploadMedia(value,folder);return value;
}if(Array.isArray(value))return Promise.all(value.map(v=>makeRemote(v,folder)));
if(value&&typeof value==='object'){const o={};for(const [k,v] of Object.entries(value))o[k]=await makeRemote(v,folder);return o}return value;}
async function loadList(){const rows=await call('/rest/v1/willai_pages?owner_id=eq.'+encodeURIComponent(userId)+'&select=slug,name,published,updated_at&order=updated_at.desc&limit=500');records=rows||[];E('cloudRecords').innerHTML='<option value="">Selecione uma página</option>'+records.map(r=>'<option value="'+escapeHtml(r.slug)+'">'+escapeHtml(r.name)+' — '+(r.published?'publicada':'rascunho')+'</option>').join('');}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
E('cloudLogin').onclick=async()=>{try{const email=E('cloudEmail').value.trim(),password=E('cloudPassword').value;if(!email||!password)throw Error('Informe o e-mail e a senha do usuário do Supabase Auth.');const obj=await call('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});if(!obj?.access_token||!obj?.user?.id)throw Error('Login não autorizado');portalSession=false;session=obj;userId=obj.user.id;E('cloudPassword').value='';message('Conectado como '+email);await loadList()}catch(e){message('Não foi possível entrar: '+e.message,false)}};
E('cloudLogout').onclick=()=>{session=null;userId=null;records=[];E('cloudRecords').innerHTML='<option value="">Não conectado</option>';message('Sessão encerrada.');};
async function publish(published){if(!session||!userId){message('Faça login antes de publicar.',false);return}try{
 let slug=slugify(E('cloudSlug').value),currentSlug=bridge.currentSlug();if(slug!==E('cloudSlug').value.trim())E('cloudSlug').value=slug;
 let c=bridge.currentConfig();if(!c.name.trim())throw Error('Informe o nome da empresa.');
 // Preserve the slug of a published company to keep existing QR codes valid.
 if(slug!==currentSlug&&!confirm('Alterar o endereço desta empresa pode invalidar QR Codes já impressos. Continuar com /'+slug+'?'))return;
 message('Enviando dados e imagens...');
 const content=await makeRemote(c,userId+'/'+slug);const body={slug,owner_id:userId,name:c.name,mode:c.mode,config:content,published};
 const rows=await call('/rest/v1/willai_pages?on_conflict=slug',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(body)});
 bridge.setSlug(slug);await loadList();E('cloudRecords').value=slug;
 const link=urlFor(slug);message((published?'Página publicada':'Rascunho salvo')+(link?' · '+link:' · Configure o domínio Cloudflare para copiar o link.'));
 }catch(e){message('Não foi possível salvar: '+e.message,false)}}
E('cloudPublish').onclick=()=>publish(true);E('cloudDraft').onclick=()=>publish(false);
E('cloudLoad').onclick=async()=>{try{if(!session)throw Error('Entre com sua conta primeiro.');const slug=E('cloudRecords').value;if(!slug)throw Error('Escolha uma empresa da lista.');const rows=await call('/rest/v1/willai_pages?slug=eq.'+encodeURIComponent(slug)+'&owner_id=eq.'+encodeURIComponent(userId)+'&select=slug,name,mode,config&limit=1');if(!rows?.length)throw Error('Página não encontrada ou sem acesso.');bridge.importRecord(rows[0]);sync();message('Página carregada. Edite os campos e clique Publicar para atualizar.')}catch(e){message(e.message,false)}};
E('cloudCopyLink').onclick=async()=>{const link=urlFor(slugify(E('cloudSlug').value));if(!link){message('Primeiro informe o domínio verdadeiro do Cloudflare Pages.',false);return}try{await navigator.clipboard.writeText(link);message('Link copiado: '+link)}catch{prompt('Copie o link:',link)}};
E('cloudOpenLink').onclick=()=>{const link=urlFor(slugify(E('cloudSlug').value));if(link)window.open(link,'_blank','noopener,noreferrer');else message('Informe o domínio verdadeiro do Cloudflare Pages.',false)};
E('cloudSlug').onchange=()=>{E('cloudSlug').value=slugify(E('cloudSlug').value)};
try{E('cloudDomain').value=localStorage.getItem(storageKey)||location.origin}catch{}
E('cloudDomain').onchange=()=>{const v=E('cloudDomain').value.trim();if(v&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(v)){message('Digite a URL completa do seu domínio, começando com https://',false);return}try{localStorage.setItem(storageKey,v)}catch{}};
E('clientSelect').addEventListener('change',()=>setTimeout(sync,0));E('newClient').addEventListener('click',()=>setTimeout(sync,0));E('cloneClient').addEventListener('click',()=>setTimeout(sync,0));E('deleteClient').addEventListener('click',()=>setTimeout(sync,0));
sync();
(async()=>{
 try{
  const stored=JSON.parse(sessionStorage.getItem('willai_portal_session')||'null');
  if(!stored?.access_token)return;
  portalSession=true;session=stored;
  const user=await call('/auth/v1/user');
  if(!user?.id)throw Error('Sessão inválida');
  userId=user.id;message('Conectado pela sessão do Portal WillAI.');await loadList();
 }catch(e){session=null;userId=null;message('Entre novamente para carregar suas páginas: '+e.message,false)}
})();
})();
