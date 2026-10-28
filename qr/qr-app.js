(()=>{'use strict';const cfg=window.WILLAI_CONFIG||{},code=(location.pathname.split('/').filter(Boolean).pop()||'').toUpperCase();const base=cfg.url,key=cfg.publishableKey;const $=id=>document.getElementById(id),pages=['unavailable','start','account','claim','editor','public','pending','approval'];let jwt=null,owner=false,mode='register',active=false,record=null;const activationToken=/^[a-f0-9]{48}$/.test(new URLSearchParams(location.hash.slice(1)).get('ativar')||'')?new URLSearchParams(location.hash.slice(1)).get('ativar'):null;
let data={name:'Meu estabelecimento',category:'',description:'Conheça nossos serviços.',address:'',hours:'',google:'',whatsapp:'',instagram:'',primary:'#14559e',background:'#eff8ff',ink:'#163c61',font:'system-ui',layout:'rounded',logo:'',cover:'',buttons:[]};
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
 if(registering){pass.minLength=8;pass.setAttribute('aria-describedby','passwordRequirements')}
 else{pass.removeAttribute('minlength');pass.removeAttribute('aria-describedby')}
 for(const rule of PASSWORD_RULES){
  const el=$(rule.id),matched=rule.test(pass.value);
  el.classList.toggle('met',matched);
  el.setAttribute('aria-label',(matched?'Atendido: ':'Pendente: ')+el.textContent);
 }
}

function show(p){for(const id of pages)$(id).classList.toggle('hidden',id!==p)}
async function api(path,opts={},token){const res=await fetch(base+path,{...opts,cache:'no-store',headers:{apikey:key,Accept:'application/json','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(opts.headers||{})}});let b=null;try{b=await res.json()}catch{}if(!res.ok)throw Error(b?.message||b?.error_description||'Erro HTTP '+res.status);return b}
async function rpc(name,args={},token){return api('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)},token)}
const sessionKey='willai_qr_owner_auth'; // Apenas tokens de sessao; paginas e proprietarios ficam no Supabase.
function rememberSession(s){if(!s?.access_token)return;jwt=s.access_token;try{localStorage.setItem(sessionKey,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600)}))}catch{}}
async function restoreSession(){
 let s;try{s=JSON.parse(localStorage.getItem(sessionKey)||'null')}catch{return false}
 if(!s?.access_token)return false;
 if(s.expires_at&&s.expires_at<Math.floor(Date.now()/1000)+90){
  if(!s.refresh_token)return false;
  try{s=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});rememberSession(s)}catch{try{localStorage.removeItem(sessionKey)}catch{};return false}
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
  if(!activationToken){
    await rpc('willai_qr_request_claim',{p_code:code},jwt);
    show('approval');
    message('Pedido registrado. A WillAI precisa confirmar a entrega antes de autorizar sua conta.');
    return;
  }
  await rpc('willai_qr_claim',{p_code:code,p_secret:activationToken,p_page:data},jwt);
  active=true;owner=true;history.replaceState(null,'',location.pathname+location.search);fill();show('editor');
  message('Plaquinha ativada na sua conta. Personalize e publique sua página!');
 }
}

function link(k){return k==='whatsapp'&&data.whatsapp?'https://wa.me/'+data.whatsapp.replace(/\D/g,''):url(data[k])}
function card(d,interactive=false){let main=url(d.google),corner=d.layout==='pill'?'28px':d.layout==='square'?'8px':'16px';return '<div style="background:'+esc(d.background)+';color:'+esc(d.ink)+';font-family:'+esc(d.font)+';min-height:540px;text-align:center;padding-bottom:24px"><div style="height:120px;background:'+esc(d.primary)+' '+(d.cover?'url('+JSON.stringify(d.cover)+') center/cover':'')+'"></div><div style="height:78px;width:78px;border-radius:22px;background:white;margin:-37px auto 12px;position:relative;display:grid;place-items:center;overflow:hidden;border:3px solid '+esc(d.background)+'">'+(d.logo?'<img alt="Logo" src="'+esc(d.logo)+'" style="width:100%;height:100%;object-fit:contain">':'✦')+'</div><div style="padding:0 18px"><h2 style="font-size:23px;margin:9px 0">'+esc(d.name)+'</h2><p style="font-size:12px;opacity:.7">'+esc(d.category)+'</p><p style="line-height:1.5;font-size:13px">'+esc(d.description)+'</p>'+((d.google&&main!=='#')?'<a target="_blank" rel="noopener noreferrer" href="'+esc(main)+'" style="display:block;background:'+esc(d.primary)+';color:#fff;padding:14px;border-radius:'+corner+';text-decoration:none;font-weight:750;margin:11px 0">★ Avaliar no Google</a>':'')+['instagram','whatsapp'].filter(x=>d[x]).map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(x==='whatsapp'?'https://wa.me/'+String(d.whatsapp).replace(/\D/g,''):url(d[x]))+'" style="display:block;background:white;border:1px solid #dbe5ee;color:'+esc(d.ink)+';padding:13px;text-decoration:none;border-radius:'+corner+';margin:8px 0">'+(x==='instagram'?'Instagram':'WhatsApp')+'</a>').join('')+(d.buttons||[]).filter(x=>x.title&&url(x.url)!=='#').map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(url(x.url))+'" style="display:block;background:white;color:'+esc(d.ink)+';padding:13px;border-radius:'+corner+';margin:8px 0;text-decoration:none">'+esc(x.title)+'</a>').join('')+'<p style="font-size:11px;opacity:.7;line-height:1.5">'+esc(d.address)+'<br>'+esc(d.hours)+'</p><p style="font-size:10px;opacity:.5;margin-top:20px">WillAI • Tecnologia & Soluções Digitais</p></div></div>'}
function render(){ $('preview').innerHTML=card(data);$('buttonEditor').innerHTML=(data.buttons||[]).map((b,i)=>'<div class="field"><label>Botão '+(i+1)+'</label><div class="buttonline"><input data-button="'+i+'" data-prop="title" placeholder="Texto" value="'+esc(b.title)+'"><input data-button="'+i+'" data-prop="url" placeholder="https://..." value="'+esc(b.url)+'"><button class="btn danger" data-remove="'+i+'">×</button></div></div>').join('')}
function fill(){document.querySelectorAll('[data-key]').forEach(el=>{el.value=data[el.dataset.key]??''});$('editorLink').textContent='Endereço permanente: willai.com.br/qr/'+code;render()}
async function boot(){if(!/^W[0-9]{3,8}$/.test(code)){message('Código inválido',true);return show('unavailable')} $('title').textContent='Plaquinha '+code;if(!base||!key){message('Configuração do sistema incompleta',true);return show('unavailable')}try{const res=await rpc('willai_qr_public',{p_code:code});record=res;if(!res){message('Esta plaquinha ainda não foi registrada.',true);return show('unavailable')}if(res.status==='redirect'){try{const target=new URL(res.redirect_url);if(!['http:','https:'].includes(target.protocol))throw Error('Redirecionamento inválido');location.replace(target.href);return}catch(e){message('O link vinculado está inválido. Entre em contato com a WillAI.',true);show('unavailable');return}}if(res.status==='active'){data={...data,...res.page};active=true;$('publishedPreview').innerHTML=card(data,true);message('Página publicada • link permanente');show('public')}else if(res.status==='pending'){active=true;message('Página em preparação. Somente o proprietário pode entrar e publicar.');show('pending')}else if(res.status==='available'){message(activationToken?'Plaquinha liberada para ativação':'Plaquinha liberada. Faça seu cadastro para solicitar a ativação segura.');show('start')}else{message('Esta plaquinha ainda não foi liberada para entrega ou está indisponível.',true);show('unavailable')}}catch(e){message('O módulo de plaquinhas ainda está aguardando a configuração segura do banco. Nenhuma ativação foi realizada.',true);show('unavailable')}}

$('showRegister').onclick=()=>{mode='register';$('accountTitle').textContent='Criar minha conta';$('password').autocomplete='new-password';show('account')};
async function requestLogin(){
 try{if(await restoreSession()){await openEditorAfterAuth();return}}catch(e){message(e.message,true)}
 mode='login';$('accountTitle').textContent='Entrar na minha conta';$('password').autocomplete='current-password';show('account');
}
$('showLogin').onclick=$('ownerLogin').onclick=$('pendingLogin').onclick=requestLogin;
$('cancelAccount').onclick=()=>show(record?.status==='pending'?'pending':active?'public':'start');
$('accountForm').addEventListener('submit',async e=>{e.preventDefault();
 const email=$('email').value.trim(),password=$('password').value;
 if(!email||password.length<8)return message('Informe um e-mail e uma senha com pelo menos 8 caracteres.',true);
 const btn=$('submitAccount');btn.disabled=true;
 try{
  let response;
  if(mode==='register'){
   response=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});
   if(!response?.access_token){
    mode='login';$('accountTitle').textContent='Entrar na minha conta';$('password').autocomplete='current-password';
    return message('Conta criada. Confirme o e-mail, se o Supabase solicitar, e depois entre com sua senha.');
   }
  }else{
   response=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
  }
  if(!response?.access_token)throw Error('Não foi possível autenticar sua conta.');
  rememberSession(response);
  await openEditorAfterAuth();
 }catch(e){message(e.message,true)}finally{btn.disabled=false}
});
$('activate').onclick=async()=>{try{if(!jwt&&!(await restoreSession()))return message('Entre na sua conta.',true);await openEditorAfterAuth()}catch(e){message(e.message,true)}};
document.querySelectorAll('[data-key]').forEach(el=>el.addEventListener('input',()=>{data[el.dataset.key]=el.value;render()}));
$('buttonEditor').addEventListener('input',e=>{const i=Number(e.target.dataset.button),p=e.target.dataset.prop;if(!Number.isInteger(i)||!p)return;data.buttons[i][p]=e.target.value;$('preview').innerHTML=card(data)});
$('buttonEditor').addEventListener('click',e=>{const i=e.target.dataset.remove;if(i===undefined)return;data.buttons.splice(Number(i),1);render()});
$('addButton').onclick=()=>{if(data.buttons.length>=12)return message('Máximo de 12 botões',true);data.buttons.push({title:'Novo botão',url:''});render()};
for(const k of ['logo','cover'])$(k).onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>250000) return message('Use imagem PNG/JPG/WebP de até 250 KB nesta etapa. Otimização e armazenamento de imagens serão conectados depois.',true);const r=new FileReader;r.onload=()=>{data[k]=r.result;render()};r.readAsDataURL(file)};
$('save').onclick=async()=>{if(!jwt||!owner)return message('Login do proprietário necessário',true);try{await rpc('willai_qr_save',{p_code:code,p_page:data},jwt);$('publishedPreview').innerHTML=card(data,true);message('Página salva no Supabase e publicada com sucesso!');show('public')}catch(e){message(e.message,true)}};
$('signOut').onclick=()=>{jwt=null;owner=false;try{localStorage.removeItem(sessionKey)}catch{};if(active){if(record?.status==='pending'){show('pending')}else{$('publishedPreview').innerHTML=card(data,true);show('public')}}else show('start');message('Você saiu da sua conta.');};
$('approvalCheck').onclick=async()=>{
 const button=$('approvalCheck');button.disabled=true;
 try{
  if(!jwt && !(await restoreSession()))return message('Entre na sua conta para conferir a aprovação.',true);
  const own=await rpc('willai_qr_owned',{p_code:code},jwt);
  if(!own)return message('Sua solicitação continua aguardando conferência da WillAI.');
  data={...data,...own.page};active=true;owner=true;fill();show('editor');message('Entrega aprovada! Personalize e publique sua página.');
 }catch(e){message(e.message,true)}finally{button.disabled=false}
};
window.WILLAI_QR_BOOTSTRAPPED=true;
boot();})();