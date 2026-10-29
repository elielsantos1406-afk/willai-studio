/* WillAI QR Premium – módulo de apresentação e personalização, sem dependências externas */
(function () {
  'use strict';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const hex = (v, fallback) => /^#[0-9a-f]{6}$/i.test(String(v || '')) ? v : fallback;
  const fonts = ['system-ui','Inter','Arial','Georgia','Verdana','Trebuchet MS','Tahoma'];
  const icons = ['whatsapp','instagram','globe','calendar','phone','map-pin','link','star'];
  const presets = {
    blue: {primary:'#19477e',background:'#f4f8ff',ink:'#183b60',cardColor:'#ffffff',buttonColor:'#204e82',buttonText:'#ffffff',starColor:'#e7af41',gradientType:'solid'},
    white: {primary:'#161e2d',background:'#ffffff',ink:'#172033',cardColor:'#ffffff',buttonColor:'#172033',buttonText:'#ffffff',starColor:'#dfad48',gradientType:'solid'},
    black: {primary:'#191a20',background:'#0d111a',ink:'#f6f7fb',cardColor:'#1b2230',buttonColor:'#eeeef4',buttonText:'#1b2230',starColor:'#f6ca65',gradientType:'solid'},
    green: {primary:'#126759',background:'#effbf5',ink:'#0b4d42',cardColor:'#ffffff',buttonColor:'#147d6a',buttonText:'#ffffff',starColor:'#dcae44',gradientType:'solid'},
    gradient: {primary:'#19529d',background:'#f1f6ff',ink:'#102d52',cardColor:'#ffffff',buttonColor:'#19529d',buttonText:'#ffffff',starColor:'#e9ad3c',gradientType:'linear',gradientColor1:'#e6f2ff',gradientColor2:'#fbf4fa',gradientColor3:'#dbe8fa',gradientAngle:135}
  };
  const initial = {
    premiumVersion:2,name:'Meu estabelecimento',category:'',description:'',
    title:'Deixe sua avaliação',subtitle:'Sua opinião é muito importante para nós.',
    google:'',whatsapp:'',instagram:'',logo:'',cover:'',backgroundImage:'',
    showName:true,showLogo:true,showCover:false,
    primary:'#19477e',background:'#f4f8ff',ink:'#183b60',cardColor:'#ffffff',
    buttonColor:'#204e82',buttonText:'#ffffff',starColor:'#e7af41',
    borderColor:'#e6ebf2',font:'system-ui',titleSize:30,textSize:15,
    radius:20,cardRadius:28,gap:12,buttonStyle:'solid',
    gradientType:'solid',gradientColor1:'#eaf4ff',gradientColor2:'#f9f4fa',
    gradientColor3:'#ffffff',gradientAngle:135,
    buttons:[{title:'WhatsApp',icon:'whatsapp',url:'',type:'whatsapp'},
      {title:'Instagram',icon:'instagram',url:'',type:'link'},
      {title:'Nosso Site',icon:'globe',url:'',type:'link'}]
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  function normalize(raw) {
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const next = Object.assign(clone(initial),raw);
    if (!Array.isArray(raw.buttons) || (!raw.premiumVersion && raw.buttons.length === 0)) {
      next.buttons = clone(initial.buttons);
      next.buttons[0].url = raw.whatsapp || '';
      next.buttons[1].url = raw.instagram || '';
    }
    next.buttons = next.buttons.slice(0,12).map(b => ({
      title:String(b && b.title || '').slice(0,60),icon:icons.includes(b && b.icon) ? b.icon : 'link',
      url:String(b && b.url || '').slice(0,2048),type:b && b.type === 'whatsapp' ? 'whatsapp' : 'link',
      style:['solid','outline','soft'].includes(b && b.style) ? b.style : '',
      color:b && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '',
      textColor:b && /^#[0-9a-f]{6}$/i.test(b.textColor) ? b.textColor : ''
    }));
    next.premiumVersion = 2;
    return next;
  }
  function validUrl(value) {
    try { const u = new URL(String(value || '').trim()); return ['https:','http:'].includes(u.protocol) && !!u.hostname && !u.username && !u.password ? u.href : ''; }
    catch { return ''; }
  }
  function validGoogle(value) {
    const href=validUrl(value); if (!href) return '';
    const host = new URL(href).hostname.toLowerCase();
    return (host === 'g.page' || host === 'maps.app.goo.gl' || host === 'goo.gl' ||
      host === 'google.com' || host.endsWith('.google.com') || host === 'google.com.br' ||
      host.endsWith('.google.com.br')) ? href : '';
  }
  function whatsapp(value) {
    const raw=String(value || '').trim();
    if (raw.startsWith('https://wa.me/')) return validUrl(raw);
    let digits = raw.replace(/\D/g,'');
    if ((digits.length === 10 || digits.length === 11)) digits='55'+digits;
    return /^55\d{10,11}$/.test(digits) ? 'https://wa.me/'+digits : '';
  }
  function buttonLink(b) { return b.type === 'whatsapp' ? whatsapp(b.url) : validUrl(b.url); }
  function background(d) {
    if (d.backgroundImage && /^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(d.backgroundImage)) return 'url("'+String(d.backgroundImage).replace(/["\\\n\r]/g,'')+'") center / cover fixed';
    const a=hex(d.gradientColor1,'#eaf4ff'),b=hex(d.gradientColor2,'#f9f4fa'),c=hex(d.gradientColor3,'#ffffff');
    const degree=Math.max(0,Math.min(360,Number(d.gradientAngle)||0));
    if (d.gradientType==='linear') return 'linear-gradient('+degree+'deg,'+a+','+b+','+c+')';
    if (d.gradientType==='radial') return 'radial-gradient(circle at top,'+a+','+b+','+c+')';
    return hex(d.background,'#f4f8ff');
  }
  const glyphs={
    whatsapp:'<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.1 8.5c.2 3 2.5 5.4 5.6 6.2l1.8-1.3"/>',
    instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.4 6.6h.01"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    phone:'<path d="m5 3 4 4-2 3a15 15 0 0 0 7 7l3-2 4 4c-2 3-5 3-8 2A19 19 0 0 1 3 11C2 8 2 5 5 3Z"/>',
    'map-pin':'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    link:'<path d="M10 13a5 5 0 0 0 7 .2l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.2l-3 3a5 5 0 1 0 7 7l2-2"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>'
  };
  function icon(name) {return '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(glyphs[name]||glyphs.link)+'</svg>';}
  function card(raw,publicMode) {
    const d=normalize(raw);
    const backgroundStyle=background(d);
    const font=fonts.includes(d.font) ? d.font : 'system-ui';
    const radius=Math.max(6,Math.min(40,Number(d.radius)||20));
    const cardRadius=Math.max(8,Math.min(44,Number(d.cardRadius)||28));
    const titleSize=Math.max(20,Math.min(52,Number(d.titleSize)||30));
    const textSize=Math.max(12,Math.min(22,Number(d.textSize)||15));
    const gap=Math.max(5,Math.min(28,Number(d.gap)||12));
    const style='--qr-bg:'+backgroundStyle+';--qr-ink:'+hex(d.ink,'#183b60')+';--qr-card:'+hex(d.cardColor,'#ffffff')+
      ';--qr-accent:'+hex(d.primary,'#19477e')+';--qr-star:'+hex(d.starColor,'#e7af41')+
      ';--qr-border:'+hex(d.borderColor,'#e6ebf2')+';--qr-radius:'+radius+'px;--qr-card-radius:'+cardRadius+
      'px;--qr-font:'+esc(font)+';--qr-title:'+titleSize+'px;--qr-text:'+textSize+'px;--qr-gap:'+gap+'px';
    const logo=(d.showLogo!==false && d.logo) ? '<img class="qr-logo" src="'+esc(d.logo)+'" alt="Logotipo de '+esc(d.name)+'" loading="eager">' : '';
    const name=(d.showName!==false && d.name) ? '<div class="qr-name">'+esc(d.name)+'</div>' : '';
    const cover=(d.showCover && d.cover) ? '<img class="qr-cover" src="'+esc(d.cover)+'" alt="" loading="lazy">' : '';
    const google=validGoogle(d.google);
    const stars=Array.from({length:5},(_,i)=>google?
      '<a class="qr-star" href="'+esc(google)+'" aria-label="Avaliar no Google, estrela '+(i+1)+'" rel="noopener noreferrer">'+icon('star')+'</a>':
      '<span class="qr-star qr-star-disabled" aria-label="Avaliação ainda não configurada">'+icon('star')+'</span>').join('');
    const links=d.buttons.filter(b=>b.title.trim() && buttonLink(b)).map(b=>{
      const color=hex(b.color,hex(d.buttonColor,'#204e82'));
      const label=hex(b.textColor,hex(d.buttonText,'#ffffff'));
      const styleType=b.style||d.buttonStyle;
      return '<a class="qr-action '+(['outline','soft'].includes(styleType)?styleType:'solid')+'" href="'+esc(buttonLink(b))+'" target="_blank" rel="noopener noreferrer" style="--qr-button:'+color+';--qr-button-text:'+label+'" aria-label="'+esc(b.title)+'">'+icon(b.icon)+'<span>'+esc(b.title)+'</span></a>';
    }).join('');
    return '<main class="qr-premium-surface '+(publicMode?'qr-live':'qr-demo')+'" style="'+style+'">'+
      '<div class="qr-premium-main"><section class="qr-premium-card">'+cover+
      '<div class="qr-brand">'+logo+name+'</div>'+
      '<h1>'+esc(d.title||'Deixe sua avaliação')+'</h1>'+
      (d.subtitle?'<p class="qr-subtitle">'+esc(d.subtitle)+'</p>':'')+
      '<div class="qr-google"><span class="qr-google-label">GOOGLE</span><div class="qr-stars" role="group" aria-label="Avaliar no Google">'+stars+'</div></div>'+
      (links?'<nav class="qr-actions" aria-label="Links do estabelecimento">'+links+'</nav>':'')+
      '<footer class="qr-footer"><div class="qr-footer-divider"></div><span>Criado por <strong>WILLAI</strong> by ELIX SOLUTIONS</span>'+
      (publicMode?'<button type="button" class="qr-login" id="ownerLoginPremium">Login</button>':'')+
      '</footer></section></div></main>';
  }
  function field(label,key,opts) {
    opts=opts||{};
    const typ=opts.type||'text';
    const attr=typ==='color'?'type="color"':typ==='number'?'type="number" min="'+(opts.min||0)+'" max="'+(opts.max||360)+'"':'type="'+typ+'"';
    return '<label class="qr-setting">'+esc(label)+'<input '+attr+' data-key="'+esc(key)+'" '+(opts.placeholder?'placeholder="'+esc(opts.placeholder)+'"':'')+'></label>';
  }
  function select(label,key,options) {
    return '<label class="qr-setting">'+esc(label)+'<select data-key="'+esc(key)+'">'+options.map(o=>'<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>').join('')+'</select></label>';
  }
  function section(title,content) {return '<section class="panel qr-editor-panel"><h2>'+title+'</h2>'+content+'</section>';}
  function editorHTML() {
    const profile=field('Nome do estabelecimento','name')+field('Título principal','title')+field('Subtítulo (opcional)','subtitle')+
      '<div class="qr-settings-grid">'+select('Mostrar nome','showName',[['true','Sim'],['false','Não']])+select('Mostrar logotipo','showLogo',[['true','Sim'],['false','Não']]])+'</div>';
    const google=field('Link direto de avaliação no Google','google',{type:'url',placeholder:'https://g.page/r/.../review'})+
      '<p class="hint">As 5 estrelas abrem este mesmo endereço, sem formulário ou seleção de notas.</p><p class="qr-field-help" id="googleStatus"></p>';
    const links='<p class="hint">Personalize o texto de cada botão. Para Agendar, escolha o título “Agendar” e cole o WhatsApp ou endereço da agenda.</p>'+
      '<div id="buttonEditor"></div><button class="btn" id="addButton" type="button">+ Adicionar botão</button>';
    const colors='<div class="qr-themes" id="qrThemes"><button type="button" data-theme="blue">Azul Elegante</button><button type="button" data-theme="white">Branco</button><button type="button" data-theme="black">Preto Premium</button><button type="button" data-theme="green">Verde Moderno</button><button type="button" data-theme="gradient">Degradê</button></div>'+
      '<div class="qr-settings-grid">'+
      field('Principal','primary',{type:'color'})+field('Fundo','background',{type:'color'})+
      field('Texto','ink',{type:'color'})+field('Cartão','cardColor',{type:'color'})+
      field('Botões','buttonColor',{type:'color'})+field('Texto dos botões','buttonText',{type:'color'})+
      field('Estrelas','starColor',{type:'color'})+field('Bordas','borderColor',{type:'color'})+
      select('Fundo','gradientType',[['solid','Cor sólida'],['linear','Degradê linear'],['radial','Degradê radial']])+
      field('Degradê 1','gradientColor1',{type:'color'})+field('Degradê 2','gradientColor2',{type:'color'})+field('Degradê 3','gradientColor3',{type:'color'})+
      field('Ângulo do degradê','gradientAngle',{type:'number',min:0,max:360})+
      select('Fonte','font',fonts.map(f=>[f,f]))+
      select('Botões','buttonStyle',[['solid','Sólido'],['outline','Contornado'],['soft','Suave']])+
      field('Título (px)','titleSize',{type:'number',min:20,max:52})+
      field('Textos (px)','textSize',{type:'number',min:12,max:22})+
      field('Arredondamento dos botões','radius',{type:'number',min:6,max:40})+
      field('Arredondamento do cartão','cardRadius',{type:'number',min:8,max:44})+
      field('Espaçamento','gap',{type:'number',min:5,max:28})+
      '</div>';
    const images='<p class="hint">Fotos são comprimidas automaticamente para carregar rapidamente no celular.</p>'+
      '<label class="qr-setting">Foto / logotipo<input id="logo" type="file" accept="image/png,image/jpeg,image/webp"></label>'+
      '<button class="btn qr-remove-image" type="button" data-clear-image="logo">Remover foto</button>'+
      '<label class="qr-setting">Capa (opcional)<input id="cover" type="file" accept="image/png,image/jpeg,image/webp"></label>'+
      '<button class="btn qr-remove-image" type="button" data-clear-image="cover">Remover capa</button>'+
      select('Exibir capa','showCover',[['false','Não'],['true','Sim']]])+
      '<label class="qr-setting">Imagem de fundo (opcional)<input id="backgroundFile" type="file" accept="image/png,image/jpeg,image/webp"></label>'+
      '<button class="btn qr-remove-image" type="button" data-clear-image="backgroundImage">Remover fundo</button>';
    return section('Minha empresa',profile)+section('Avaliações Google',google)+section('Meus botões',links)+section('Cores e aparência',colors)+section('Imagens',images);
  }
  function mountEditor(editor) {
    const left=editor.firstElementChild;
    left.innerHTML=editorHTML()+'<div class="buttons qr-publish-actions"><button id="save" class="btn primary" type="button">Salvar e publicar</button><button id="signOut" class="btn" type="button">Sair da conta</button></div>';
    editor.classList.add('qr-editor-premium');
  }
  function fill(raw) {
    const d=normalize(raw);
    document.querySelectorAll('#editor [data-key]').forEach(el=>{const val=d[el.dataset.key];el.value=String(val===undefined?'':val);});
    const status=document.getElementById('googleStatus');
    if(status) status.textContent=validGoogle(d.google)?'✓ Link de avaliação configurado.':'Adicione o endereço real de avaliação do Google para publicar.';
  }
  function editorButtons(raw) {
    const d=normalize(raw);
    return d.buttons.map((b,i)=>'<div class="qr-button-row" draggable="true" data-row="'+i+'"><div class="qr-row-title"><b>Botão '+(i+1)+'</b><div><button type="button" class="qr-small" data-move="'+i+'" data-direction="-1" aria-label="Mover para cima">↑</button><button type="button" class="qr-small" data-move="'+i+'" data-direction="1" aria-label="Mover para baixo">↓</button><button type="button" class="qr-small qr-danger" data-remove="'+i+'" aria-label="Excluir botão">Excluir</button></div></div>'+
      '<div class="qr-settings-grid"><label class="qr-setting">Nome<input data-button="'+i+'" data-prop="title" maxlength="60" value="'+esc(b.title)+'" placeholder="Ex.: Agendar horário"></label>'+
      '<label class="qr-setting">Destino<select data-button="'+i+'" data-prop="type"><option value="link" '+(b.type==='link'?'selected':'')+'>Site / Instagram / URL</option><option value="whatsapp" '+(b.type==='whatsapp'?'selected':'')+'>WhatsApp</option></select></label></div>'+
      '<label class="qr-setting">Link ou telefone<input data-button="'+i+'" data-prop="url" value="'+esc(b.url)+'" placeholder="https://... ou número com DDD"></label>'+
      '<div class="qr-settings-grid"><label class="qr-setting">Ícone<select data-button="'+i+'" data-prop="icon">'+icons.map(g=>'<option value="'+g+'" '+(b.icon===g?'selected':'')+'>'+g+'</option>').join('')+'</select></label>'+
      '<label class="qr-setting">Estilo<select data-button="'+i+'" data-prop="style"><option value="">Usar padrão</option><option value="solid" '+(b.style==='solid'?'selected':'')+'>Sólido</option><option value="outline" '+(b.style==='outline'?'selected':'')+'>Contornado</option><option value="soft" '+(b.style==='soft'?'selected':'')+'>Suave</option></select></label></div>'+
      '<div class="qr-settings-grid"><label class="qr-setting">Cor (opcional)<input type="color" data-button="'+i+'" data-prop="color" value="'+hex(b.color,hex(d.buttonColor,'#204e82'))+'"></label>'+
      '<label class="qr-setting">Cor do texto<input type="color" data-button="'+i+'" data-prop="textColor" value="'+hex(b.textColor,hex(d.buttonText,'#ffffff'))+'"></label></div></div>').join('');
  }
  function validate(raw) {
    const d=normalize(raw);
    if(!validGoogle(d.google))return 'Preencha um link válido do Google para receber avaliações.';
    for (let i=0;i<d.buttons.length;i++) {
      const b=d.buttons[i];
      if (b.url && !buttonLink(b)) return 'Confira o endereço do botão '+(i+1)+' ('+(b.title||'sem nome')+').';
    }
    if(JSON.stringify(d).length>700000) return 'As imagens ficaram muito grandes. Escolha imagens menores.';
    return '';
  }
  function image(file,dimension) {
    return new Promise((resolve,reject)=>{
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type))return reject(Error('Escolha uma foto PNG, JPG ou WebP.'));
      if (file.size>8*1024*1024)return reject(Error('A imagem deve ter até 8 MB.'));
      const object=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{
        try {
          const size=Math.min(1,dimension/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(img.naturalWidth*size));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*size));
          canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
          let encoded='',quality=.78;
          for (let k=0;k<5;k++) {encoded=canvas.toDataURL('image/webp',quality);if(encoded.length<220000)break;quality-=.13;}
          if(encoded.length>310000)throw Error('A imagem continua grande. Escolha outra imagem.');
          resolve(encoded);
        }catch(e){reject(e)}finally{URL.revokeObjectURL(object)}
      };
      img.onerror=()=>{URL.revokeObjectURL(object);reject(Error('Não foi possível abrir esta imagem.'))};
      img.src=object;
    });
  }
  window.WILLAI_QR_PREMIUM = {initial:()=>clone(initial),normalize,card,mountEditor,fill,editorButtons,validate,image,presets,validGoogle};
})();