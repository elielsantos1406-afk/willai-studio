(() => {
  'use strict';
  const cfg = window.WILLAI_CONFIG || {};
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const clean = t => String(t??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const photoFallback = '/willaiburger/assets/hero.webp';
  let session = null, restaurant = null, products = [];
  const authKey = 'willai-menu-auth';
  function toast(msg) { $('toast').textContent=msg; $('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),3500); }
  async function authRequest(path,body) {
    const response = await fetch(cfg.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.msg||data.error_description||data.message||'Não foi possível entrar.');
    return data;
  }
  async function ensureToken() {
    if (!session?.access_token) throw new Error('Faça login novamente.');
    if (Date.now() < session.expires_at*1000-45000) return session.access_token;
    const next = await authRequest('token?grant_type=refresh_token',{refresh_token:session.refresh_token});
    session = {...next,expires_at:Math.floor(Date.now()/1000)+next.expires_in};
    sessionStorage.setItem(authKey,JSON.stringify(session));
    return session.access_token;
  }
  async function rest(path,opts={}) {
    const token=await ensureToken();
    const response=await fetch(cfg.url+'/rest/v1/'+path,{method:opts.method||'GET',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+token,Accept:'application/json',...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})},body:opts.body?JSON.stringify(opts.body):undefined});
    if (!response.ok) {const text=await response.text();throw new Error(text.slice(0,280)||'Erro '+response.status);}
    if (response.status===204) return [];
    const text=await response.text();return text?JSON.parse(text):[];
  }
  async function afterLogin() {
    if (!session?.user?.id) throw new Error('Sessão inválida');
    const own=await rest('willai_menu_members?select=restaurant_id&user_id=eq.'+encodeURIComponent(session.user.id));
    if (!own.length) throw new Error('Esta conta não tem acesso ao cardápio.');
    const rows=await rest('willai_menu_restaurants?select=*&id=eq.'+own[0].restaurant_id);
    if (!rows.length) throw new Error('Restaurante não encontrado.');
    if (rows[0].slug !== 'willaiburger') throw new Error('Esta conta não tem acesso ao WillAI Burger.');
    restaurant=rows[0];
    $('login-screen').hidden=true;
    $('admin-screen').hidden=false;
    await loadProducts();
    populateSettings();
  }
  async function loadProducts() {
    products=await rest(`willai_menu_products?restaurant_id=eq.${restaurant.id}&select=*&order=sort_order.asc`);
    $('products-list').innerHTML=products.map(p=>`<div class="product-row"><img src="${clean(p.image_url||photoFallback)}" alt="" onerror="this.src='${photoFallback}'"><div class="desc"><strong>${clean(p.name)}</strong><small>${clean(p.category)}${p.available?'':' • Indisponível'}</small></div><b>${fmt(p.price)}</b><button type="button" data-edit="${p.id}">Editar</button></div>`).join('') || '<p>Nenhum produto cadastrado.</p>';
    $('products-list').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openProduct(Number(b.dataset.edit))));
  }
  function populateSettings() {
    const f=$('settings-form');
    f.elements.name.value=restaurant.name;
    f.elements.whatsapp.value=restaurant.whatsapp||'';
    f.elements.hero_eyebrow.value=restaurant.hero_eyebrow||'BEM-VINDO';
    f.elements.hero_headline.value=restaurant.hero_headline||'Seu próximo favorito está aqui.';
    f.elements.hero_caption.value=restaurant.hero_caption||'Toque na tela para começar';
    f.elements.remove_hero_product.checked=false;
    $('cover-preview').src=restaurant.hero_url||'/willaiburger/assets/cover-premium.webp';
    $('logo-preview').src=restaurant.logo_url||'/willaiburger/assets/logo.webp';
    $('hero-product-preview').src=restaurant.hero_product_url||'';
    $('hero-product-preview').hidden=!restaurant.hero_product_url;
  }
  function openProduct(id=0) {
    const p=products.find(x=>x.id===id);
    const f=$('product-form');
    f.reset();
    f.elements.id.value=p?.id||'';
    f.elements.name.value=p?.name||'';
    f.elements.description.value=p?.description||'';
    f.elements.price.value=p?.price??'';
    f.elements.old_price.value=p?.old_price??'';
    f.elements.category.value=p?.category||'Hambúrgueres';
    f.elements.extras.value=(p?.extras||[]).map(x=>`${x.name}:${x.price}`).join('\n');
    f.elements.featured.checked=!!p?.featured;
    f.elements.available.checked=p?.available!==false;
    $('product-preview').src=p?.image_url||photoFallback;
    $('product-dialog-title').textContent=p?'Editar produto':'Novo produto';
    $('delete-product').classList.toggle('show',!!p);
    $('product-editor').showModal();
  }
  function extrasFrom(text) {
    return text.split(/\r?\n/).map(line=>{const split=line.lastIndexOf(':');if(split<1)return null;const name=line.slice(0,split).trim();const price=Number(line.slice(split+1).trim().replace(',','.'));return name&&Number.isFinite(price)&&price>=0?{name,price}:null;}).filter(Boolean);
  }
  async function toWebp(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao otimizar foto')),'image/webp',.82));
  }
  async function upload(file) {
    if (!file) return '';
    if (!file.type.startsWith('image/')) throw new Error('Escolha uma imagem.');
    const blob=await toWebp(file);
    if(blob.size>2097152)throw new Error('Foto grande demais após compressão.');
    const token=await ensureToken();
    const path=`${restaurant.slug}/${crypto.randomUUID()}.webp`;
    const res=await fetch(cfg.url+'/storage/v1/object/willai-menu-images/'+path,{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+token,'Content-Type':'image/webp','x-upsert':'false'},body:blob});
    if(!res.ok)throw new Error('Não foi possível enviar a foto: '+(await res.text()).slice(0,140));
    return cfg.url+'/storage/v1/object/public/willai-menu-images/'+path;
  }
  async function saveProduct(e) {
    e.preventDefault(); const f=e.currentTarget,button=f.querySelector('button[type=submit]');button.disabled=true;
    try {
      const id=Number(f.elements.id.value||0);
      const old=products.find(p=>p.id===id);
      const photo=await upload(f.elements.photo.files[0]);
      const row={restaurant_id:restaurant.id,name:f.elements.name.value.trim(),description:f.elements.description.value.trim(),category:f.elements.category.value,price:Number(f.elements.price.value),old_price:f.elements.old_price.value?Number(f.elements.old_price.value):null,image_url:photo||old?.image_url||'',featured:f.elements.featured.checked,available:f.elements.available.checked,extras:extrasFrom(f.elements.extras.value),sort_order:old?.sort_order||products.length+1};
      if(!row.name||!Number.isFinite(row.price)||row.price<0)throw new Error('Confira nome e preço.');
      if(id)await rest('willai_menu_products?id=eq.'+id,{method:'PATCH',body:row,headers:{Prefer:'return=representation'}});
      else await rest('willai_menu_products',{method:'POST',body:row,headers:{Prefer:'return=representation'}});
      $('product-editor').close();await loadProducts();toast('Produto salvo no Supabase.');
    }catch(error){alert(error.message);}finally{button.disabled=false;}
  }
  async function removeProduct(){
    const id=Number($('product-form').elements.id.value);if(!id||!confirm('Excluir este produto do cardápio?'))return;
    try{await rest('willai_menu_products?id=eq.'+id,{method:'DELETE'});$('product-editor').close();await loadProducts();toast('Produto excluído.');}catch(e){alert(e.message);}
  }
  async function saveSettings(e) {
    e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type=submit]');btn.disabled=true;
    try{
      const whatsapp=f.elements.whatsapp.value.replace(/\D/g,'');
      if(whatsapp&&!/^\d{12,13}$/.test(whatsapp))throw new Error('WhatsApp: informe DDI 55, DDD e número.');
      const hero=await upload(f.elements.cover.files[0]);
      const logo=await upload(f.elements.logo.files[0]);
      const heroProduct=await upload(f.elements.hero_product.files[0]);
      const updates={name:f.elements.name.value.trim(),whatsapp,hero_url:hero||restaurant.hero_url,logo_url:logo||restaurant.logo_url,hero_eyebrow:f.elements.hero_eyebrow.value.trim().slice(0,45),hero_headline:f.elements.hero_headline.value.trim().slice(0,70),hero_caption:f.elements.hero_caption.value.trim().slice(0,90),hero_product_url:f.elements.remove_hero_product.checked?'':heroProduct||restaurant.hero_product_url||''};
      const response=await rest('willai_menu_restaurants?id=eq.'+restaurant.id,{method:'PATCH',body:updates,headers:{Prefer:'return=representation'}});
      restaurant=response[0]||{...restaurant,...updates};populateSettings();toast('Restaurante atualizado no Supabase.');
    }catch(error){alert(error.message);}finally{btn.disabled=false;}
  }
  async function login(e) {
    e.preventDefault();const form=e.currentTarget,btn=form.querySelector('button');btn.disabled=true;
    $('login-message').textContent='Verificando acesso...';
    try{
      const identifier=$('email').value.trim();
      const email=identifier.toLocaleLowerCase('pt-BR').replace(/\s+/g,' ')==='teste eliel'?'teste-eliel-cardapio@willai.com.br':identifier;
      const data=await authRequest('token?grant_type=password',{email,password:$('password').value});
      session={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};
      sessionStorage.setItem(authKey,JSON.stringify(session));
      await afterLogin();$('password').value='';
    }catch(error){session=null;sessionStorage.removeItem(authKey);$('login-message').textContent=error.message;}
    finally{btn.disabled=false;}
  }
  $('login-form').addEventListener('submit',login);
  $('logout').addEventListener('click',async()=>{
    try{const token=await ensureToken();await fetch(cfg.url+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+token}});}catch{}
    session=null;sessionStorage.removeItem(authKey);location.reload();
  });
  $('new-product').addEventListener('click',()=>openProduct());
  $('cancel-product').addEventListener('click',()=>$('product-editor').close());
  $('product-form').addEventListener('submit',saveProduct);
  $('delete-product').addEventListener('click',removeProduct);
  $('settings-form').addEventListener('submit',saveSettings);
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));
    $('products-panel').hidden=btn.dataset.tab!=='products';$('settings-panel').hidden=btn.dataset.tab!=='settings';
  }));
  try{session=JSON.parse(sessionStorage.getItem(authKey)||'null');if(session)afterLogin().catch(()=>{session=null;sessionStorage.removeItem(authKey);$('login-screen').hidden=false;$('admin-screen').hidden=true;});}catch{}
})();
