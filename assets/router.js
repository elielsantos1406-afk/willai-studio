(()=>{'use strict';
const cfg=window.WILLAI_CONFIG||{};
const parts=location.pathname.split('/').filter(Boolean).map(p=>{try{return decodeURIComponent(p)}catch{return ''}});
const first=parts[0]||'';
const publicRoutes=new Set(['','index.html','projeto','servicos','portfolio','sobre','contato','login','plaquinhas','p','pagina']);
const knownCities=new Set(['curitiba','pinhais']);
function loadCompany(){
 const sc=document.createElement('script');
 sc.src='/assets/legacy-company-boot.js';
 sc.onerror=()=>showError('Não foi possível carregar a página da empresa.');
 document.body.append(sc);
}
function showError(message){
 document.getElementById('app').innerHTML='<div class="loading" role="alert"><strong>Não foi possível abrir o site.</strong><small>'+message+'</small><p><a href="/">Voltar para WillAI</a></p></div>';
}
// Rota QR dedicada mesmo quando a hospedagem servir o SPA principal como fallback.
async function loadQrRoute(){
 if(parts.length!==2||!/^W[0-9]{3,8}$/i.test(parts[1])){
  showError('Codigo de plaquinha invalido. Leia o QR Code original da WillAI.');
  return;
 }
 const response=await fetch('/qr/index.html',{cache:'no-cache'});
 if(!response.ok)throw Error('Nao foi possivel carregar a tela de ativacao QR');
 const doc=new DOMParser().parseFromString(await response.text(),'text/html');
 const style=doc.querySelector('style');
 const qrScript=doc.querySelector('script[src="/qr/qr-app.js"]');
 if(!style||!qrScript)throw Error('Arquivos QR Studio incompletos');
 document.head.append(style.cloneNode(true));
 document.title=doc.title;
 // Scripts inseridos por innerHTML sao inertes; carregamos apenas o modulo QR necessario.
 document.body.innerHTML=doc.body.innerHTML;
 const loader=document.createElement('script');
 loader.src='/qr/qr-app.js';
 loader.onerror=()=>showError('Nao foi possivel iniciar o QR Studio. Atualize a pagina.');
 document.body.append(loader);
}
async function isPortalRoute(){
 if(publicRoutes.has(first)||knownCities.has(first))return true;
 if(parts.length!==1||!cfg.url||!cfg.publishableKey)return false;
 try{
  const response=await fetch(cfg.url+'/rest/v1/willai_portal_content?slug=eq.main&published=eq.true&select=config',{headers:{apikey:cfg.publishableKey,Accept:'application/json'}});
  if(!response.ok)return false;
  const rows=await response.json();
  return Boolean(rows?.[0]?.config?.cities?.[first]);
 }catch(e){console.warn('Verificação de cidade indisponível',e);return false}
}
async function loadPortal(){
 const response=await fetch('/portal/index.html',{cache:'no-cache'});
 if(!response.ok)throw Error('HTTP '+response.status+' ao carregar o portal');
 const html=await response.text();
 const doc=new DOMParser().parseFromString(html,'text/html');
 const script=[...doc.scripts].find(s=>!s.src&&s.textContent.includes('const seed='));
 const style=doc.querySelector('style');
 if(!script||!style)throw Error('Arquivos do portal incompletos');
 const css=document.createElement('style');css.textContent=style.textContent;document.head.append(css);
 const desc=doc.querySelector('meta[name="description"]');
 if(desc){let d=document.querySelector('meta[name="description"]');if(!d){d=document.createElement('meta');d.name='description';document.head.append(d)}d.content=desc.content}
 document.title=doc.title;
 document.body.innerHTML=doc.body.innerHTML.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 const code=document.createElement('script');code.textContent=script.textContent;
 document.body.append(code);
}
(async()=>{
 try{
  if(first==='qr'){await loadQrRoute();return;}
  if(await isPortalRoute())await loadPortal();
  else loadCompany();
 }catch(error){
  console.error('WillAI: erro na entrada do portal',error);
  showError('Atualize a página ou tente novamente. Se o problema continuar, entre em contato com a WillAI.');
 }
})();
})();