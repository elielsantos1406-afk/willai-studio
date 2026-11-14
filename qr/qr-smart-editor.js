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