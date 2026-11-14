/* Fallback: o editor continua funcional mesmo se o carregamento separado falhar. */
if(!window.WILLAI_SMART_EDITOR){
/* WillAI QR Smart Editor. A interface não altera o login, o código ou a página publicada até o salvamento. */
(()=>{'use strict';
 const presets=[
 ['google','Avaliar no Google','Link de avaliação do Google'],
 ['whatsapp','WhatsApp','Número com DDD ou link do WhatsApp'],
 ['instagram','Instagram','Endereço do perfil no Instagram'],
 ['site','Meu site','Endereço do site'],
 ['pix','Pagar com Pix','Configure a chave Pix abaixo'],
 ['url','Agendar horário','Link do agendamento'],
 ['url','Ver cardápio','Link do cardápio'],
 ['url','Ver catálogo','Link do catálogo'],
 ['url','Pedir pelo delivery','Link do delivery'],
 ['url','Localização','Link do Google Maps'],
 ['url','Facebook','Link do Facebook'],
 ['url','TikTok','Link do TikTok'],
 ['url','YouTube','Link do canal'],
 ['url','Telegram','Link do Telegram'],
 ['url','Threads','Link do Threads'],
 ['url','LinkedIn','Link do LinkedIn'],
 ['url','iFood','Link do iFood'],
 ['url','Shopee','Link da loja'],
 ['url','Mercado Livre','Link da loja'],
 ['url','Conhecer serviços','Link da lista de serviços'],
 ['url','Solicitar orçamento','Link do formulário'],
 ['url','Portfólio','Link do portfólio'],
 ['url','Ver preços','Link da tabela de preços'],
 ['url','Outro botão','Endereço do link personalizado'],
 ['phone','Ligar','Número para ligações'],
 ['email','Enviar e-mail','Endereço de e-mail']
 ];
 const defaultName=key=>presets.find(x=>x[0]===key)?.[1]||'Novo botão';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data=null,host=null,mounted=false,buttonsArea=null,statusArea=null;
 const validHex=v=>/^#[0-9a-f]{6}$/i.test(String(v||''));
 const isSafeLink=v=>{try{const u=new URL(String(v||''));return ['https:','http:'].includes(u.protocol)}catch{return false}};
 function contrast(hex){
  const rgb=[1,3,5].map(x=>parseInt(hex.slice(x,x+2),16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.46?'dark':'light';
 }
 function initialize(d){
  data=d;
  if(!data.smart||typeof data.smart!=='object'){
   const buttons=[];
   for(const [type,label,key] of [['google','Avaliar no Google','google'],['whatsapp','WhatsApp','whatsapp'],['instagram','Instagram','instagram'],['site','Meu site','site']]){
    if(data[key])buttons.push({type,label,value:String(data[key])});
   }
   for(const b of Array.isArray(data.buttons)?data.buttons:[]){
    if(b?.title&&b?.url)buttons.push({type:'url',label:String(b.title),value:String(b.url)});
   }
   data.smart={enabled:true,style:'clean',color:'#276c88',secondary:'#b2d8df',colorText:'light',background:'#f7f9fb',category:String(data.category||''),description:String(data.description||''),pixKey:'',pixPayload:'',buttons:buttons.slice(0,24)};
  }else{
   data.smart.enabled=true;
   data.smart.buttons=Array.isArray(data.smart.buttons)?data.smart.buttons.slice(0,24):[];
   if(!['clean','glass','editorial'].includes(data.smart.style))data.smart.style='clean';
   if(!validHex(data.smart.color))data.smart.color='#276c88';
   if(!validHex(data.smart.secondary))data.smart.secondary='#b2d8df';
   if(!validHex(data.smart.background))data.smart.background='#f7f9fb';
  }
 }
 function html(){
  return '<div class="sb-topline"><span class="sb-dot" aria-hidden="true"></span><span>WILLAI QR STUDIO</span></div><h2>Edite sua plaquinha</h2><p class="sb-lead">Altere o nome, as cores e os botões. Veja tudo na prévia e publique quando estiver pronto. Seu QR Code continua igual.</p>'+
  '<nav class="sb-tabs" aria-label="Etapas de personalização">'+[['buttons','Links e Pix'],['business','Negócio'],['design','Cores'],['plaques','Plaquinhas']].map(([k,t])=>'<button type="button" data-sb-tab="'+k+'" aria-current="'+(k==='buttons'?'step':'false')+'">'+t+'</button>').join('')+'</nav>'+ 
  '<section class="sb-section" data-sb-step="business"><h3>Dados do negócio</h3>'+
  '<label class="sb-field">Nome do estabelecimento<input data-sb-key="name" maxlength="95" placeholder="Como seu negócio se chama?" required></label>'+
  '<label class="sb-field">O que você faz?<input data-sb-key="category" maxlength="75" placeholder="Ex.: Estética, Restaurante, Loja"></label>'+
  '<label class="sb-field">Descrição curta<textarea data-sb-key="description" maxlength="360" rows="2" placeholder="Uma frase sobre seu negócio"></textarea></label>'+
  '<div class="sb-two"><label class="sb-field">Seu logotipo<input id="sbLogoUpload" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG ou WebP até 5MB</small></label>'+
  '<label class="sb-field">Foto opcional<input id="sbCoverUpload" type="file" accept="image/png,image/jpeg,image/webp"><small>Foto do estabelecimento</small></label></div>'+
  '<div class="sb-upload"><button type="button" class="sb-soft-button" data-sb-clear="logo">Remover logo</button><button type="button" class="sb-soft-button" data-sb-clear="cover">Remover foto</button></div></section>'+
  '<section class="sb-section" data-sb-step="design"><h3>Cores e fundo</h3>'+
  '<p class="sb-hint">Escolha uma paleta pronta ou ajuste as três cores do fundo Aurora Minimal. As mudanças aparecem na prévia automaticamente.</p>'+
  '<div class="sb-combos" role="group" aria-label="Combinações de cores">'+
  [['azul','Aurora padrão','#276c88','#b2d8df','#f7f9fb'],['verde','Verde','#2f7567','#a7d9c2','#f8faf8'],['terra','Terra','#996e57','#e1c8b3','#fcfaf7']].map(p=>'<button type="button" class="sb-combo" data-sb-combo="'+p[0]+'" data-primary="'+p[2]+'" data-secondary="'+p[3]+'" data-background="'+p[4]+'"><span class="sb-combo-colors"><i style="background:'+p[2]+'"></i><i style="background:'+p[3]+'"></i><i style="background:'+p[4]+'"></i></span><strong>'+p[1]+'</strong></button>').join('')+
  '</div><div class="sb-three-colors"><label class="sb-color-custom">Principal<input type="color" id="sbAccentColor"><output id="sbAccentHex" for="sbAccentColor">#276C88</output></label><label class="sb-color-custom">Secundária<input type="color" id="sbSecondaryColor"><output id="sbSecondaryHex" for="sbSecondaryColor">#B2D8DF</output></label><label class="sb-color-custom">Fundo<input type="color" id="sbBackgroundColor"><output id="sbBackgroundHex" for="sbBackgroundColor">#F7F9FB</output></label></div>'+
  '<div class="sb-aurora-preview" id="sbAuroraPreview" role="img" aria-label="Prévia do fundo Aurora Minimal com suas cores"><div class="sb-aurora-preview__content"><strong>Fundo Aurora Minimal</strong><span>Degradê suave com movimento discreto</span></div></div><div class="sb-design-actions"><button type="button" id="sbResetColors" class="sb-soft-button">Restaurar cores padrão</button></div><p class="sb-hint">O degradê é automático e a animação é suave. As cores escolhidas ficam salvas quando você publica.</p></section>'+
  '<section class="sb-section is-active" data-sb-step="buttons"><h3>Links e pagamentos</h3><p class="sb-hint">Escolha o serviço, configure o link ou o Pix e publique. Você pode alterar a ordem a qualquer momento.</p>'+   '<div class="sb-quick-grid" aria-label="Botões mais usados">'+[['google','Avaliar'],['whatsapp','WhatsApp'],['instagram','Instagram'],['pix','Pix'],['calendar','Agendar'],['site','Site'],['menu','Cardápio'],['location','Localização']].map(([type,label])=>'<button type="button" class="sb-quick" data-sb-quick="'+type+'"><span class="sb-quick-mark" aria-hidden="true"></span>'+label+'</button>').join('')+'</div>'+   '<p class="sb-hint" id="sbQuickHint">Toque em uma opção para adicionar o botão ou editar o que já existe.</p>'+
  '<div id="sbButtons" class="sb-buttons-list"></div><div class="sb-add-row"><select id="sbAddType" aria-label="Mais opções de botões">'+presets.map((v,i)=>'<option value="'+i+'">'+esc(v[1])+'</option>').join('')+'</select><button type="button" id="sbAddButton">Adicionar outro botão</button></div>'+
  '<div id="sbPixConfig" hidden><div class="sb-section"><h3>Dados do Pix</h3>'+
  '<label class="sb-field">Chave Pix<input id="sbPixKey" maxlength="180" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"></label>'+
  '<label class="sb-field">Pix Copia e Cola (opcional)<textarea id="sbPixPayload" maxlength="800" rows="3" placeholder="Cole aqui o código Pix completo, se tiver"><\/textarea><small>Com um código completo, o botão copia o Pix Copia e Cola. Sem ele, copia a chave cadastrada. A WillAI não confirma pagamentos automaticamente.</small></label></div></div></section>'+
  '<section class="sb-section" data-sb-step="plaques"><h3>Minhas plaquinhas</h3><p class="sb-hint">Abra outra plaquinha vinculada à sua conta sem precisar criar um novo login.</p>'+
  '<div id="sbOwnedList" class="sb-owned-list"></div><div class="sb-add-plate"><input id="sbNewCode" placeholder="W002" maxlength="9" aria-label="Código de outra plaquinha"><button type="button" id="sbAddPlate">Adicionar outra</button></div>'+
  '<p class="sb-hint" id="sbOwnedMessage" role="status">Carregando minhas plaquinhas…</p></section>'+
  '<section class="sb-advanced"><span class="sb-hint">Os dados só mudam para os visitantes quando você clicar em Salvar e publicar.</span><button type="button" id="sbSignOut" class="sb-signout">Sair da conta</button></section>'+
  '<div class="sb-toolbar"><button type="button" id="sbPreview" class="sb-soft-button">Ver prévia</button><button type="button" id="sbPublish" class="sb-publish">Salvar e publicar</button></div><p id="sbStatus" role="status" class="sb-status"></p>';
 }
 function updateStatus(text,error=false){if(statusArea){statusArea.textContent=text;statusArea.style.color=error?'#a63855':'#297e70'}}
 function refresh(){host?.preview?.()}
 function syncFields(){
  if(!mounted||!data)return;
  const smart=data.smart;
  const get=(name)=>document.querySelector('#smartBuilder [data-sb-key="'+name+'"]');
  get('name').value=data.name||'';
  get('category').value=smart.category||'';
  get('description').value=smart.description||'';
  const accent=document.getElementById('sbAccentColor'),secondary=document.getElementById('sbSecondaryColor'),bg=document.getElementById('sbBackgroundColor');
  accent.value=validHex(smart.color)?smart.color:'#276c88';
  secondary.value=validHex(smart.secondary)?smart.secondary:'#b2d8df';
  bg.value=validHex(smart.background)?smart.background:'#f7f9fb';
  document.getElementById('sbAccentHex').textContent=accent.value.toUpperCase();
  document.getElementById('sbSecondaryHex').textContent=secondary.value.toUpperCase();
  document.getElementById('sbBackgroundHex').textContent=bg.value.toUpperCase();
  boxUpdatePresets(smart);
  document.getElementById('sbPixKey').value=smart.pixKey||'';
  document.getElementById('sbPixPayload').value=smart.pixPayload||'';
  updateAuroraPreview();
  renderButtons();
 }
 function boxUpdatePresets(smart){
  document.querySelectorAll('#smartBuilder [data-sb-combo]').forEach(button=>{
   const matched=String(button.dataset.primary).toLowerCase()===String(smart.color).toLowerCase()
     && String(button.dataset.secondary).toLowerCase()===String(smart.secondary).toLowerCase()
     && String(button.dataset.background).toLowerCase()===String(smart.background).toLowerCase();
   button.setAttribute('aria-pressed',matched?'true':'false');
  });
 }
 function updateAuroraPreview(){
  const el=document.getElementById('sbAuroraPreview');if(!el||!data?.smart)return;
  el.style.setProperty('--sb-aurora-primary',data.smart.color||'#276c88');
  el.style.setProperty('--sb-aurora-secondary',data.smart.secondary||'#b2d8df');
  el.style.setProperty('--sb-aurora-base',data.smart.background||'#f7f9fb');
  for(const [field,output] of [['sbAccentColor','sbAccentHex'],['sbSecondaryColor','sbSecondaryHex'],['sbBackgroundColor','sbBackgroundHex']]){const color=document.getElementById(field);const text=document.getElementById(output);if(color&&text)text.textContent=color.value.toUpperCase()}
  boxUpdatePresets(data.smart);
 }
 function quickConfig(type){
  if(type==='calendar')return {type:'url',label:'Agendar horário',value:''};
  if(type==='menu')return {type:'url',label:'Ver cardápio',value:''};
  if(type==='location')return {type:'url',label:'Localização',value:''};
  const p=presets.find(x=>x[0]===type);
  return p?{type,label:p[1],value:['google','whatsapp','instagram','site'].includes(type)?String(data[type]||''):''}:null;
 }
 function matchQuick(button,type){
  if(type==='calendar')return button.type==='url'&&/agend|horário|horario|reserva/i.test(button.label||'');
  if(type==='menu')return button.type==='url'&&/cardápio|cardapio|menu/i.test(button.label||'');
  if(type==='location')return button.type==='url'&&/localiza|endereço|endereco|mapa/i.test(button.label||'');
  return button.type===type;
 }
 function gotoButton(type){
  const index=data.smart.buttons.findIndex(b=>matchQuick(b,type));
  if(index<0)return;
  const target=buttonsArea?.querySelector('[data-sb-row="'+index+'"]');
  if(type==='pix')document.getElementById('sbPixKey')?.focus();
  else{
   target?.scrollIntoView({behavior:'smooth',block:'nearest'});
   target?.querySelector('input[data-sb-prop="value"]')?.focus();
  }
 }
 function updateQuickButtons(){
  document.querySelectorAll('#smartBuilder [data-sb-quick]').forEach(btn=>{
   const exists=data.smart.buttons.some(b=>matchQuick(b,btn.dataset.sbQuick));
   btn.setAttribute('aria-pressed',exists?'true':'false');
   btn.title=exists?'Editar este botão':'Adicionar este botão';
  });
 }
 function renderButtons(){
  if(!buttonsArea||!data?.smart)return;
  const smart=data.smart;
  buttonsArea.innerHTML=smart.buttons.map((b,i)=>{
   const type=b.type||'url',isPix=type==='pix';
   const description=isPix?'O valor será copiado dos dados Pix abaixo.':type==='google'?'Insira o link de avaliação do Google.':type==='whatsapp'?'Número com DDD':type==='phone'?'Número para ligar':type==='email'?'Endereço de e-mail':'Link completo começando com https://';
   return '<article class="sb-btn-card" data-sb-row="'+i+'"><div class="sb-btn-title"><span>Botão '+(i+1)+'</span><span>'+esc(isPix?'Pix':type==='url'?'Link':'Contato')+'</span></div>'+
   '<div class="sb-two"><label class="sb-field">Texto do botão<input data-sb-button="'+i+'" data-sb-prop="label" maxlength="70" value="'+esc(b.label||'')+'" placeholder="Nome do botão"></label>'+
   (isPix?'<div class="sb-field"><span>Copiar Pix</span><p class="sb-hint">Use os dados Pix abaixo.</p></div>':
   '<label class="sb-field">Destino<input data-sb-button="'+i+'" data-sb-prop="value" maxlength="1200" value="'+esc(b.value||'')+'" placeholder="'+esc(description)+'"></label>')+
   '</div><div class="sb-btn-controls"><button type="button" class="sb-button-control" data-sb-move="-1" data-sb-index="'+i+'" '+(i===0?'disabled':'')+'>Subir</button>'+
   '<button type="button" class="sb-button-control" data-sb-move="1" data-sb-index="'+i+'" '+(i===smart.buttons.length-1?'disabled':'')+'>Descer</button>'+
   '<button type="button" class="sb-button-control sb-button-control--remove" data-sb-remove="'+i+'">Remover</button></div></article>'
  }).join('')||'<p class="sb-hint">Nenhum botão adicionado ainda.</p>';
  document.getElementById('sbPixConfig').hidden=!smart.buttons.some(x=>x.type==='pix');
  updateQuickButtons();
 }
 function update(newData){data=newData;syncFields()}
 function mount(d,callbacks){
  data=d;host=callbacks;
  initialize(data);
  const ed=document.getElementById('editor');if(!ed)return;
  ed.classList.add('qr-smart-active');
  let box=document.getElementById('smartBuilder');
  if(!box){box=document.createElement('section');box.id='smartBuilder';box.className='panel';ed.querySelector(':scope > div:first-child')?.prepend(box);box.innerHTML=html();}
  if(!mounted){
   buttonsArea=document.getElementById('sbButtons');statusArea=document.getElementById('sbStatus');
   box.addEventListener('input',e=>{
    const target=e.target,key=target.dataset.sbKey,prop=target.dataset.sbProp,idx=Number(target.dataset.sbButton);
    if(key){if(key==='name')data.name=target.value;else data.smart[key]=target.value;refresh();return}
    if(prop&&Number.isInteger(idx)&&data.smart.buttons[idx]){data.smart.buttons[idx][prop]=target.value;refresh();return}
    if(target.id==='sbPixKey'){data.smart.pixKey=target.value.trim();refresh()}
    if(target.id==='sbPixPayload'){data.smart.pixPayload=target.value.trim();refresh()}
    if(target.id==='sbAccentColor'){data.smart.color=target.value;data.smart.colorText=contrast(target.value);updateAuroraPreview();refresh()}
    if(target.id==='sbSecondaryColor'){data.smart.secondary=target.value;updateAuroraPreview();refresh()}
    if(target.id==='sbBackgroundColor'){data.smart.background=target.value;updateAuroraPreview();refresh()}
   });
   box.addEventListener('click',async e=>{
    const target=e.target.closest('button');if(!target)return;
    if(target.dataset.sbTab){box.querySelectorAll('[data-sb-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.sbTab===target.dataset.sbTab?'step':'false'));box.querySelectorAll('[data-sb-step]').forEach(sec=>sec.classList.toggle('is-active',sec.dataset.sbStep===target.dataset.sbTab));return}
    if(target.id==='sbSignOut'){document.getElementById('signOut')?.click();return}
    if(target.id==='sbPreview'){document.getElementById('v4Preview')?.scrollIntoView({behavior:'smooth',block:'center'});return}
    if(target.id==='sbPublish'){document.getElementById('save')?.click();return}
    if(target.id==='sbResetColors'){data.smart.style='clean';data.smart.color='#276c88';data.smart.secondary='#b2d8df';data.smart.background='#f7f9fb';data.smart.colorText='light';syncFields();refresh();updateStatus('Cores padrão restauradas na prévia. Clique em Salvar e publicar para aplicar.');return}
    if(target.dataset.sbCombo){data.smart.style='clean';data.smart.color=target.dataset.primary;data.smart.secondary=target.dataset.secondary;data.smart.background=target.dataset.background;data.smart.colorText=contrast(data.smart.color);syncFields();refresh();return}
    if(target.dataset.sbQuick){
     const type=target.dataset.sbQuick,existing=data.smart.buttons.findIndex(b=>matchQuick(b,type));
     if(existing>=0){gotoButton(type);updateStatus('Botão já adicionado. Você pode editar o destino abaixo.');return}
     if(data.smart.buttons.length>=24){updateStatus('Sua página já tem 24 botões. Remova um antes de adicionar outro.',true);return}
     const item=quickConfig(type);if(!item)return;
     data.smart.buttons.push(item);renderButtons();refresh();
     updateStatus(type==='pix'?'Pix adicionado. Informe a chave Pix abaixo e depois publique.':'Botão adicionado. Preencha o endereço e publique.');
     if(type==='pix'){document.getElementById('sbPixKey')?.focus()}else gotoButton(type);
     return;
    }
    if(target.id==='sbAddButton'){
     if(data.smart.buttons.length>=24)return updateStatus('Limite de 24 botões por página.',true);
     const i=Number(document.getElementById('sbAddType').value),p=presets[i];if(!p)return;
     const type=p[0],value=['google','whatsapp','instagram','site'].includes(type)?String(data[type]||''):'';
     data.smart.buttons.push({type,label:p[1],value});
     renderButtons();refresh();updateStatus(type==='pix'?'Pix adicionado. Informe a chave ou código Copia e Cola.':'Botão adicionado. Preencha o destino, se necessário.');
     if(type==='pix')document.getElementById('sbPixKey')?.focus();return;
    }
    if(target.dataset.sbRemove!==undefined){data.smart.buttons.splice(Number(target.dataset.sbRemove),1);renderButtons();refresh();return}
    if(target.dataset.sbMove!==undefined){
     const i=Number(target.dataset.sbIndex),j=i+Number(target.dataset.sbMove);
     if(i>=0&&j>=0&&j<data.smart.buttons.length){const b=data.smart.buttons.splice(i,1)[0];data.smart.buttons.splice(j,0,b);renderButtons();refresh()}return
    }
    if(target.dataset.sbClear){const kind=target.dataset.sbClear;data[kind]='';refresh();updateStatus('Imagem removida da prévia. Publique para atualizar.');return}
    if(target.id==='sbAddPlate'){
     const value=String(document.getElementById('sbNewCode').value||'').trim().toUpperCase();
     if(!/^W[0-9]{3,8}$/.test(value))return updateStatus('Informe um código no formato W002.',true);
     if(!window.confirm('Abrir a plaquinha '+value+'? Salve sua edição atual antes de sair.'))return;
     location.assign('/qr/'+encodeURIComponent(value));return;
    }
   });
   for(const [inputId,kind] of [['sbLogoUpload','logo'],['sbCoverUpload','cover']]){
    document.getElementById(inputId).addEventListener('change',async e=>{
     const file=e.target.files?.[0];if(!file)return;
     e.target.disabled=true;updateStatus('Enviando imagem…');
     try{data[kind]=await host.upload(file,kind);refresh();updateStatus('Imagem pronta. Salve a página para publicar.')}
     catch(err){updateStatus(err?.message||'Não foi possível enviar a imagem.',true)}
     finally{e.target.disabled=false;e.target.value=''}
    });
   }
   mounted=true;
  }
  syncFields();
  updateStatus('Seus links anteriores foram carregados. Adicione Pix ou outros botões e toque em Salvar e publicar para atualizar a página.');
  Promise.resolve(host.owned()).then(rows=>renderOwned(rows)).catch(()=>renderOwned(null));
 }
 function renderOwned(rows){
  const holder=document.getElementById('sbOwnedList'),notice=document.getElementById('sbOwnedMessage');
  if(!holder||!notice)return;
  if(!Array.isArray(rows)){holder.innerHTML='';notice.textContent='Você ainda pode adicionar uma plaquinha pelo código acima.';return}
  holder.innerHTML=rows.map(x=>'<div class="sb-owned"><div><strong>'+esc(x.code)+'</strong><small>'+esc(x.name||'Minha plaquinha')+'</small></div><a href="/qr/'+encodeURIComponent(x.code)+'?editar=1">Editar</a></div>').join('');
  notice.textContent=rows.length+' plaquinha(s) nesta conta.';
 }
 function validate(d){
  const smart=d.smart;
  if(!smart?.enabled)return null;
  if(!Array.isArray(smart.buttons))return 'A lista de botões está inválida.';
  if(smart.buttons.length>24)return 'A página aceita no máximo 24 botões.';
  for(const b of smart.buttons){
   if(!b||!String(b.label||'').trim())return 'Preencha o nome de todos os botões.';
   const type=String(b.type||'url');
   if(type==='pix'){if(!String(smart.pixKey||'').trim()&&!String(smart.pixPayload||'').trim())return 'Preencha sua chave Pix ou código Pix Copia e Cola.';continue}
   const v=String(b.value||'').trim();
   if(type==='phone'){if(v.replace(/\D/g,'').length<10)return 'Informe um telefone com DDD.';continue}
   if(type==='email'){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return 'Informe um e-mail válido para o botão.';continue}
   if(type==='whatsapp'){if(v.replace(/\D/g,'').length<10)return 'Informe um WhatsApp válido com DDD.';continue}
   if(!isSafeLink(v))return 'Configure um link válido (https://) no botão '+b.label+'.';
  }
  return null;
 }
 window.WILLAI_SMART_EDITOR=Object.freeze({mount,update,initialize,validate});
})();
}
(()=>{'use strict';const cfg=window.WILLAI_CONFIG||{},code=(location.pathname.split('/').filter(Boolean).pop()||'').toUpperCase();const base=cfg.url,key=cfg.publishableKey;const $=id=>document.getElementById(id),pages=['unavailable','loadError','start','account','claim','editor','public','pending','approval','v4Public'];let jwt=null,owner=false,mode='register',active=false,record=null;const activationToken=/^[a-f0-9]{48}$/.test(new URLSearchParams(location.hash.slice(1)).get('ativar')||'')?new URLSearchParams(location.hash.slice(1)).get('ativar'):null;
const editIntent=new URLSearchParams(location.search).get('editar')==='1';
let data={name:'Meu estabelecimento',category:'',description:'Conheça nossos serviços.',address:'',hours:'',google:'',whatsapp:'',instagram:'',site:'',primary:'#14559e',background:'#eff8ff',ink:'#163c61',font:'system-ui',layout:'rounded',logo:'',cover:'',buttons:[]};
const smartEditor=window.WILLAI_SMART_EDITOR||null;
const esc=x=>String(x??'').replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]));
const url=x=>{try{let u=new URL(x);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
const message=(s,error=false)=>{const n=$('notice');n.textContent=s;n.className='message'+(error?'':' success')};
const PASSWORD_RULES=[
 {id:'passwordRuleLength',label:'8 caracteres ou mais',test:p=>p.length>=8},
 {id:'passwordRuleUpper',label:'uma letra maiúscula',test:p=>/[A-ZÀ-ÖØ-Þ]/.test(p)},
 {id:'passwordRuleLower',label:'uma letra minúscula',test:p=>/[a-zà-öø-ÿ]/.test(p)},
 {id:'passwordRuleNumber',label:'um número',test:p=>/[0-9]/.test(p)},
 {id:'passwordRuleSymbol',label:'um símbolo (@, #, ! etc.)',test:p=>/[^A-Za-zÀ-ÿ0-9\s]/.test(p)}
];
function passwordFailures(p){return PASSWORD_RULES.filter(r=>!r.test(p))}
function showAccountError(text){$('accountError').textContent=text;$('accountError').classList.remove('hidden');message(text,true)}
function clearAccountError(){$('accountError').textContent='';$('accountError').classList.add('hidden')}
function updatePasswordRequirements(){
 const registering=mode==='register',pass=$('password'),box=$('passwordRequirements');
 box.classList.toggle('hidden',!registering);
 $('accountSwitchPrompt').textContent=registering?'Já tem conta?':'Ainda não tem conta?';
 $('switchAccountMode').textContent=registering?'Entrar com meu e-mail':'Criar uma conta';
 if(registering){pass.minLength=8;pass.setAttribute('aria-describedby','passwordRequirements')}
 else{pass.removeAttribute('minlength');pass.removeAttribute('aria-describedby')}
 for(const rule of PASSWORD_RULES){
  const el=$(rule.id),matched=rule.test(pass.value);
  el.classList.toggle('met',matched);
  el.setAttribute('aria-label',(matched?'Atendido: ':'Pendente: ')+el.textContent);
 }
}


const V4_DEFAULT={
 content:{topLabel:'SUA OPINIÃO IMPORTA',titleFirst:'Deixe sua',titleSecond:'avaliação',reviewTag:'DEIXE SUA EXPERIÊNCIA',reviewHeading:'Como foi o seu atendimento?',ratingLabel:'Selecione as estrelas',googleButtonText:'Avaliar no Google',whatsappLabel:'WhatsApp',instagramLabel:'Instagram',siteLabel:'Nosso Site',footerText:'Criado por WILLAI by ELIX SOLUTIONS'},
 theme:{background:'#07172F',backgroundSecondary:'#102E65',accent:'#85DDF2',gold:'#F2C579',surface:'#FFFFFF',surfaceSoft:'#F3F7FD',ink:'#102B52',button:'#124A95',buttonText:'#FFFFFF',bodyText:'#C4D4EA',contact:'#EAF2FE',radius:28,font:'modern',glow:80}
};
const absoluteUrl=x=>{try{const u=new URL(x);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}};
function v4Config(d){
 const custom=d.reviewV4||{};
 return {
  version:4,code,
  content:{...V4_DEFAULT.content,...custom.content,companyName:d.name||'Estabelecimento'},
  media:{logo:d.logo||'',photo:d.cover||''},
  links:{google:absoluteUrl(d.google),whatsapp:d.whatsapp||'',instagram:absoluteUrl(d.instagram),site:absoluteUrl(d.site),login:''},
  visible:{whatsapp:!!d.whatsapp,instagram:!!absoluteUrl(d.instagram),site:!!absoluteUrl(d.site),...custom.visible},
  theme:{...V4_DEFAULT.theme,...custom.theme},
  extraButtons:(d.buttons||[]).filter(x=>x&&x.title&&absoluteUrl(x.url)).slice(0,12).map(x=>({title:x.title,url:absoluteUrl(x.url)})),
  smart:d.smart?.enabled?d.smart:{
    enabled:true,style:'clean',color:'#276c88',secondary:'#b2d8df',background:'#f7f9fb',
    category:String(d.category||''),description:String(d.description||''),
    pixKey:'',pixPayload:'',
    buttons:[
     ...[['google','Avaliar no Google',d.google],['whatsapp','WhatsApp',d.whatsapp],['instagram','Instagram',d.instagram],['site','Nosso site',d.site]]
       .filter(x=>x[2]).map(x=>({type:x[0],label:x[1],value:String(x[2])})),
     ...(Array.isArray(d.buttons)?d.buttons:[]).filter(x=>x?.title&&x?.url).map(x=>({type:'url',label:String(x.title),value:String(x.url)}))
    ].slice(0,24)
   }
 };
}
function postV4(frameId){
 const frame=$(frameId),child=frame?.contentWindow;
 if(!child||!frame?.src||frame.src==='about:blank')return;
 try{child.postMessage({type:'WILLAI_REVIEW_PREVIEW',config:v4Config(data)},location.origin)}catch{}
}
// No Safari/iPhone a confirmação por postMessage/animationFrame pode ser suspensa.
// Como os dois documentos são da própria WillAI, também aplicamos os dados
// diretamente quando o iframe termina de carregar. Não há chamadas de escrita.
function renderPublicV4Direct(){
 const frame=$('v4Frame');
 if(!frame||!document.body.classList.contains('is-v4-public'))return false;
 try{
  const child=frame.contentWindow;
  if(typeof child?.WILLAI_REVIEW?.render!=='function')return false;
  child.WILLAI_REVIEW.render(v4Config(data));
  child.document.documentElement.classList.remove('qr-embedded');
  window.WILLAI_QR_BOOT_DONE?.();
  return true;
 }catch(err){
  console.warn('WILLAI QR: aguardando renderização da V4',err?.name||'indisponível');
  return false;
 }
}
function smartPageSrc(preview=false){
 const src='/assets/qr-smart-page.html?v=7';
 return src+(preview?'&preview=1':'');
}
function refreshV4(){
 const preview=$('v4Preview'),previewSrc=smartPageSrc(true);
 if(preview.getAttribute('src')!==previewSrc)preview.src=previewSrc;
 else postV4('v4Preview');
 const frame=$('v4Frame');
 if(frame.getAttribute('src')==='about:blank')return;
 if(document.body.classList.contains('is-v4-public')){
  const src=smartPageSrc();
  if(frame.getAttribute('src')!==src){frame.src=src;return}
 }
 if(!renderPublicV4Direct())postV4('v4Frame');
}
function showV4(){
 const frame=$('v4Frame'),src=smartPageSrc();
 if(frame.getAttribute('src')!==src){frame.src=src;return}
 if(!renderPublicV4Direct())postV4('v4Frame');
}
window.addEventListener('message',e=>{
 const framePublic=$('v4Frame'),framePreview=$('v4Preview');
 if(e.origin!==location.origin||!e.data||typeof e.data!=='object')return;
 if(e.data.type==='WILLAI_QR_READY'&&(e.source===framePublic.contentWindow||e.source===framePreview.contentWindow)){
  if(e.source===framePublic.contentWindow){
   if(!renderPublicV4Direct())postV4('v4Frame');
  }else postV4('v4Preview');
  return;
 }
 if(e.source!==framePublic.contentWindow)return;
 if(e.data.type==='WILLAI_QR_RENDERED'){
  if(document.body.classList.contains('is-v4-public'))window.WILLAI_QR_BOOT_DONE?.();
  return;
 }
 if(e.data.type==='WILLAI_QR_LOGIN'){requestLogin();return}
 if(e.data.type==='WILLAI_QR_EXTERNAL'){
  const safe=absoluteUrl(e.data.url);
  if(safe)location.assign(safe);
 }
});
async function uploadQrImage(file,kind){
 if(!jwt||!owner)throw Error('Entre com sua conta para enviar imagens.');
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>5*1024*1024)throw Error('Escolha PNG, JPG ou WebP de até 5 MB.');
 const claims=JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
 const user=claims?.sub;
 if(!/^[0-9a-f-]{36}$/i.test(user||''))throw Error('Sessão inválida. Entre novamente na sua conta.');
 const bmp=await createImageBitmap(file);
 const max=kind==='logo'?950:1700;
 const scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(bmp.width*scale));canvas.height=Math.max(1,Math.round(bmp.height*scale));
 canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);
 bmp.close?.();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.84));
 if(!blob||blob.size>3*1024*1024)throw Error('Não foi possível otimizar a imagem. Escolha outra foto.');
 const bucket='willai-public',objectPath=user+'/qr-'+code.toLowerCase()+'-'+kind+'-'+Date.now()+'.webp';
 const res=await fetch(base+'/storage/v1/object/'+bucket+'/'+objectPath,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+jwt,'Content-Type':'image/webp','x-upsert':'false'},body:blob});
 if(!res.ok){let err={};try{err=await res.json()}catch{}throw Error('Falha ao enviar imagem: '+(err.message||err.error||'HTTP '+res.status))}
 return base+'/storage/v1/object/public/'+bucket+'/'+objectPath;
}
function show(p){
 const v4=p==='public';const target=v4?'v4Public':p;
 document.body.classList.toggle('is-v4-public',v4);
 for(const id of pages)$(id).classList.toggle('hidden',id!==target);
 if(v4)showV4();
 else window.WILLAI_QR_BOOT_DONE?.();
}

function friendlyApiError(payload,status,path){
 const raw=String(payload?.msg||payload?.message||payload?.error_description||'').trim();
 const code=String(payload?.code||payload?.error_code||payload?.error||'').toLowerCase();
 const lower=raw.toLowerCase();
 if(path.startsWith('/auth/v1/')){
  if(/email_exists|user_already_exists/.test(code)||/already registered|already exists|already in use|email is already/.test(lower))
   return 'Este e-mail já possui uma conta. Clique em “Já tenho conta” e entre com a senha cadastrada.';
  if(code==='email_address_invalid'||/invalid email|email.*invalid/.test(lower))
   return 'O e-mail informado não foi aceito. Confira o endereço e tente novamente.';
  if(code==='email_not_confirmed'||/email not confirmed/.test(lower))
   return 'Confirme seu e-mail pela mensagem recebida antes de entrar.';
  if(code==='invalid_credentials'||/invalid login credentials/.test(lower))
   return 'E-mail ou senha incorretos. Confira seus dados e tente novamente.';
  if(code==='signup_disabled'||code==='email_provider_disabled')
   return 'O cadastro por e-mail está temporariamente indisponível. Entre em contato com o suporte da WillAI.';
  if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit'||status===429)
   return 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.';
  if(code==='weak_password'||/password.*(weak|short|length|character|digit|uppercase|lowercase|symbol|special)/.test(lower)){
   if(/uppercase/.test(lower))return 'Senha recusada: inclua pelo menos uma letra maiúscula.';
   if(/lowercase/.test(lower))return 'Senha recusada: inclua pelo menos uma letra minúscula.';
   if(/digit|number/.test(lower))return 'Senha recusada: inclua pelo menos um número.';
   if(/symbol|special|non-alphanumeric/.test(lower))return 'Senha recusada: inclua um símbolo, como @, # ou !.';
   if(/length|short|character/.test(lower))return 'Senha recusada: o tamanho mínimo exigido pelo Supabase não foi atingido.';
   return 'O Supabase recusou a senha. Confira os requisitos informados abaixo do campo.';
  }
  if(status===422)return raw?'O cadastro ou login foi recusado: '+raw:'Cadastro recusado. Confira o e-mail, a senha e se você já possui uma conta.';
 }
 return raw||'Não foi possível concluir esta solicitação (HTTP '+status+'). Tente novamente.';
}
async function api(path,opts={},token){const res=await fetch(base+path,{...opts,cache:'no-store',headers:{apikey:key,Accept:'application/json','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(opts.headers||{})}});let b=null;try{b=await res.json()}catch{}if(!res.ok)throw Error(friendlyApiError(b,res.status,path));return b}
async function rpc(name,args={},token){return api('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)},token)}
const sessionKey='willai_qr_owner_auth'; // Apenas tokens de sessao; paginas e proprietarios ficam no Supabase.
function rememberSession(s){if(!s?.access_token)return;jwt=s.access_token;try{localStorage.setItem(sessionKey,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600)}))}catch{}}
async function restoreSession(){
 let s,portal=false;try{s=JSON.parse(localStorage.getItem(sessionKey)||'null');if(!s?.access_token){s=JSON.parse(sessionStorage.getItem('willai_portal_session')||'null');portal=!!s?.access_token}}catch{return false}
 if(!s?.access_token)return false;
 if(s.expires_at&&s.expires_at<Math.floor(Date.now()/1000)+90){
  if(!s.refresh_token)return false;
  try{s=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});rememberSession(s);if(portal)sessionStorage.setItem('willai_portal_session',JSON.stringify(s))}catch{try{localStorage.removeItem(sessionKey)}catch{};return false}
 }
 jwt=s.access_token;return true;
}
async function openEditorAfterAuth(){
 if(!jwt)throw Error('Entre com seu e-mail e senha.');
 if(active){
  const own=await rpc('willai_qr_owned',{p_code:code},jwt);
  if(!own)throw Error('Este QR Code pertence a outra conta. Use o e-mail do proprietário.');
  data={...data,...own.page};owner=true;fill();show('editor');message('Bem-vindo de volta. Você pode editar sua página.');
 }else{
  const result=activationToken
    ? await rpc('willai_qr_claim',{p_code:code,p_secret:activationToken,p_page:data},jwt)
    : await rpc('willai_qr_request_claim',{p_code:code},jwt);
  if(result?.ok!==true)throw Error('Não foi possível confirmar a ativação. Tente novamente.');
  const own=await rpc('willai_qr_owned',{p_code:code},jwt);
  if(!own)throw Error('Não foi possível carregar sua plaquinha. Entre novamente.');
  data={...data,...own.page};
  active=true;owner=true;history.replaceState(null,'',location.pathname+location.search);fill();show('editor');
  message('Plaquinha ativada na sua conta. Personalize e publique sua página!');
 }
}

function link(k){return k==='whatsapp'&&data.whatsapp?'https://wa.me/'+data.whatsapp.replace(/\D/g,''):url(data[k])}
function card(d,interactive=false){let main=url(d.google),corner=d.layout==='pill'?'28px':d.layout==='square'?'8px':'16px';return '<div style="background:'+esc(d.background)+';color:'+esc(d.ink)+';font-family:'+esc(d.font)+';min-height:540px;text-align:center;padding-bottom:24px"><div style="height:120px;background:'+esc(d.primary)+' '+(d.cover?'url('+JSON.stringify(d.cover)+') center/cover':'')+'"></div><div style="height:78px;width:78px;border-radius:22px;background:white;margin:-37px auto 12px;position:relative;display:grid;place-items:center;overflow:hidden;border:3px solid '+esc(d.background)+'">'+(d.logo?'<img alt="Logo" src="'+esc(d.logo)+'" style="width:100%;height:100%;object-fit:contain">':'✦')+'</div><div style="padding:0 18px"><h2 style="font-size:23px;margin:9px 0">'+esc(d.name)+'</h2><p style="font-size:12px;opacity:.7">'+esc(d.category)+'</p><p style="line-height:1.5;font-size:13px">'+esc(d.description)+'</p>'+((d.google&&main!=='#')?'<a target="_blank" rel="noopener noreferrer" href="'+esc(main)+'" style="display:block;background:'+esc(d.primary)+';color:#fff;padding:14px;border-radius:'+corner+';text-decoration:none;font-weight:750;margin:11px 0">★ Avaliar no Google</a>':'')+['instagram','whatsapp'].filter(x=>d[x]).map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(x==='whatsapp'?'https://wa.me/'+String(d.whatsapp).replace(/\D/g,''):url(d[x]))+'" style="display:block;background:white;border:1px solid #dbe5ee;color:'+esc(d.ink)+';padding:13px;text-decoration:none;border-radius:'+corner+';margin:8px 0">'+(x==='instagram'?'Instagram':'WhatsApp')+'</a>').join('')+(d.buttons||[]).filter(x=>x.title&&url(x.url)!=='#').map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(url(x.url))+'" style="display:block;background:white;color:'+esc(d.ink)+';padding:13px;border-radius:'+corner+';margin:8px 0;text-decoration:none">'+esc(x.title)+'</a>').join('')+'<p style="font-size:11px;opacity:.7;line-height:1.5">'+esc(d.address)+'<br>'+esc(d.hours)+'</p><p style="font-size:10px;opacity:.5;margin-top:20px">WillAI • Tecnologia & Soluções Digitais</p></div></div>'}
function render(){refreshV4();$('buttonEditor').innerHTML=(data.buttons||[]).map((b,i)=>'<div class="field"><label>Botão '+(i+1)+'</label><div class="buttonline"><input data-button="'+i+'" data-prop="title" placeholder="Texto" value="'+esc(b.title)+'"><input data-button="'+i+'" data-prop="url" placeholder="https://..." value="'+esc(b.url)+'"><button class="btn danger" data-remove="'+i+'">×</button></div></div>').join('')}
function fill(){
 if(smartEditor)smartEditor.mount(data,{
  preview:()=>refreshV4(),
  upload:(file,kind)=>uploadQrImage(file,kind),
  owned:()=>rpc('willai_qr_my_plaques',{},jwt)
 });
 document.querySelectorAll('[data-key]').forEach(el=>{el.value=data[el.dataset.key]??''});
 document.querySelectorAll('[data-v4-content]').forEach(el=>{el.value=data.reviewV4?.content?.[el.dataset.v4Content]??V4_DEFAULT.content[el.dataset.v4Content]??''});
 document.querySelectorAll('[data-v4-theme]').forEach(el=>{el.value=data.reviewV4?.theme?.[el.dataset.v4Theme]??V4_DEFAULT.theme[el.dataset.v4Theme]??''});
 $('editorLink').textContent='Endereço permanente: willai.com.br/qr/'+code;render();
}

async function lookupPublic(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
 try{
  return await api('/rest/v1/rpc/willai_qr_public',{
   method:'POST',body:JSON.stringify({p_code:code}),signal:controller.signal
  });
 }finally{clearTimeout(timer)}
}
async function boot(){
 if(!/^W[0-9]{3,8}$/.test(code)){message('Código inválido',true);return show('unavailable')}
 $('title').textContent='Plaquinha '+code;
 if(!base||!key){message('Configuração do sistema incompleta',true);return show('loadError')}
 try{
  const res=await lookupPublic();
  record=res;
  if(!res){message('Esta plaquinha ainda não foi registrada.',true);return show('unavailable')}
  if(res.status==='redirect'){
   try{
    const target=new URL(res.redirect_url);
    if(!['http:','https:'].includes(target.protocol))throw Error('Redirecionamento inválido');
    location.replace(target.href);return;
   }catch(e){message('O link vinculado está inválido. Entre em contato com a WillAI.',true);return show('unavailable')}
  }
  if(res.status==='active'){
   data={...data,...res.page};active=true;
   if(editIntent){await requestLogin();return}
   show('public');return;
  }
  if(res.status==='pending'){
   active=true;
   message('Página em preparação. Somente o proprietário pode entrar e publicar.');
   if(editIntent){await requestLogin();return}
   return show('pending');
  }
  if(res.status==='available'){
   message(activationToken?'Plaquinha liberada para ativação':'Plaquinha liberada. Crie sua conta para ativar e começar a editar.');
   return show('start');
  }
  message('Esta plaquinha ainda não foi liberada para entrega ou está indisponível.',true);
  return show('unavailable');
 }catch(error){
  console.warn('WILLAI QR: falha ao consultar estado público',error?.name||'Erro de conexão');
  $('loadErrorText').textContent='A consulta da plaquinha não foi concluída. Verifique sua conexão e tente novamente.';
  message('Não foi possível carregar sua página. Tente novamente.',true);
  show('loadError');
 }
}
$('retryLoad').onclick=()=>location.reload();
$('qrBackToEditor').onclick=()=>{$('smartBuilder')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})};
$('v4Frame').addEventListener('load',()=>{
 if(!renderPublicV4Direct())postV4('v4Frame');
});
$('v4Frame').addEventListener('error',()=>window.WILLAI_QR_BOOT_FAIL?.('Não foi possível carregar a página. Tente novamente.'));


$('showRegister').onclick=()=>{mode='register';$('accountTitle').textContent='Criar minha conta';$('password').autocomplete='new-password';clearAccountError();updatePasswordRequirements();show('account')};
async function requestLogin(){
 try{if(await restoreSession()){await openEditorAfterAuth();return}}catch(e){message(e.message,true)}
 mode='login';$('accountTitle').textContent='Entrar na minha conta';$('password').autocomplete='current-password';clearAccountError();updatePasswordRequirements();show('account');
}
$('showLogin').onclick=$('ownerLogin').onclick=$('pendingLogin').onclick=requestLogin;
$('switchAccountMode').onclick=()=>{if(mode==='register')requestLogin();else $('showRegister').onclick()};
$('cancelAccount').onclick=()=>{clearAccountError();show(record?.status==='pending'?'pending':active?'public':'start')};
$('password').addEventListener('input',()=>{clearAccountError();updatePasswordRequirements()});
$('email').addEventListener('input',clearAccountError);
$('togglePassword').onclick=()=>{
 const el=$('password'),visible=el.type==='text';
 el.type=visible?'password':'text';
 $('togglePassword').textContent=visible?'Mostrar':'Ocultar';
 $('togglePassword').setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha');
 $('togglePassword').setAttribute('aria-pressed',String(!visible));
 el.focus();
};
$('accountForm').addEventListener('submit',async e=>{e.preventDefault();
 const email=$('email').value.trim(),password=$('password').value;
 clearAccountError();
 if(!email)return showAccountError('Informe um e-mail válido.');
 if(!password)return showAccountError('Informe sua senha.');
 if(mode==='register'){
  const missing=passwordFailures(password);
  if(missing.length)return showAccountError('Para criar sua conta, a senha ainda precisa de: '+missing.map(r=>r.label).join(', ')+'.');
 }
 const btn=$('submitAccount');btn.disabled=true;
 try{
  let response;
  if(mode==='register'){
   response=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});
   if(!response?.access_token){
    mode='login';$('accountTitle').textContent='Entrar na minha conta';$('password').autocomplete='current-password';updatePasswordRequirements();
    return message('Confira seu e-mail para confirmar a conta, se solicitado. Se já possui cadastro, use “Já tenho conta”.');
   }
  }else{
   response=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
  }
  if(!response?.access_token)throw Error('Não foi possível autenticar sua conta.');
  rememberSession(response);
  await openEditorAfterAuth();
 }catch(e){showAccountError(e.message||'Não foi possível concluir o acesso. Tente novamente.')}finally{btn.disabled=false}
});
$('activate').onclick=async()=>{try{if(!jwt&&!(await restoreSession()))return message('Entre na sua conta.',true);await openEditorAfterAuth()}catch(e){message(e.message,true)}};
document.querySelectorAll('[data-key]').forEach(el=>el.addEventListener('input',()=>{data[el.dataset.key]=el.value;render()}));
$('buttonEditor').addEventListener('input',e=>{const i=Number(e.target.dataset.button),p=e.target.dataset.prop;if(!Number.isInteger(i)||!p)return;data.buttons[i][p]=e.target.value;render()});
$('buttonEditor').addEventListener('click',e=>{const i=e.target.dataset.remove;if(i===undefined)return;data.buttons.splice(Number(i),1);render()});
$('addButton').onclick=()=>{if(data.buttons.length>=12)return message('Máximo de 12 botões',true);data.buttons.push({title:'Novo botão',url:''});render()};
document.querySelectorAll('[data-v4-content]').forEach(el=>el.addEventListener('input',()=>{
 data.reviewV4??={};data.reviewV4.content??={};data.reviewV4.content[el.dataset.v4Content]=el.value;render();
}));
document.querySelectorAll('[data-v4-theme]').forEach(el=>el.addEventListener('input',()=>{
 data.reviewV4??={};data.reviewV4.theme??={};
 data.reviewV4.theme[el.dataset.v4Theme]=el.type==='range'?Number(el.value):el.value;render();
}));
for(const k of ['logo','cover'])$(k).onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 const input=e.target;input.disabled=true;message('Enviando a imagem para o Supabase...');
 try{data[k]=await uploadQrImage(file,k);render();message('Imagem armazenada. Clique em Salvar e publicar para atualizar a página.')}
 catch(error){message(error.message,true)}finally{input.disabled=false;input.value=''}
};
$('clearLogo').onclick=()=>{data.logo='';render();message('Logo removida da prévia. Salve para publicar a alteração.')};
$('clearPhoto').onclick=()=>{data.cover='';render();message('Foto removida da prévia. Salve para publicar a alteração.')};
for(const id of ['v4Frame','v4Preview'])$(id).addEventListener('load',()=>postV4(id));
for(const id of ['goV4Design','goV4DesignBottom'])$(id).onclick=()=>{$('v4Design').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};

let saving=false;
function saveFeedback(text,error=false){
 const status=$('saveStatus');status.textContent=text;status.className='message'+(error?'':' success');
 message(text,error);
 const smartStatus=$('sbStatus');
 if(smartStatus){smartStatus.textContent=text;smartStatus.style.color=error?'#a63855':'#22765f';smartStatus.scrollIntoView({block:'nearest',behavior:'smooth'});}
 else status.scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function savePage(){
 if(saving)return;
 if(!jwt||!owner)return saveFeedback('Entre com a conta do proprietário para salvar.',true);
 const button=$('save');saving=true;button.disabled=true;button.textContent='Salvando…';
 const quick=$('sbPublish');if(quick){quick.disabled=true;quick.textContent='Publicando…'}
 $('viewPublished').classList.add('hidden');
 let timer;
 try{
  const snapshot=JSON.parse(JSON.stringify(data));
  snapshot.name=String(snapshot.name||'').trim();
  snapshot.google=String(snapshot.google||'').trim();
  if(!snapshot.name)throw Error('Informe o nome do estabelecimento antes de publicar.');
  if(!snapshot.smart?.enabled&&snapshot.google&&!absoluteUrl(snapshot.google))throw Error('O link do Google está inválido. Corrija o endereço ou deixe o campo vazio.');
  const smartError=smartEditor?.validate(snapshot);if(smartError)throw Error(smartError);
  saveFeedback('Salvando e publicando sua página…');
  if(!(await restoreSession()))throw Error('Sua sessão expirou. Entre novamente para salvar. Suas alterações continuam nesta tela.');
  const controller=new AbortController();timer=setTimeout(()=>controller.abort(),20000);
  const result=await api('/rest/v1/rpc/willai_qr_save',{method:'POST',body:JSON.stringify({p_code:code,p_page:snapshot}),signal:controller.signal},jwt);
  if(result?.ok!==true)throw Error('O servidor não confirmou o salvamento. Tente novamente.');
  active=true;record={...(record||{}),status:'active',page:snapshot};
  $('publishedPreview').innerHTML=card(snapshot,true);
  $('viewPublished').href='/qr/'+encodeURIComponent(code);
  $('viewPublished').classList.remove('hidden');
  saveFeedback('Página salva e publicada com sucesso! O QR Code já abre sua página.');
 }catch(e){saveFeedback(e.name==='AbortError'?'A confirmação demorou mais que o esperado. Confira a página pública antes de tentar novamente.':e.message||'Não foi possível salvar. Tente novamente.',true)}
 finally{clearTimeout(timer);saving=false;button.disabled=false;button.textContent='Salvar e publicar';if(quick){quick.disabled=false;quick.textContent='Salvar e publicar'}}
}
$('save').onclick=savePage;
$('signOut').onclick=()=>{jwt=null;owner=false;try{localStorage.removeItem(sessionKey)}catch{};if(active){if(record?.status==='pending')show('pending');else show('public')}else show('start');message('Você saiu da sua conta.');};
$('approvalCheck').onclick=requestLogin;
updatePasswordRequirements();
window.WILLAI_QR_BOOTSTRAPPED=true;
boot();})();