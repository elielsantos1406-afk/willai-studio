
/* Campanha Beleza: salva em willai_quote_requests antes de abrir WhatsApp. */
(()=>{'use strict';
 const PHONE='5522997332202';
 const SHORT_MESSAGE='Olá! Vi a promoção de Site + Agenda para profissionais da beleza no site da WillAI. Quero saber como aproveitar a implantação por R$ 89,90 e a mensalidade de R$ 14,90.';
 const directUrl='https://wa.me/'+PHONE+'?text='+encodeURIComponent(SHORT_MESSAGE);
 const segs=['Cílios e sobrancelhas','Unhas e manicure','Cabelo e salão','Estética facial e corporal','Barbearia','Maquiagem','Outra área da beleza'];
 let modal=null,gift=null,giftTimer=null;
 const atHome=()=>location.pathname==='/'||location.pathname==='/index.html';
 const escapeAttr=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function ensureModal(){
  if(modal)return modal;
  modal=document.createElement('dialog');modal.id='wl-beauty-modal';modal.className='wl-beauty-dialog';
  modal.setAttribute('aria-labelledby','wl-beauty-modal-title');
  modal.innerHTML=`
   <div class="wl-beauty-dialog__inner">
    <div class="wl-beauty-dialog__head"><div><small>OFERTA ESPECIAL · WILLAI</small><h2 id="wl-beauty-modal-title">Seu site com agenda.</h2><p>Preencha rapidinho. Depois vamos direto para o WhatsApp com sua mensagem pronta.</p></div><button type="button" class="wl-beauty-dialog__close" data-wl-close aria-label="Fechar formulário">×</button></div>
    <form class="wl-beauty-form" id="wl-beauty-form">
      <label><span>Seu nome *</span><input name="name" autocomplete="name" minlength="2" maxlength="120" required placeholder="Como podemos chamar você?"></label>
      <div class="wl-beauty-form__grid">
       <label><span>Seu WhatsApp com DDD *</span><input name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required placeholder="(41) 99999-9999"></label>
       <label><span>Sua área de atuação *</span><select name="segment" required><option value="">Selecione</option>${segs.map(s=>'<option value="'+escapeAttr(s)+'">'+s+'</option>').join('')}</select></label>
      </div>
      <label><span>Nome do salão ou negócio (opcional)</span><input name="business" maxlength="100" placeholder="Ex.: Studio da Ana"></label>
      <label><span>Quer contar algo? (opcional)</span><textarea name="notes" rows="2" maxlength="800" placeholder="Ex.: Quero disponibilizar meus horários online"></textarea></label>
      <label class="wl-beauty-form__trap" aria-hidden="true">Site<input name="website" autocomplete="off" tabindex="-1"></label>
      <label class="wl-beauty-form__agree"><input name="privacy" type="checkbox" required> Autorizo a WillAI a utilizar os dados para responder esta solicitação.</label>
      <button type="submit" class="wl-beauty-form__submit">Registrar pedido e abrir WhatsApp →</button>
      <p class="wl-beauty-form__status" id="wl-beauty-form-status" aria-live="polite" role="status"></p>
      <a class="wl-beauty-form__fallback" href="${directUrl}" target="_blank" rel="noopener noreferrer">Conversar no WhatsApp sem registrar</a>
    </form>
   </div>`;
  document.body.append(modal);
  modal.querySelector('[data-wl-close]').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  modal.querySelector('#wl-beauty-form').addEventListener('submit',submit);
  return modal;
 }
 function openPromo(){
   if(gift){gift.remove();gift=null}
   if(giftTimer){clearTimeout(giftTimer);giftTimer=null}
   const d=ensureModal();
   if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','')}
   d.querySelector('[name="name"]').focus({preventScroll:true});
 }
 async function submit(e){
  e.preventDefault();
  const form=e.currentTarget,status=form.querySelector('.wl-beauty-form__status');
  const fallback=form.querySelector('.wl-beauty-form__fallback');
  const button=form.querySelector('[type="submit"]');
  if(button.disabled)return;
  fallback.classList.remove('is-visible');
  const data=Object.fromEntries(new FormData(form));
  if(data.website)return;
  const name=String(data.name||'').trim(),segment=String(data.segment||'').trim();
  const digits=String(data.whatsapp||'').replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
  const business=String(data.business||'').trim(),notes=String(data.notes||'').trim();
  if(name.length<2||!segs.includes(segment)||!/^[1-9]{2}\d{8,9}$/.test(digits)||!data.privacy){
   status.textContent='Confira seu nome, DDD, WhatsApp e área de atuação.';return;
  }
  const description=[
    'Campanha Beleza — Site com agenda online.',
    'Oferta: implantação R$ 89,90 e mensalidade R$ 14,90.',
    'Área de atuação: '+segment+'.',
    business?'Nome do negócio: '+business+'.':'',
    notes?'Observações: '+notes:''
  ].filter(Boolean).join('\n');
  const cfg=window.WILLAI_CONFIG||{};
  if(!cfg.url||!cfg.publishableKey){status.textContent='Não foi possível conectar o formulário. Você pode falar com a equipe pelo WhatsApp.';fallback.classList.add('is-visible');return}
  button.disabled=true;button.textContent='Registrando seu pedido…';status.textContent='Salvando sua solicitação em Orçamentos…';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const res=await fetch(cfg.url+'/rest/v1/willai_quote_requests',{
    method:'POST',
    headers:{apikey:cfg.publishableKey,Accept:'application/json','Content-Type':'application/json',Prefer:'return=minimal'},
    body:JSON.stringify({name,whatsapp:digits,email:'',service:'Promo Beleza | Site + Agenda',description}),
    signal:controller.signal
   });
   if(!res.ok)throw new Error('Falha no cadastro: HTTP '+res.status);
   status.style.color='#08765e';
   status.textContent='Solicitação registrada! Abrindo WhatsApp…';
   const message=[
    'Olá! Vim pelo site da WillAI e quero aproveitar a promoção de Site + Agenda.',
    '',
    '*Meu nome:* '+name,
    '*WhatsApp:* '+digits,
    '*Área:* '+segment,
    business?'*Negócio:* '+business:'',
    notes?'*Observações:* '+notes:'',
    '',
    '*Implantação:* R$ 89,90',
    '*Mensalidade:* R$ 14,90',
    '',
    'Quero dar continuidade à minha solicitação.'
   ].filter(line=>line!==null&&line!==undefined).join('\n');
   window.location.assign('https://wa.me/'+PHONE+'?text='+encodeURIComponent(message));
  }catch(err){
   console.error('Campanha Site + Agenda: não foi possível registrar orçamento',err);
   status.style.color='#b12254';
   status.textContent='O registro não foi concluído. Tente novamente ou fale diretamente com a equipe.';
   fallback.classList.add('is-visible');
  }finally{
   clearTimeout(timeout);button.disabled=false;button.textContent='Registrar pedido e abrir WhatsApp →';
  }
 }
 function showGiftOnce(){
  if(!atHome())return;
  try{if(sessionStorage.getItem('wl-beauty-gift-seen'))return;sessionStorage.setItem('wl-beauty-gift-seen','1')}catch{}
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  gift=document.createElement('div');gift.className='wl-gift';
  gift.setAttribute('aria-label','Presente especial para profissionais da beleza');
  gift.innerHTML='<div class="wl-gift__box" aria-hidden="true"><div class="wl-gift__base"></div><div class="wl-gift__lid"></div></div><div class="wl-gift__copy"><strong>Um presente para seu negócio</strong><span>Condição especial para quem trabalha com beleza.</span></div><button type="button" class="wl-gift__go" data-wl-open>Ver</button>';
  document.body.append(gift);
  requestAnimationFrame(()=>gift?.classList.add('is-active'));
  giftTimer=setTimeout(()=>{if(!gift)return;gift.classList.remove('is-active');setTimeout(()=>{gift?.remove();gift=null},420)},reduce?2500:5200);
 }
 document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-wl-open]');
  if(!trigger)return;
  e.preventDefault();openPromo();
 });
 function init(){
  ensureModal();
  if(atHome())setTimeout(showGiftOnce,650);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
