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
   data.smart={enabled:true,style:'clean',color:'#185c88',colorText:'light',background:'',category:String(data.category||''),description:String(data.description||''),pixKey:'',pixPayload:'',buttons:buttons.slice(0,24)};
  }else{
   data.smart.enabled=true;
   data.smart.buttons=Array.isArray(data.smart.buttons)?data.smart.buttons.slice(0,24):[];
   if(!['clean','glass','editorial'].includes(data.smart.style))data.smart.style='clean';
   if(!validHex(data.smart.color))data.smart.color='#185c88';
  }
 }
 function html(){
  return '<h2>Personalize sua plaquinha</h2><p class="sb-lead">Escolha um modelo, adicione seus botões e publique. O QR Code impresso continua o mesmo.</p>'+
  '<nav class="sb-tabs" aria-label="Etapas de personalização">'+[['business','Negócio'],['design','Visual'],['buttons','Botões'],['plaques','Plaquinhas']].map(([k,t])=>'<button type="button" data-sb-tab="'+k+'" aria-current="'+(k==='business'?'step':'false')+'">'+t+'</button>').join('')+'</nav>'+ 
  '<section class="sb-section is-active" data-sb-step="business"><h3>1. Seu negócio</h3>'+
  '<label class="sb-field">Nome do estabelecimento<input data-sb-key="name" maxlength="95" placeholder="Como seu negócio se chama?" required></label>'+
  '<label class="sb-field">O que você faz?<input data-sb-key="category" maxlength="75" placeholder="Ex.: Estética, Restaurante, Loja"></label>'+
  '<label class="sb-field">Descrição curta<textarea data-sb-key="description" maxlength="360" rows="2" placeholder="Uma frase sobre seu negócio"></textarea></label>'+
  '<div class="sb-two"><label class="sb-field">Seu logotipo<input id="sbLogoUpload" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG ou WebP até 5MB</small></label>'+
  '<label class="sb-field">Foto opcional<input id="sbCoverUpload" type="file" accept="image/png,image/jpeg,image/webp"><small>Foto do estabelecimento</small></label></div>'+
  '<div class="sb-upload"><button type="button" class="sb-soft-button" data-sb-clear="logo">Remover logo</button><button type="button" class="sb-soft-button" data-sb-clear="cover">Remover foto</button></div></section>'+
  '<section class="sb-section" data-sb-step="design"><h3>2. Escolha seu design</h3>'+
  '<div class="sb-designs" role="group" aria-label="Modelos visuais">'+
  [['clean','Essencial'],['glass','Elegante'],['editorial','Destaque']].map(([val,label])=>'<button class="sb-design" type="button" data-sb-style="'+val+'" aria-pressed="false"><span class="sb-design__mini sb-design__mini--'+val+'"><i></i><i></i></span><strong>'+label+'</strong></button>').join('')+
  '</div><p class="sb-hint">Troque o modelo quando quiser. O conteúdo permanece salvo.</p>'+
  '<div class="sb-palette" role="group" aria-label="Cores rápidas">'+['#185c88','#10857d','#b23c73','#704aab','#a26c44','#253f56','#131d2d'].map(x=>'<button type="button" data-sb-palette="'+x+'" style="background:'+x+'" class="sb-color-choice" aria-label="Escolher cor '+x+'" aria-pressed="false"></button>').join('')+'</div>'+
  '<div class="sb-two"><label class="sb-color-custom">Cor personalizada<input type="color" id="sbAccentColor"></label><label class="sb-color-custom">Fundo personalizado<input type="color" id="sbBackgroundColor"></label></div>'+
  '<button type="button" class="sb-soft-button" id="sbResetBackground">Usar fundo original do modelo</button></section>'+
  '<section class="sb-section" data-sb-step="buttons"><h3>3. Seus botões</h3><p class="sb-hint">Os botões são exibidos na ordem abaixo. Você escolhe os nomes e destinos, sem ícones ou setas.</p>'+
  '<div id="sbButtons"></div><div class="sb-add-row"><select id="sbAddType" aria-label="Tipo de botão">'+presets.map((v,i)=>'<option value="'+i+'">'+esc(v[1])+'</option>').join('')+'</select><button type="button" id="sbAddButton">Adicionar botão</button></div>'+
  '<div id="sbPixConfig" hidden><div class="sb-section"><h3>Dados do Pix</h3>'+
  '<label class="sb-field">Chave Pix<input id="sbPixKey" maxlength="180" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"></label>'+
  '<label class="sb-field">Pix Copia e Cola (opcional)<textarea id="sbPixPayload" maxlength="800" rows="3" placeholder="Cole aqui o código Pix completo, se tiver"><\/textarea><small>Com um código completo, o botão copia o Pix Copia e Cola. Sem ele, copia a chave cadastrada. A WillAI não confirma pagamentos automaticamente.</small></label></div></div></section>'+
  '<section class="sb-section" data-sb-step="plaques"><h3>4. Minhas plaquinhas</h3><p class="sb-hint">Uma conta pode administrar várias plaquinhas, mantendo o endereço exclusivo de cada uma.</p>'+
  '<div id="sbOwnedList" class="sb-owned-list"></div><div class="sb-add-plate"><input id="sbNewCode" placeholder="W002" maxlength="9" aria-label="Código de outra plaquinha"><button type="button" id="sbAddPlate">Adicionar outra</button></div>'+
  '<p class="sb-hint" id="sbOwnedMessage" role="status">Carregando minhas plaquinhas…</p></section>'+
  '<section class="sb-advanced"><button id="sbAdvanced" type="button">Abrir editor clássico</button></section>'+
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
  const accent=document.getElementById('sbAccentColor'),bg=document.getElementById('sbBackgroundColor');
  accent.value=smart.color||'#185c88';bg.value=validHex(smart.background)?smart.background:smart.style==='glass'?'#0b1b30':smart.style==='editorial'?'#fbf6ef':'#f8fafc';
  document.querySelectorAll('#smartBuilder [data-sb-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sbStyle===smart.style)));
  document.querySelectorAll('#smartBuilder [data-sb-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sbPalette?.toLowerCase()===String(smart.color).toLowerCase())));
  document.getElementById('sbPixKey').value=smart.pixKey||'';
  document.getElementById('sbPixPayload').value=smart.pixPayload||'';
  renderButtons();
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
    if(target.id==='sbAccentColor'){data.smart.color=target.value;data.smart.colorText=contrast(target.value);refresh();box.querySelectorAll('[data-sb-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sbPalette===target.value)))}
    if(target.id==='sbBackgroundColor'){data.smart.background=target.value;refresh()}
   });
   box.addEventListener('click',async e=>{
    const target=e.target.closest('button');if(!target)return;
    if(target.dataset.sbTab){box.querySelectorAll('[data-sb-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.sbTab===target.dataset.sbTab?'step':'false'));box.querySelectorAll('[data-sb-step]').forEach(sec=>sec.classList.toggle('is-active',sec.dataset.sbStep===target.dataset.sbTab));return}
    if(target.id==='sbPreview'){document.getElementById('v4Preview')?.scrollIntoView({behavior:'smooth',block:'center'});return}
    if(target.id==='sbPublish'){document.getElementById('save')?.click();return}
    if(target.dataset.sbStyle){data.smart.style=target.dataset.sbStyle;data.smart.background='';syncFields();refresh();return}
    if(target.dataset.sbPalette){data.smart.color=target.dataset.sbPalette;data.smart.colorText=contrast(data.smart.color);syncFields();refresh();return}
    if(target.id==='sbResetBackground'){data.smart.background='';syncFields();refresh();return}
    if(target.id==='sbAddButton'){
     if(data.smart.buttons.length>=24)return updateStatus('Limite de 24 botões por página.',true);
     const i=Number(document.getElementById('sbAddType').value),p=presets[i];if(!p)return;
     const type=p[0],value=['google','whatsapp','instagram','site'].includes(type)?String(data[type]||''):'';
     data.smart.buttons.push({type,label:p[1],value});
     renderButtons();refresh();updateStatus('Botão adicionado. Preencha o destino, se necessário.');return;
    }
    if(target.dataset.sbRemove!==undefined){data.smart.buttons.splice(Number(target.dataset.sbRemove),1);renderButtons();refresh();return}
    if(target.dataset.sbMove!==undefined){
     const i=Number(target.dataset.sbIndex),j=i+Number(target.dataset.sbMove);
     if(i>=0&&j>=0&&j<data.smart.buttons.length){const b=data.smart.buttons.splice(i,1)[0];data.smart.buttons.splice(j,0,b);renderButtons();refresh()}return
    }
    if(target.dataset.sbClear){const kind=target.dataset.sbClear;data[kind]='';refresh();updateStatus('Imagem removida da prévia. Publique para atualizar.');return}
    if(target.id==='sbAdvanced'){const open=ed.classList.toggle('qr-smart-advanced');target.textContent=open?'Fechar editor clássico':'Abrir editor clássico';return}
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
  updateStatus('Sua página antiga só será substituída quando você clicar em Salvar e publicar.');
  Promise.resolve(host.owned()).then(rows=>renderOwned(rows)).catch(()=>renderOwned(null));
 }
 function renderOwned(rows){
  const holder=document.getElementById('sbOwnedList'),notice=document.getElementById('sbOwnedMessage');
  if(!holder||!notice)return;
  if(!Array.isArray(rows)){holder.innerHTML='';notice.textContent='Você ainda pode adicionar uma plaquinha pelo código acima.';return}
  holder.innerHTML=rows.map(x=>'<div class="sb-owned"><div><strong>'+esc(x.code)+'</strong><small>'+esc(x.name||'Minha plaquinha')+'</small></div><a href="/qr/'+encodeURIComponent(x.code)+'">Editar</a></div>').join('');
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