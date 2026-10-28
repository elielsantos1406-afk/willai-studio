(()=>{'use strict';const $=id=>document.getElementById(id),cfg=window.WILLAI_CONFIG||{};let session=null,lastSecrets=[],inventory=[],activeBatch='';const sessionKey='willai_portal_session',safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));const status=s=>{$('realStatus').textContent=s};function auth(){try{const s=JSON.parse(sessionStorage.getItem(sessionKey)||'null');return s?.access_token?s:null}catch{return null}}function downloadText(txt,name,type='text/csv;charset=utf-8'){const u=URL.createObjectURL(new Blob(['\ufeff'+txt],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000)}
async function rpc(name,args){session=auth();if(!session)throw Error('Faça login como administrador na central WillAI antes de acessar o estoque real.');if(!cfg.url||!cfg.publishableKey)throw Error('Supabase não configurado');let r=await fetch(cfg.url+'/rest/v1/rpc/'+name,{method:'POST',cache:'no-store',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+session.access_token,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(args||{})});let b=await r.json().catch(()=>null);if(!r.ok)throw Error(b?.message||b?.error||'Erro '+r.status+'; verifique a migração e seu acesso ao banco');return b}
function selectedCodes(){const id=$('realBatch').value;return inventory.filter(x=>id==='none'? !x.batch_id:String(x.batch_id)===id).map(x=>x.code)}
function render(){
 const old=$('realCode').value;
 $('realCode').innerHTML='<option value="">Selecione uma plaquinha</option>'+inventory.map(r=>'<option value="'+safe(r.code)+'">'+safe(r.code)+'</option>').join('');
 if(inventory.some(r=>r.code===old))$('realCode').value=old;
 const batches=[...new Set(inventory.map(r=>r.batch_id||'none'))];
 const prev=$('realBatch').value;
 $('realBatch').innerHTML='<option value="">Selecione um lote real</option>'+batches.map(id=>'<option value="'+safe(id)+'">'+(id==='none'?'Códigos sem lote':safe(id.slice(0,8)))+' — '+inventory.filter(r=>(r.batch_id||'none')===id).length+' código(s)</option>').join('');
 $('realBatch').value=batches.includes(prev)?prev:(batches.includes(activeBatch)?activeBatch:(batches[0]||''));
 $('realRows').innerHTML=inventory.length?inventory.map(r=>'<tr><td><b>'+safe(r.code)+'</b></td><td>'+safe(r.status)+'</td><td style="max-width:280px;overflow-wrap:anywhere">'+safe(r.redirect_url||'Página WillAI / aguardando ativação')+'</td><td><button type="button" class="btn" data-print="'+safe(r.code)+'">Preparar arte</button> <a class="btn" href="/qr/'+safe(r.code)+'" target="_blank" rel="noopener noreferrer">Abrir QR</a></td></tr>').join(''):'<tr><td colspan="4">Nenhuma plaquinha cadastrada no Supabase. Clique em Gerar 50 códigos reais.</td></tr>';
 $('stockGenerated').textContent=inventory.length;
 $('stockAvailable').textContent=inventory.filter(x=>x.status==='available').length;
 $('stockBatches').textContent=batches.filter(x=>x!=='none').length;
 $('stockInventory').innerHTML='<div style="padding:18px;background:#f4f7fc;border-radius:16px;color:#18406b">O estoque está conectado ao Supabase. Use a tabela <b>Estoque real</b> abaixo para visualizar, vincular e imprimir os códigos cadastrados. Não utilize os QR Codes de demonstração.</div>';
 const sel=$('artCode'),current=sel.value;
 sel.innerHTML=inventory.length?inventory.map(r=>'<option value="'+safe(r.code)+'">'+safe(r.code)+'</option>').join(''):'<option value="">Nenhum código registrado</option>';
 if(inventory.some(r=>r.code===current))sel.value=current;
 sel.dispatchEvent(new Event('change'));
}
async function reload(){status('Consultando banco de dados…');try{const r=await rpc('willai_qr_admin_inventory',{});inventory=Array.isArray(r)?r:[];render();status('Estoque real carregado: '+inventory.length+' código(s).')}catch(e){status('Não foi possível consultar o estoque real: '+e.message)}}
$('realRefresh').onclick=reload;
$('realGenerate').onclick=async()=>{if(!confirm('Gerar 50 QR Codes REAIS no Supabase? Cada um terá segredo único, que deve ser baixado imediatamente.'))return;const btn=$('realGenerate');btn.disabled=true;status('Criando códigos e segredos individuais no banco…');try{const b=await rpc('willai_qr_admin_generate_batch',{p_count:50});lastSecrets=Array.isArray(b?.items)?b.items:[];activeBatch=b.batch_id||'';if(lastSecrets.length!==50)throw Error('Resposta incompleta. Consulte o banco antes de tentar novamente.');$('realExportSecrets').disabled=false;status('50 códigos gerados! Baixe AGORA os 50 segredos de ativação antes de sair da página.');await reload();$('realStatus').textContent='50 códigos gerados no banco. ATENÇÃO: baixe imediatamente a relação com os segredos de ativação.'}catch(e){status('Geração não confirmada: '+e.message)}finally{btn.disabled=false}};
$('realExportSecrets').onclick=()=>{if(!lastSecrets.length)return status('Nenhum segredo novo nesta sessão. Segredos antigos não ficam disponíveis para download.');const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const csv='codigo;endereco;segredo_de_ativacao\n'+lastSecrets.map(r=>[r.code,r.link,r.secret].map(q).join(';')).join('\n');downloadText(csv,'WillAI-QR-segredos-'+Date.now()+'.csv');status('Segredos exportados. Guarde o arquivo em local seguro e entregue cada segredo separadamente ao comprador.')};
$('realCode').onchange=e=>{let r=inventory.find(x=>x.code===e.target.value);$('realRedirect').value=r?.redirect_url||''};
$('realSaveRedirect').onclick=async()=>{const c=$('realCode').value;if(!c)return status('Selecione primeiro uma plaquinha no estoque real.');const u=$('realRedirect').value.trim();if(u&&(!/^https?:\/\//i.test(u)||u.length>2048))return status('Cole um endereço HTTP(S) completo.');try{await rpc('willai_qr_admin_redirect',{p_code:c,p_url:u});await reload();status('Destino de '+c+' atualizado no banco. O QR impresso continua igual.')}catch(e){status('Falha ao vincular o link: '+e.message)}};
$('realRows').onclick=e=>{const b=e.target.closest('[data-print]');if(!b)return;const c=b.dataset.print,sel=$('artCode');if(![...sel.options].some(x=>x.value===c))sel.add(new Option(c,c));sel.value=c;sel.dispatchEvent(new Event('change'));$('artStudio').scrollIntoView({behavior:'smooth'});status('Arte de '+c+' selecionada. Escolha WillAI ou Google e exporte o SVG/PDF.')};

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
 tab.onload=()=>tab.print();status('Folha A4 aberta: escolha Imprimir ou Salvar em PDF no navegador.');
 }catch(e){tab.close();status('Falha ao imprimir: '+e.message)}
};
const originalReload=reload;
if(auth())reload();
status('Estoque real disponível somente para administradores autorizados. Clique em Consultar estoque real para verificar a conexão.');
})();