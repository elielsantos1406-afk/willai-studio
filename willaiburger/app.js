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
    $('featured').innerHTML = promoted.map(p => `<button class="feature" data-product="${p.id}"><img data-fallback src="${safe(imageOf(p))}" alt="${safe(p.name)}"><div class="feature-text"><small>DESTAQUE</small><h3>${safe(p.name)}</h3><strong>${money(p.price)}</strong></div></button>`).join('');
    $('featured').querySelectorAll('button').forEach(el => el.addEventListener('click', () => choose(Number(el.dataset.product))));
    watchImages($('featured'));
  }
  function drawProducts() {
    const query = $('search').value.trim().toLowerCase();
    const visible = products.filter(p => (category === 'Todos' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(query));
    $('category-heading').textContent = category === 'Todos' ? 'Todos os produtos' : category;
    $('products').innerHTML = visible.map(p => `<article class="item"><div class="photo-wrap"><img class="item-photo" data-fallback loading="lazy" src="${safe(imageOf(p))}" alt="${safe(p.name)}">${p.old_price > p.price ? '<span class="item-label">OFERTA</span>' : ''}</div><div class="item-body"><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p><div class="item-bottom"><div><strong class="item-price">${money(p.price)}</strong>${p.old_price > p.price ? `<span class="old-price">${money(p.old_price)}</span>` : ''}</div><button class="add-button" type="button" data-product="${p.id}" aria-label="Adicionar ${safe(p.name)}">+</button></div></div></article>`).join('') || '<div class="empty">Nenhum produto encontrado.</div>';
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
    $('cart-number').textContent = cart.length;
    $('floating-total').textContent = money(sum());
    $('floating-cart').classList.toggle('shown', cart.length > 0);
    $('cart-total').textContent = money(sum());
    $('cart-items').innerHTML = cart.length ? cart.map((item,i) => `<div class="cart-item"><img data-fallback src="${safe(imageOf(item.product))}" alt=""><div><strong>${safe(item.product.name)}</strong><p>${item.extras.map(e => e.name).join(', ') || 'Sem adicionais'}${item.note ? ' • ' + safe(item.note) : ''}</p><b>${money(item.price)}</b><br><button data-remove="${i}">Remover</button></div></div>`).join('') : '<div class="empty">Sua sacola está vazia.</div>';
    $('cart-items').querySelectorAll('button').forEach(el => el.addEventListener('click', () => {cart.splice(Number(el.dataset.remove),1);updateCart();}));
    watchImages($('cart-items'));
  }
  function openCart(){ $('scrim').hidden=false; $('cart-drawer').classList.add('open'); $('cart-drawer').setAttribute('aria-hidden','false'); }
  function closeCart(){ $('scrim').hidden=true; $('cart-drawer').classList.remove('open'); $('cart-drawer').setAttribute('aria-hidden','true'); }
  function checkout(){
    if (!cart.length) return alert('Adicione um produto.');
    const phone=String(restaurant.whatsapp||'').replace(/\D/g,'');
    if (!/^\d{12,13}$/.test(phone)) return alert('O restaurante ainda não configurou o WhatsApp para pedidos.');
    const parts=cart.map((x,i)=>`${i+1}. ${x.product.name} — ${money(x.price)}${x.extras.length?'\n   + '+x.extras.map(e=>e.name).join(', '):''}${x.note?'\n   Obs.: '+x.note:''}`).join('\n');
    const message=`Olá! Meu pedido:\n\n${parts}\n\n*Total: ${money(sum())}*\nNome: ${$('customer-name').value.trim() || 'Não informado'}\nRecebimento: ${$('fulfillment').value}\nEndereço/obs.: ${$('delivery-address').value.trim() || '-'}\nPagamento: ${$('payment').value}`;
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
  $('search-toggle').addEventListener('click', () => {$('search').classList.toggle('visible');$('search').focus();});
  $('search').addEventListener('input',drawProducts);
  $('floating-cart').addEventListener('click',openCart);
  $('close-cart').addEventListener('click',closeCart);
  $('scrim').addEventListener('click',closeCart);
  $('close-product').addEventListener('click',()=> $('product-dialog').close());
  $('checkout-button').addEventListener('click',checkout);
  load();
})();
