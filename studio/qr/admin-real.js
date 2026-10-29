(()=>{'use strict';const $=id=>document.getElementById(id),cfg=window.WILLAI_CONFIG||{};let session=null,lastSecrets=[],inventory=[],activeBatch='';const sessionKey='willai_portal_session',safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));const status=s=>{$('realStatus').textContent=s;const a=$('realAuthAgain');if(a)a.hidden=!s.includes('Sua sessão expirou')};function auth(){try{const s=JSON.parse(sessionStorage.getItem(sessionKey)||'null');return s?.access_token?s:null}catch{return null}}
const LOGIN_EXPIRED='Sua sessão expirou. Clique em Entrar novamente, faça login no Portal WillAI e volte ao QR Studio.';
let refreshing=null;
function tokenExpiry(s){
 const listed=Number(s?.expires_at||0);let encoded=0;
 try{const payload=String(s?.access_token||'').split('.')[1];
 if(payload)encoded=Number(JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')))?.exp||0)}catch{}
 return listed&&encoded?Math.min(listed,encoded):listed||encoded;
}
function closeToExpiry(s){const exp=tokenExpiry(s);return exp>0&&exp<=Math.floor(Date.now()/1000)+90}
async function renewSession(){
 if(refreshing)return refreshing;
 refreshing=(async()=>{
  const before=auth();if(!before?.refresh_token)throw Error(LOGIN_EXPIRED);
  const res=await fetch(cfg.url+'/auth/v1/token?grant_type=refresh_token',{
   method:'POST',cache:'no-store',
   headers:{apikey:cfg.publishableKey,Accept:'application/json','Content-Type':'application/json'},
   body:JSON.stringify({refresh_token:before.refresh_token})
  });
  const b=await res.json().catch(()=>null);
  if(!res.ok||!b?.access_token||!b?.refresh_token){
   if(res.status===400||res.status===401){
    if(auth()?.access_token===before.access_token)sessionStorage.removeItem(sessionKey);
    throw Error(LOGIN_EXPIRED);
   }
   throw Error('Não foi possível renovar a sessão. Verifique a conexão e consulte o estoque novamente.');
  }
  const latest={...before,...b,expires_at:Number(b.expires_at)||Math.floor(Date.now()/1000)+Number(b.expires_in||3600)};
  sessionStorage.setItem(sessionKey,JSON.stringify(latest));session=latest;return latest;
 })();
 try{return await refreshing}finally{refreshing=null}
}
async function sessionForRequest(){
 if(!cfg.url||!cfg.publishableKey)throw Error('Supabase não configurado.');
 const current=auth();if(!current)throw Error(LOGIN_EXPIRED);
 return closeToExpiry(current)?await renewSession():current;
}
function expiredResponse(response,body){
 return response.status===401&&/jwt expired|token.*expired|expired.*token|pgrst301/i.test(
  [body?.message,body?.msg,body?.error,body?.code].filter(Boolean).join(' '));
}
async function rpc(name,args){
 const original=await sessionForRequest(),requestBody=JSON.stringify(args||{});
 const call=s=>fetch(cfg.url+'/rest/v1/rpc/'+name,{
  method:'POST',cache:'no-store',
  headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+s.access_token,
   Accept:'application/json','Content-Type':'application/json'},body:requestBody
 });
 let res=await call(original),b=await res.json().catch(()=>null);
 // Retentativa SOMENTE para JWT expirado, rejeitado antes da execução pelo gateway.
 // Não repetir RPC após timeout/rede: poderia gerar um lote duplicado.
 if(expiredResponse(res,b)){
  const latest=auth();
  const credentials=latest?.access_token&&latest.access_token!==original.access_token&&!closeToExpiry(latest)?latest:await renewSession();
  res=await call(credentials);b=await res.json().catch(()=>null);
 }
 if(!res.ok){
  if(expiredResponse(res,b)||res.status===401)throw Error(LOGIN_EXPIRED);
  throw Error(b?.message||b?.error_description||b?.error||
   'Erro HTTP '+res.status+'; consulte o estoque antes de repetir esta operação.');
 }
 return b;
}
function downloadText(txt,name,type='text/csv;charset=utf-8'){const u=URL.createObjectURL(new Blob(['\ufeff'+txt],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000)}

function selectedCodes(){const id=$('realBatch').value;return inventory.filter(x=>id==='none'? !x.batch_id:String(x.batch_id)===id).map(x=>x.code)}
function renderQuickCodes(){
 const root=$('artCodeGrid');if(!root)return;
 const query=String($('artFindCode')?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const chosen=$('artCode')?.value;
 const rows=inventory.filter(x=>String(x.code).includes(query));
 root.innerHTML=rows.length?rows.map(x=>{
  const isSelected=x.code===chosen;
  const ready=window.WILLAI_ARTES?.readyForPrint(x.code)?.ready;
  return '<button type="button" data-quick-art="'+safe(x.code)+'" class="'+(isSelected?'selected':'')+'" aria-pressed="'+isSelected+'" aria-label="Preparar arte de '+safe(x.code)+'"><b>'+safe(x.code)+'</b><small>'+(ready?'QR pronto':'Preparar arte')+'</small></button>';
 }).join(''):'<span class="hint">Nenhuma plaquinha encontrada para esta busca.</span>';
}
$('artFindCode').addEventListener('input',renderQuickCodes);
$('artCodeGrid').addEventListener('click',e=>{
 const btn=e.target.closest('[data-quick-art]');if(!btn)return;
 const selected=btn.dataset.quickArt;
 if(!inventory.some(x=>x.code===selected))return status('Código não encontrado no estoque real.');
 $('artCode').value=selected;$('artCode').dispatchEvent(new Event('change'));
 renderQuickCodes();
 $('artPreview')?.scrollIntoView({behavior:'smooth',block:'center'});
});
$('artCode').addEventListener('change',renderQuickCodes);
function render(){
 const old=$('realCode').value;
 $('realCode').innerHTML='<option value="">Selecione uma plaquinha</option>'+inventory.map(r=>'<option value="'+safe(r.code)+'">'+safe(r.code)+'</option>').join('');
 if(inventory.some(r=>r.code===old))$('realCode').value=old;
 const batches=[...new Set(inventory.map(r=>r.batch_id||'none'))];
 const prev=$('realBatch').value;
 $('realBatch').innerHTML='<option value="">Selecione um lote real</option>'+batches.map(id=>'<option value="'+safe(id)+'">'+(id==='none'?'Códigos sem lote':safe(id.slice(0,8)))+' — '+inventory.filter(r=>(r.batch_id||'none')===id).length+' código(s)</option>').join('');
 $('realBatch').value=batches.includes(prev)?prev:(batches.includes(activeBatch)?activeBatch:(batches[0]||''));
 $('realRows').innerHTML=inventory.length?inventory.map(r=>'<tr><td><b>'+safe(r.code)+'</b></td><td>'+safe(r.status)+'</td><td style="max-width:280px;overflow-wrap:anywhere">'+safe(r.redirect_url||(r.status==='active'?'Página vinculada ao proprietário':r.status==='held'?'Aguardando liberação de entrega':'Aguardando ativação'))+'</td><td>'+(r.status==='held'?'<button type="button" class="btn primary" data-release="'+safe(r.code)+'">Liberar após entrega</button> ':'')+'<button type="button" class="btn" data-print="'+safe(r.code)+'">Preparar arte</button> <a class="btn" href="/qr/'+safe(r.code)+'" target="_blank" rel="noopener noreferrer">Abrir QR</a></td></tr>').join(''):'<tr><td colspan="4">Nenhuma plaquinha cadastrada no Supabase. Clique em Gerar 50 códigos reais.</td></tr>';
 $('stockGenerated').textContent=inventory.length;
 $('stockAvailable').textContent=inventory.filter(x=>x.status==='available').length;
 $('stockBatches').textContent=batches.filter(x=>x!=='none').length;
 $('stockInventory').innerHTML='<div style="padding:18px;background:#f4f7fc;border-radius:16px;color:#18406b">O estoque está conectado ao Supabase. Use a tabela <b>Estoque real</b> abaixo para visualizar, vincular e imprimir os códigos cadastrados. Não utilize os QR Codes de demonstração.</div>';
 const sel=$('artCode'),current=sel.value;
 sel.innerHTML=inventory.length?inventory.map(r=>'<option value="'+safe(r.code)+'">'+safe(r.code)+'</option>').join(''):'<option value="">Nenhum código registrado</option>';
 if(inventory.some(r=>r.code===current))sel.value=current;
 window.WILLAI_ARTES?.useRealInventory(inventory);sel.dispatchEvent(new Event('change'));renderQuickCodes();
}
async function refreshClaims(){
 const tbody=$('realClaimRows');
 if(!tbody)return;
 try{
  const r=await rpc('willai_qr_admin_claim_requests',{});
  const rows=Array.isArray(r)?r:[];
  tbody.innerHTML=rows.length?rows.map(x=>{
   const date=x.requested_at?new Date(x.requested_at).toLocaleString('pt-BR'):'';
   return '<tr><td><strong>'+safe(x.code)+'</strong></td><td>'+safe(x.email||'Email indisponivel')+'</td><td>'+safe(date)+'</td><td><button class="btn primary" data-approve-code="'+safe(x.code)+'" data-approve-user="'+safe(x.user_id)+'">Confirmar entrega e aprovar</button></td></tr>';
  }).join(''):'<tr><td colspan="4">Nenhuma solicitação pendente.</td></tr>';
 }catch(e){tbody.innerHTML='<tr><td colspan="4">Não foi possível consultar as solicitações. Verifique o acesso administrativo.</td></tr>';status('Falha ao consultar pedidos: '+e.message)}
}
$('realRefreshClaims').onclick=refreshClaims;
$('realClaimRows').onclick=async e=>{
 const button=e.target.closest('[data-approve-code]');
 if(!button)return;
 const code=button.dataset.approveCode,user_id=button.dataset.approveUser;
 if(!confirm('Você CONFIRMOU a entrega de '+code+' ao titular da conta? Nunca aprove apenas porque alguém conhece o número do QR Code.'))return;
 button.disabled=true;
 try{
  await rpc('willai_qr_admin_approve_claim',{p_code:code,p_user_id:user_id});
  status('Ativação de '+code+' aprovada para o proprietário confirmado.');
  await reload();
 }catch(err){status('Aprovação não concluída: '+err.message);button.disabled=false}
};
async function reload(){status('Consultando banco de dados…');try{const r=await rpc('willai_qr_admin_inventory',{});inventory=Array.isArray(r)?r:[];render();await refreshClaims();status('Estoque real carregado: '+inventory.length+' código(s).')}catch(e){status('Não foi possível consultar o estoque real: '+e.message)}}
$('realRefresh').onclick=reload;
$('realGenerate').onclick=async()=>{if(!confirm('Gerar 50 QR Codes REAIS no Supabase? Cada um terá segredo único, que deve ser baixado imediatamente.'))return;const btn=$('realGenerate');btn.disabled=true;status('Criando códigos e segredos individuais no banco…');try{const b=await rpc('willai_qr_admin_generate_batch',{p_count:50});lastSecrets=Array.isArray(b?.items)?b.items:[];activeBatch=b.batch_id||'';window.WILLAI_ARTES?.setActivationSecrets(lastSecrets);if(lastSecrets.length!==50)throw Error('Resposta incompleta. Consulte o banco antes de tentar novamente.');$('realExportSecrets').disabled=false;status('Lote criado e BLOQUEADO. Baixe agora o CSV com os segredos, imprima os QRs e libere cada unidade apenas depois da entrega.');await reload();$('realStatus').textContent='50 códigos bloqueados no banco. Baixe o CSV, imprima usando esta sessão e libere cada unidade após entregar.'}catch(e){status('Geração não confirmada: '+e.message)}finally{btn.disabled=false}};
$('realExportSecrets').onclick=()=>{if(!lastSecrets.length)return status('Nenhum segredo novo nesta sessão. Segredos antigos não ficam disponíveis para download.');const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const csv='codigo;endereco_publico;url_qr_ativacao;segredo_de_ativacao\n'+lastSecrets.map(r=>[r.code,r.link,r.link+'#ativar='+r.secret,r.secret].map(q).join(';')).join('\n');downloadText(csv,'WillAI-QR-segredos-'+Date.now()+'.csv');status('CSV exportado. Guarde em local seguro. Imprima o QR COM a credencial embutida; nao entregue o CSV ao comerciante.')};
$('realCode').onchange=e=>{let r=inventory.find(x=>x.code===e.target.value);$('realRedirect').value=r?.redirect_url||''};
$('realSaveRedirect').onclick=async()=>{const c=$('realCode').value;if(!c)return status('Selecione primeiro uma plaquinha no estoque real.');const u=$('realRedirect').value.trim();if(u&&(!/^https?:\/\//i.test(u)||u.length>2048))return status('Cole um endereço HTTP(S) completo.');try{await rpc('willai_qr_admin_redirect',{p_code:c,p_url:u});await reload();status('Destino de '+c+' atualizado no banco. O QR impresso continua igual.')}catch(e){status('Falha ao vincular o link: '+e.message)}};
$('realRows').onclick=async e=>{const release=e.target.closest('[data-release]');if(release){
 const c=release.dataset.release;
 if(!confirm('Confirmar a entrega da plaquinha '+c+'? Somente depois desta acao a primeira conta com o QR original podera ativa-la.'))return;
 release.disabled=true;
 try{await rpc('willai_qr_admin_release',{p_code:c});await reload();status('Plaquinha '+c+' liberada apos confirmacao de entrega.');}
 catch(err){status('Nao foi possivel liberar '+c+': '+err.message);release.disabled=false}
 return;
}
const b=e.target.closest('[data-print]');if(!b)return;const c=b.dataset.print,sel=$('artCode');if(![...sel.options].some(x=>x.value===c))sel.add(new Option(c,c));sel.value=c;sel.dispatchEvent(new Event('change'));$('artStudio').scrollIntoView({behavior:'smooth'});status('Arte de '+c+' selecionada. Escolha WillAI ou Google e exporte o SVG/PDF.')};

$('generate50').onclick=()=>{if(!auth())return status('Entre na central WillAI para gerar códigos reais.');$('realGenerate').click();};
$('stockReset').disabled=true;$('stockZip').disabled=true;$('stockA4').disabled=true;
$('realZip').onclick=async()=>{
 const codes=selectedCodes();if(!codes.length)return status('Selecione um lote do estoque real.');
 if(!window.JSZip||!window.WILLAI_ARTES)return status('Gerador QR ou ZIP indisponível. Verifique a internet.');
 const b=$('realZip');b.disabled=true;status('Preparando '+codes.length+' QR Codes em PNG…');
 try{const zip=new JSZip();for(const code of codes){const encoded=window.WILLAI_ARTES.qrPng(code).split(',')[1];zip.file(code+'.png',encoded,{base64:true})}
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});window.WILLAI_ARTES.download(blob,'WillAI-QR-estoque-'+codes[0]+'-'+codes[codes.length-1]+'.zip','application/zip');
 status('ZIP baixado com '+codes.length+' PNGs registrados no banco.')}
 catch(e){status('Falha no ZIP: '+e.message)}finally{b.disabled=false}
};
$('realA4').onclick=()=>{
 const codes=selectedCodes();if(!codes.length)return status('Selecione um lote real para imprimir.');
 if(!window.WILLAI_ARTES)return status('Gerador de QR indisponível.');
 const tab=window.open('','_blank');if(!tab)return status('O navegador bloqueou a janela de impressão. Libere pop-ups para a WillAI.');
 try{
 const items=codes.map(code=>'<div class="item"><img alt="'+code+'" src="'+window.WILLAI_ARTES.qrPng(code,260)+'"><b>'+code+'</b><small>willai.com.br/qr/'+code+'</small></div>').join('');
 tab.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>WillAI QR A4</title><style>@page{size:A4;margin:10mm}body{font:12px Arial;margin:0;color:#163454}h1{font-size:16px;margin:0 0 9mm}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5mm}.item{break-inside:avoid;text-align:center;padding:2mm;border:1px solid #ddd}.item img{width:100%;aspect-ratio:1}.item b,.item small{display:block}.item small{font-size:7px}@media print{.item{border:1px solid #ddd}}</style></head><body><h1>WillAI — QR Codes do lote</h1><div class="grid">'+items+'</div></body></html>');tab.document.close();
 setTimeout(()=>{try{tab.focus();tab.print()}catch(_){}},700);status('Folha A4 aberta: escolha Imprimir ou Salvar em PDF no navegador.');
 }catch(e){tab.close();status('Falha ao imprimir: '+e.message)}
};
// QR para estoque nao registrado ou sem segredo NAO deve ser impresso.
window.WILLAI_ARTES?.useRealInventory([]);
$('realImportSecrets').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>300000||!/\.csv$/i.test(file.name))return status('Escolha o CSV de segredos exportado pelo WillAI QR Studio.');
 try{
  const rows=(await file.text()).replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1).map(l=>{
   const p=l.split(';').map(v=>v.trim().replace(/^"|"$/g,'').replace(/""/g,'"'));
   return {code:p[0],secret:p[p.length-1]};
  }).filter(r=>/^W[0-9]{3,8}$/.test(r.code)&&/^[a-f0-9]{48}$/.test(r.secret));
  if(!rows.length)throw Error('CSV nao contem segredos validos.');
  window.WILLAI_ARTES?.setActivationSecrets(rows);
  renderQuickCodes();
  status(rows.length+' segredos carregados apenas na memoria desta aba. Agora e possivel reimprimir os QRs desse lote.');
 }catch(err){status('Falha ao importar CSV: '+err.message)}
 e.target.value='';
};
window.WILLAI_REAL_STOCK={render};
function openSelectedOwner(){
 const code=$('artCode').value;
 if(!inventory.some(r=>r.code===code)){status('Selecione uma plaquinha do estoque real.');$('navStock').click();return;}
 location.assign('/qr/'+encodeURIComponent(code)+'?editar=1');
}
$('publishBtn').onclick=openSelectedOwner;
$('navActivate').onclick=openSelectedOwner;
$('loginHere').onclick=openSelectedOwner;
$('qrHere').onclick=()=>{$('navStock').click();$('artStudio').scrollIntoView({behavior:'smooth'});};
$('navQR').onclick=()=>{$('navStock').click();$('artStudio').scrollIntoView({behavior:'smooth'});};
$('navStock').click();
if(auth())reload();else status(LOGIN_EXPIRED);
})();