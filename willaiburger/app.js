(() => {
  'use strict';
  const base = '/willaiburger/';
  const cfg = window.WILLAI_CONFIG || {};
  const $ = id => document.getElementById(id);
  const money = n => Number(n).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
  const fallbackPhoto = base + 'assets/hero.webp';
  const defaultCover = base + 'assets/cover-premium.webp';
  let restaurant = {name: 'WillAI Burger', whatsapp: '', hero_url: defaultCover};
  let products = [], category = 'Todos', cart = [], active = null;

  async function get(path) {
    if (!cfg.url || !cfg.publishableKey) throw new Error('Configuração do Supabase indisponível');
    const response = await fetch(cfg.url + '/rest/v1/' + path, {headers: {apikey: cfg.publishableKey, Accept: 'application/json'}});
    if (!response.ok) throw new Error('Falha na consulta: ' + response.status);
    return response.json();
  }
  async function load() {
    try {
      const restaurants = await get('willai_menu_restaurants?slug=eq.willaiburger&select=*&limit=1');
      if (!restaurants.length) throw new Error('Restaurante indisponível');
      restaurant = restaurants[0];
      products = await get(`willai_menu_products?restaurant_id=eq.${restaurant.id}&available=eq.true&select=*&order=sort_order.asc`);
    } catch (error) {
      console.warn('Cardápio: usando cópia de segurança', error);
      try { products = await (await fetch(base + 'products-fallback.json')).json(); }
      catch { products = []; }
    }
    $('hero-photo').src = restaurant.hero_url || defaultCover;
    $('hero-eyebrow').textContent = restaurant.hero_eyebrow || 'BEM-VINDO';
    $('hero-headline').textContent = restaurant.hero_headline || 'Seu próximo favorito está aqui.';
    $('hero-caption').textContent = restaurant.hero_caption || 'Toque na tela para começar';
    if (restaurant.hero_product_url) {
      $('hero-product').src = restaurant.hero_product_url;
      $('hero-product').hidden = false;
      $('hero-product').onerror = () => { $('hero-product').hidden = true; };
    }
    if (restaurant.logo_url) {
      const defaultBrandLogo = /\/willaiburger\/assets\/logo\.webp(?:\?.*)?$/.test(restaurant.logo_url);
      $('hero-logo').src = defaultBrandLogo ? base + 'assets/logo-dark.webp' : restaurant.logo_url;
      document.querySelector('footer img').src = restaurant.logo_url;
    }
    const methods = $('fulfillment');
    methods.innerHTML = [restaurant.pickup_enabled !== false ? '<option value="Retirada">Retirar no local</option>' : '', restaurant.delivery_enabled !== false ? '<option value="Entrega">Receber por entrega</option>' : ''].join('');
    updateFulfillment();
    drawCategories(); drawFeatured(); drawProducts(); reveal();
  }
  function imageOf(product) { return product.image_url || fallbackPhoto; }
  function watchImages(root=document) {
    root.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => {if (img.src !== location.origin + fallbackPhoto) img.src = fallbackPhoto;}, {once: true});
    });
  }
  function groups() { return ['Todos', 'Combos', 'Hambúrgueres', 'Acompanhamentos', 'Bebidas', ...new Set(products.map(p => p.category).filter(c => !['Combos','Hambúrgueres','Acompanhamentos','Bebidas'].includes(c)))]; }
  function drawCategories() {
    $('categories').innerHTML = groups().map(c => `<button class="category ${c === category ? 'active' : ''}" data-category="${safe(c)}">${safe(c)}</button>`).join('');
    $('categories').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      category = btn.dataset.category;
      drawCategories(); drawProducts();
    }));
  }
  function drawFeatured() {
    const promoted = products.filter(p => p.featured).slice(0,2);
    const visible = category === 'Todos' && !$('search').value.trim() && promoted.length > 0;
    $('featured').hidden = !visible;
    $('featured-title').hidden = !visible;
    $('featured').innerHTML = promoted.map(p => `<button class="feature" data-product="${p.id}" aria-label="Escolher ${safe(p.name)}"><img data-fallback src="${safe(imageOf(p))}" alt="${safe(p.name)}"><div class="feature-text"><small>MAIS PEDIDO</small><h3>${safe(p.name)}</h3><div class="feature-bottom"><strong>${money(p.price)}</strong><span class="feature-cta">Escolher</span></div></div></button>`).join('');
    $('featured').querySelectorAll('button').forEach(el => el.addEventListener('click', () => choose(Number(el.dataset.product))));
    watchImages($('featured'));
  }
  function drawProducts() {
    const query = $('search').value.trim().toLowerCase();
    const visible = products.filter(p => (category === 'Todos' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(query));
    $('category-heading').textContent = query ? 'Resultados' : category === 'Todos' ? 'Cardápio completo' : category;
    document.querySelector('.product-header').hidden = category !== 'Todos' && !query;
    const ordered = groups().filter(c => c !== 'Todos');
    const categories = category === 'Todos' ? ordered : [category];
    const itemCard = p => `<article class="item"><button class="photo-wrap" type="button" data-product="${p.id}" aria-label="Ver ${safe(p.name)}"><img class="item-photo" data-fallback loading="lazy" src="${safe(imageOf(p))}" alt="${safe(p.name)}">${p.old_price > p.price ? '<span class="item-label">OFERTA</span>' : ''}</button><div class="item-body"><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p><div class="item-bottom"><div class="price-wrap"><strong class="item-price">${money(p.price)}</strong>${p.old_price > p.price ? `<span class="old-price">${money(p.old_price)}</span>` : ''}</div><button class="add-button" type="button" data-product="${p.id}" aria-label="Adicionar ${safe(p.name)}">+</button></div></div></article>`;
    $('products').innerHTML = categories.map(c => {
      const items = visible.filter(p => p.category === c);
      if (!items.length) return '';
      return `<section class="product-group" aria-label="${safe(c)}"><div class="group-heading"><h3>${safe(c)}</h3><span>${items.length} ${items.length === 1 ? 'opção' : 'opções'}</span></div><div class="product-cards">${items.map(itemCard).join('')}</div></section>`;
    }).join('') || '<div class="empty">Nenhum produto encontrado.</div>';
    drawFeatured();
    $('products').querySelectorAll('button[data-product]').forEach(el => el.addEventListener('click', () => choose(Number(el.dataset.product))));
    watchImages($('products'));
  }
  function choose(id) {
    active = products.find(p => p.id === id);
    if (!active) return;
    const extras = Array.isArray(active.extras) ? active.extras : [];
    $('product-detail').innerHTML = `<img class="dialog-photo" data-fallback src="${safe(imageOf(active))}" alt="${safe(active.name)}"><div class="dialog-content"><h2 id="dialog-name">${safe(active.name)}</h2><p>${safe(active.description)}</p>${extras.length ? `<h3>Adicionais</h3>${extras.map((extra,i) => `<div class="option-line"><label for="extra-${i}">${safe(extra.name)} <small>+ ${money(extra.price)}</small></label><input id="extra-${i}" class="extra-choice" type="checkbox" data-index="${i}"></div>`).join('')}` : ''}<label style="font-weight:700;display:block;margin-top:16px">Observações<textarea id="item-note" rows="2" placeholder="Alguma preferência?"></textarea></label><button id="confirm-add" class="add-to-cart">Adicionar à sacola • ${money(active.price)}</button></div>`;
    watchImages($('product-detail'));
    $('product-dialog').showModal();
    $('confirm-add').addEventListener('click', addToCart);
  }
  function addToCart() {
    const extras = Array.isArray(active.extras) ? active.extras : [];
    const picked = [...document.querySelectorAll('.extra-choice:checked')].map(el => extras[Number(el.dataset.index)]).filter(Boolean);
    cart.push({id: crypto.randomUUID(),product: active,extras: picked,note: $('item-note').value.trim(),price: Number(active.price) + picked.reduce((v,e) => v + Number(e.price),0)});
    $('product-dialog').close(); updateCart();
  }
  function sum() { return cart.reduce((total,item) => total + item.price,0); }
  function updateCart() {
    if ($('cart-number')) $('cart-number').textContent = cart.length;
    $('floating-total').textContent = money(sum());
    $('floating-cart').classList.toggle('shown', cart.length > 0);
    $('cart-total').textContent = money(sum());
    $('cart-items').innerHTML = cart.length ? cart.map((item,i) => `<div class="cart-item"><img data-fallback src="${safe(imageOf(item.product))}" alt=""><div><strong>${safe(item.product.name)}</strong><p>${item.extras.map(e => e.name).join(', ') || 'Sem adicionais'}${item.note ? ' • ' + safe(item.note) : ''}</p><b>${money(item.price)}</b><br><button data-remove="${i}">Remover</button></div></div>`).join('') : '<div class="empty">Sua sacola está vazia.</div>';
    $('cart-items').querySelectorAll('button').forEach(el => el.addEventListener('click', () => {cart.splice(Number(el.dataset.remove),1);updateCart();}));
    watchImages($('cart-items'));
  }
  function openCart(){ $('scrim').hidden=false; $('cart-drawer').classList.add('open'); $('cart-drawer').setAttribute('aria-hidden','false'); }
  function closeCart(){ $('scrim').hidden=true; $('cart-drawer').classList.remove('open'); $('cart-drawer').setAttribute('aria-hidden','true'); }
  function updateFulfillment(){ $('delivery-fields').hidden = $('fulfillment').value !== 'Entrega'; }
  async function lookupCep(){
    const cep=$('delivery-cep').value.replace(/\D/g,'');
    const status=$('cep-feedback');
    if (!cep) {status.textContent='';return;}
    if (cep.length!==8) {status.textContent='Informe 8 números ou deixe o CEP vazio.';return;}
    status.textContent='Buscando endereço...';
    try {
      const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{signal:AbortSignal.timeout(7000)});
      if (!response.ok) throw new Error();
      const address=await response.json();
      if(address.erro)throw new Error();
      if($('delivery-cep').value.replace(/\D/g,'')!==cep)return;
      $('delivery-street').value=address.logradouro||'';
      $('delivery-neighborhood').value=address.bairro||'';
      $('delivery-city').value=address.localidade||'';
      $('delivery-state').value=address.uf||'';
      status.textContent='Endereço preenchido. Confira o número.';
      $('delivery-number').focus();
    }catch {status.textContent='Não foi possível consultar o CEP. Preencha manualmente.';}
  }
  function checkout(){
    if (!cart.length) return alert('Adicione um produto.');
    if (!$('fulfillment').value) return alert('O restaurante ainda não configurou uma forma de recebimento.');
    const isDelivery=$('fulfillment').value==='Entrega';
    const addr=id=>$(id).value.trim();
    if(isDelivery && !['delivery-street','delivery-number','delivery-neighborhood','delivery-city','delivery-state'].every(id=>addr(id)))return alert('Para entrega, preencha rua, número, bairro, cidade e UF. O CEP é opcional.');
    const address=isDelivery?`${addr('delivery-street')}, ${addr('delivery-number')}${addr('delivery-complement')?', '+addr('delivery-complement'):''} — ${addr('delivery-neighborhood')} — ${addr('delivery-city')}/${addr('delivery-state').toUpperCase()}${addr('delivery-cep')?' — CEP '+addr('delivery-cep'):''}`:'';
    const phone=String(restaurant.whatsapp||'').replace(/\D/g,'');
    if (!/^\d{12,13}$/.test(phone)) return alert('O restaurante ainda não configurou o WhatsApp para pedidos.');
    const parts=cart.map((item,i)=>{
      const lines=[`*${i+1}. ${item.product.name}* — ${money(item.price)}`];
      if(item.extras.length)lines.push(...item.extras.map(extra=>`   + ${extra.name} (${money(extra.price)})`));
      if(item.note)lines.push(`   Obs.: ${item.note}`);
      return lines.join('\n');
    }).join('\n\n');
    const customer=$('customer-name').value.trim()||'Não informado';
    const notes=$('delivery-address').value.trim();
    const message=[
      `*NOVO PEDIDO | ${restaurant.name || 'Cardápio'}*`,
      '',
      `*Cliente:* ${customer}`,
      `*Recebimento:* ${isDelivery?'Entrega':'Retirada no local'}`,
      ...(isDelivery?[`*Endereço:* ${address}`]:[]),
      '',
      '*ITENS DO PEDIDO*',
      parts,
      '',
      `*TOTAL DOS PRODUTOS: ${money(sum())}*`,
      `*Pagamento:* ${$('payment').value}`,
      ...(notes?[`*Observações gerais:* ${notes}`]:[]),
      '',
      '_Pedido enviado pelo cardápio digital WillAI._'
    ].join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
  }
  function reveal() {
    const watcher = new IntersectionObserver(entries => entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('visible');watcher.unobserve(entry.target);}}),{threshold:.07});
    document.querySelectorAll('.reveal').forEach(el=>watcher.observe(el));
  }
  let enteringMenu = false;
  $('hero-trigger').addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (enteringMenu) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      $('cardapio').scrollIntoView({behavior: 'auto'});
      history.replaceState(null, '', '#cardapio');
      return;
    }
    enteringMenu = true;
    $('inicio').classList.add('is-entering');
    document.documentElement.classList.add('manual-scrolling');
    const from = window.scrollY;
    const to = $('cardapio').getBoundingClientRect().top + from;
    const start = performance.now();
    const duration = 1100;
    const frame = now => {
      const progress = Math.min(1, (now - start) / duration);
      const easing = .5 - Math.cos(Math.PI * progress) / 2;
      window.scrollTo(0, from + (to - from) * easing);
      if (progress < 1) requestAnimationFrame(frame);
      else {
        history.replaceState(null, '', '#cardapio');
        document.documentElement.classList.remove('manual-scrolling');
        $('inicio').classList.remove('is-entering');
        enteringMenu = false;
      }
    };
    requestAnimationFrame(frame);
  });
  $('search').addEventListener('input',() => {if($('search').value.trim() && category !== 'Todos'){category='Todos';drawCategories();}drawProducts();});
  $('floating-cart').addEventListener('click',openCart);
  $('close-cart').addEventListener('click',closeCart);
  $('scrim').addEventListener('click',closeCart);
  $('close-product').addEventListener('click',()=> $('product-dialog').close());
  $('checkout-button').addEventListener('click',checkout);
  $('fulfillment').addEventListener('change',updateFulfillment);
  $('delivery-cep').addEventListener('blur',lookupCep);
  $('delivery-cep').addEventListener('input',()=>{const input=$('delivery-cep');const digits=input.value.replace(/\D/g,'').slice(0,8);input.value=digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits;if(digits.length===8)lookupCep();});
  load();
})();
