/** WILLAI international one-time offers. No payment or personal data is collected here. */
(() => {
  'use strict';
  const WA_NUMBER = '5522997332202'; // Verified business contact from the existing WILLAI site.
  const plans = [
    { id: 'smart', price: '$39.90', image: '/sites/smart-link.webp' },
    { id: 'business', price: '$100.00', image: '/sites/business.webp', featured: true },
    { id: 'pro', price: '$149.90', image: '/sites/pro.webp' }
  ];
  const content = {
    en: {
      navPlans: 'Plans', navHow: 'How it works', navFaq: 'FAQ', headerCta: 'Get a website',
      eyebrow: 'MADE FOR SMALL BUSINESSES', heroTitle: 'A better website.<br>A simpler price.',
      heroText: 'Beautiful, mobile-ready websites designed around your business. Pick what you need and pay once for the design.',
      heroBrowse: 'Explore websites', heroHow: 'See how it works', heroPoint1: 'Made for mobile', heroPoint2: 'Clear one-time pricing', heroPoint3: 'Personalized for your brand',
      previewCaption: "A LOOK AT WHAT'S POSSIBLE", heroNote: 'Simple to launch. Designed to stand out.',
      planSmart: 'Smart Link', planBusiness: 'Business Site', planPro: 'Business Pro',
      plansEyebrow: 'THE RIGHT FIT FOR YOUR BUSINESS', plansTitle: 'Start with exactly what you need.', plansDescription: 'Three website options. Straightforward one-time pricing.',
      popular: 'MOST POPULAR', once: 'one-time', selectPlan: 'Choose this plan',
      pricingNote: 'All prices are in USD. Domain, hosting, paid integrations and ongoing updates are not included.',
      howEyebrow: 'THE PROCESS', howTitle: 'From your idea<br>to your website.',
      howIntro: 'No complicated process. We help you choose the right solution, personalize it for your business, and get it ready to launch.',
      exampleEyebrow: 'BUILT AROUND YOUR BRAND', exampleTitle: 'Not just another template.',
      exampleText: 'Your website should feel like your business. We adapt colors, content, imagery, and calls to action to suit your customers.', exampleButton: 'Find your website',
      faqEyebrow: 'FREQUENTLY ASKED QUESTIONS', faqTitle: 'Good to know.',
      endEyebrow: "LET'S GET STARTED", endTitle: 'Make your next impression count.', endText: "Tell us a little about your business. We'll help you choose the right website.", endButton: 'Request a website',
      footerText: 'Digital presence, made simple.',
      dialogEyebrow: "LET'S TALK ABOUT YOUR PROJECT", dialogTitle: 'Tell us about your business.',
      dialogDescription: "We'll prepare a WhatsApp message with your details. You review and send it yourself.",
      dialogSelected: 'Selected plan', fieldName: 'Your name', fieldBusiness: 'Business name', fieldProfile: 'Instagram or website (optional)', dialogSubmit: 'Continue to WhatsApp',
      dialogNote: "Your request is not a payment. You'll confirm the project scope before ordering.",
      placeholders: ['Your name', 'Business name', '@yourbusiness'],
      planInfo: {
        smart: { name: 'Smart Link', desc: 'A stylish home for all your important links.', features: ['Mobile-friendly profile page', 'Social media and contact links', 'Booking and location buttons', 'Custom QR code'] },
        business: { name: 'Business Site', desc: 'A one-page website that makes a great first impression.', features: ['Everything in Smart Link', 'One-page business presentation', 'Services, photos, and location', 'Contact and booking buttons'] },
        pro: { name: 'Business Pro', desc: 'A richer site to present services and request quotes.', features: ['Everything in Business Site', 'Packages and reviews sections', 'Quote request form setup', 'Basic on-page search optimization'] }
      },
      steps: [
        ['Choose your website', 'Explore the three options and find the best fit for your business.'],
        ['Share your details', 'Tell us your business name, style, content, and contact links.'],
        ['Review and launch', 'We prepare your site for review and agree on the final handoff.']
      ],
      faqs: [
        ['Is this really a one-time payment?', 'Yes. The displayed price covers the agreed website design and delivery. Hosting, domain registration, paid tools, and ongoing changes are separate.'],
        ['Will my website work on phones?', 'Yes. All three options are designed to adapt to mobile screens.'],
        ['Do I need to buy hosting and a domain?', 'You can use an existing domain and hosting provider or arrange them separately. We will discuss the setup before you order.'],
        ['What happens when I choose a plan?', 'A short form prepares a WhatsApp message with your selected plan and business details. You review it and send it to our team; no payment is taken on this page.']
      ],
      waText: (plan, price, name, business, profile) => `Hello WILLAI! I'm interested in the ${plan} website (${price}, one-time).\nName: ${name}\nBusiness: ${business}\nInstagram / website: ${profile || 'Not provided'}\nI'd like to discuss the project details.`
    },
    es: {
      navPlans: 'Planes', navHow: 'Cómo funciona', navFaq: 'Preguntas', headerCta: 'Solicitar sitio web',
      eyebrow: 'PARA PEQUEÑOS NEGOCIOS', heroTitle: 'Una mejor web.<br>Un precio más simple.',
      heroText: 'Páginas hermosas y adaptadas a celulares, diseñadas para tu negocio. Elige lo que necesitas y paga una sola vez por el diseño.',
      heroBrowse: 'Explorar sitios', heroHow: 'Cómo funciona', heroPoint1: 'Diseñado para móviles', heroPoint2: 'Pago único y claro', heroPoint3: 'Adaptado a tu marca',
      previewCaption: 'DESCUBRE LAS POSIBILIDADES', heroNote: 'Fácil de lanzar. Diseñado para destacar.',
      planSmart: 'Smart Link', planBusiness: 'Business Site', planPro: 'Business Pro',
      plansEyebrow: 'UNA OPCIÓN PARA CADA NEGOCIO', plansTitle: 'Empieza con lo que necesitas.', plansDescription: 'Tres opciones de sitio web. Precios claros y de pago único.',
      popular: 'MÁS ELEGIDO', once: 'pago único', selectPlan: 'Elegir este plan',
      pricingNote: 'Precios en USD. Dominio, alojamiento, integraciones de pago y actualizaciones continuas no incluidos.',
      howEyebrow: 'EL PROCESO', howTitle: 'De tu idea<br>a tu sitio web.',
      howIntro: 'Un proceso sencillo. Te ayudamos a elegir, personalizar y preparar tu sitio para lanzarlo.',
      exampleEyebrow: 'HECHO PARA TU MARCA', exampleTitle: 'Más que una plantilla.',
      exampleText: 'Tu sitio debe reflejar tu negocio. Adaptamos colores, contenido, imágenes y botones de contacto a tus clientes.', exampleButton: 'Encuentra tu sitio',
      faqEyebrow: 'PREGUNTAS FRECUENTES', faqTitle: 'Lo que debes saber.',
      endEyebrow: 'EMPECEMOS', endTitle: 'Haz que tu primera impresión cuente.', endText: 'Cuéntanos sobre tu negocio y te ayudaremos a elegir.', endButton: 'Solicitar sitio web',
      footerText: 'Presencia digital, sin complicaciones.',
      dialogEyebrow: 'HABLEMOS DE TU PROYECTO', dialogTitle: 'Cuéntanos sobre tu negocio.',
      dialogDescription: 'Prepararemos un mensaje de WhatsApp con tus datos. Podrás revisarlo y enviarlo.',
      dialogSelected: 'Plan seleccionado', fieldName: 'Tu nombre', fieldBusiness: 'Nombre del negocio', fieldProfile: 'Instagram o sitio web (opcional)', dialogSubmit: 'Continuar en WhatsApp',
      dialogNote: 'La solicitud no es un pago. Confirmaremos los detalles antes de contratar.',
      placeholders: ['Tu nombre', 'Nombre del negocio', '@tunegocio'],
      planInfo: {
        smart: { name: 'Smart Link', desc: 'Una página elegante para reunir tus enlaces.', features: ['Página adaptada a celulares', 'Enlaces de contacto y redes sociales', 'Botones de reservas y ubicación', 'Código QR personalizado'] },
        business: { name: 'Business Site', desc: 'Un sitio de una página que transmite confianza.', features: ['Todo lo del Smart Link', 'Presentación del negocio en una página', 'Servicios, fotografías y ubicación', 'Botones de contacto y reservas'] },
        pro: { name: 'Business Pro', desc: 'Un sitio más completo para mostrar servicios y recibir consultas.', features: ['Todo lo del Business Site', 'Secciones de paquetes y opiniones', 'Configuración de formulario de presupuestos', 'Optimización básica para buscadores'] }
      },
      steps: [
        ['Elige tu sitio', 'Compara las opciones y encuentra la adecuada para tu negocio.'],
        ['Comparte tus datos', 'Envíanos el nombre, estilo, contenido y enlaces de tu negocio.'],
        ['Revisa y publica', 'Preparamos tu sitio para revisión y acordamos la entrega final.']
      ],
      faqs: [
        ['¿Es realmente un pago único?', 'Sí. El precio cubre el diseño y entrega acordados. Alojamiento, dominio, servicios externos y cambios posteriores se cobran aparte.'],
        ['¿Mi sitio funcionará en celulares?', 'Sí. Las tres opciones están diseñadas para pantallas móviles.'],
        ['¿Necesito dominio y alojamiento?', 'Puedes usar un proveedor propio o contratar estos servicios por separado. Acordaremos los detalles antes de comprar.'],
        ['¿Qué pasa al elegir un plan?', 'Un formulario prepara un mensaje de WhatsApp con tu plan y datos. Tú lo revisas y envías; esta página no cobra dinero.']
      ],
      waText: (plan, price, name, business, profile) => `¡Hola, WILLAI! Me interesa el sitio ${plan} (${price}, pago único).\nNombre: ${name}\nNegocio: ${business}\nInstagram / web: ${profile || 'No indicado'}\nQuisiera conversar sobre el proyecto.`
    },
    pt: {
      navPlans: 'Planos', navHow: 'Como funciona', navFaq: 'Dúvidas', headerCta: 'Solicitar site',
      eyebrow: 'PARA PEQUENOS NEGÓCIOS', heroTitle: 'Um site melhor.<br>Um preço mais simples.',
      heroText: 'Sites bonitos, adaptados para celular e pensados para sua empresa. Escolha o que precisa e pague uma única vez pela criação.',
      heroBrowse: 'Conhecer os modelos', heroHow: 'Como funciona', heroPoint1: 'Pensado para celular', heroPoint2: 'Pagamento único', heroPoint3: 'A identidade do seu negócio',
      previewCaption: 'VEJA O QUE É POSSÍVEL', heroNote: 'Simples de lançar. Feito para destacar.',
      planSmart: 'Smart Link', planBusiness: 'Business Site', planPro: 'Business Pro',
      plansEyebrow: 'A OPÇÃO CERTA PARA SUA EMPRESA', plansTitle: 'Comece com o que você precisa.', plansDescription: 'Três opções de sites. Preços claros e pagamento único.',
      popular: 'MAIS ESCOLHIDO', once: 'pagamento único', selectPlan: 'Escolher este plano',
      pricingNote: 'Preços em USD. Domínio, hospedagem, integrações pagas e atualizações recorrentes não estão incluídos.',
      howEyebrow: 'O PROCESSO', howTitle: 'Da sua ideia<br>ao seu site.',
      howIntro: 'Sem complicação. Ajudamos você a escolher, personalizar e preparar o site para entrar no ar.',
      exampleEyebrow: 'FEITO PARA SUA MARCA', exampleTitle: 'Mais do que um modelo pronto.',
      exampleText: 'Seu site precisa ter a cara do seu negócio. Adaptamos cores, conteúdo, fotos e botões de contato para seus clientes.', exampleButton: 'Escolher meu site',
      faqEyebrow: 'PERGUNTAS FREQUENTES', faqTitle: 'O que você precisa saber.',
      endEyebrow: 'VAMOS COMEÇAR', endTitle: 'Cause uma ótima primeira impressão.', endText: 'Conte um pouco sobre seu negócio. Vamos ajudar você a escolher o site ideal.', endButton: 'Solicitar um site',
      footerText: 'Presença digital, sem complicação.',
      dialogEyebrow: 'VAMOS CONVERSAR', dialogTitle: 'Conte sobre seu negócio.',
      dialogDescription: 'Vamos preparar uma mensagem de WhatsApp com seus dados. Você confere e envia.',
      dialogSelected: 'Plano escolhido', fieldName: 'Seu nome', fieldBusiness: 'Nome da empresa', fieldProfile: 'Instagram ou site (opcional)', dialogSubmit: 'Continuar no WhatsApp',
      dialogNote: 'A solicitação não é um pagamento. O escopo será confirmado antes da contratação.',
      placeholders: ['Seu nome', 'Nome da empresa', '@suaempresa'],
      planInfo: {
        smart: { name: 'Smart Link', desc: 'Uma página elegante para reunir seus links.', features: ['Página adaptada para celular', 'Links de contato e redes sociais', 'Botões de agendamento e localização', 'QR Code personalizado'] },
        business: { name: 'Business Site', desc: 'Um site de uma página para causar uma ótima impressão.', features: ['Tudo do Smart Link', 'Apresentação da empresa em uma página', 'Serviços, fotos e localização', 'Botões de contato e agendamento'] },
        pro: { name: 'Business Pro', desc: 'Um site mais completo para apresentar serviços e receber orçamentos.', features: ['Tudo do Business Site', 'Seções de pacotes e avaliações', 'Configuração de formulário de orçamento', 'Otimização básica para buscadores'] }
      },
      steps: [
        ['Escolha o site', 'Compare as opções e escolha a melhor para sua empresa.'],
        ['Envie os dados', 'Conte o nome, estilo, conteúdo e formas de contato do negócio.'],
        ['Revise e publique', 'Preparamos o site para sua avaliação e combinamos a entrega final.']
      ],
      faqs: [
        ['É realmente pagamento único?', 'Sim. O preço cobre a criação e entrega combinadas. Hospedagem, domínio, ferramentas pagas e alterações futuras são contratados à parte.'],
        ['Meu site funcionará no celular?', 'Sim. Todas as opções são pensadas para telas de celular.'],
        ['Preciso comprar domínio e hospedagem?', 'Você pode usar seu próprio provedor ou contratar esses serviços separadamente. Combinaremos isso antes de fechar.'],
        ['O que acontece quando escolho um plano?', 'O formulário prepara uma mensagem de WhatsApp com o plano e dados da empresa. Você confere e envia; não há cobrança nesta página.']
      ],
      waText: (plan, price, name, business, profile) => `Olá, WILLAI! Tenho interesse no site ${plan} (${price}, pagamento único).\nNome: ${name}\nEmpresa: ${business}\nInstagram / site: ${profile || 'Não informado'}\nGostaria de conversar sobre o projeto.`
    }
  };

  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const locale = new URLSearchParams(location.search).get('lang');
  let lang = Object.hasOwn(content, locale) ? locale : 'en';
  let currentPlan = 'business';
  const dialog = $('#contact-dialog');
  const form = $('#request-form');

  function translate() {
    const t = content[lang];
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    document.title = `${lang === 'es' ? 'Sitios web para negocios' : lang === 'pt' ? 'Sites para empresas' : 'Business websites'} | WILLAI by ELIX`;
    document.querySelectorAll('[data-t]').forEach((el) => {
      const key = el.dataset.t;
      if (t[key]) {
        if (['heroTitle', 'howTitle'].includes(key)) el.innerHTML = t[key];
        else el.textContent = t[key];
      }
    });
    const cards = plans.map((p) => {
      const info = t.planInfo[p.id];
      return `<article class="plan-card ${p.featured ? 'featured' : ''}">
        <div class="plan-visual"><img src="${p.image}" alt="${escapeHtml(info.name)} website example" loading="lazy" width="640" height="800">${p.featured ? `<span class="plan-badge">${t.popular}</span>` : ''}</div>
        <div class="plan-body"><h3 class="plan-name">${escapeHtml(info.name)}</h3><p class="plan-description">${escapeHtml(info.desc)}</p>
        <div class="price-row"><strong class="price">${p.price}</strong><span class="price-tag">${t.once}</span></div>
        <ul class="feature-list">${info.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <button class="button ${p.featured ? 'button-primary' : 'button-outline'}" type="button" data-purchase="${p.id}">${t.selectPlan}</button></div></article>`;
    }).join('');
    $('#plan-grid').innerHTML = cards;
    $('#step-grid').innerHTML = t.steps.map(([title, desc], i) => `<article class="step"><div class="step-count">0${i + 1}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p></article>`).join('');
    $('#faq-list').innerHTML = t.faqs.map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('');
    $('#language').value = lang;
    form.elements.name.placeholder = t.placeholders[0];
    form.elements.business.placeholder = t.placeholders[1];
    form.elements.profile.placeholder = t.placeholders[2];
    updateSelectedPlan();
  }

  function updateSelectedPlan() {
    const p = plans.find((item) => item.id === currentPlan);
    $('#selected-plan-name').textContent = content[lang].planInfo[p.id].name;
    $('#selected-plan-price').textContent = p.price;
  }

  function openContact(plan = 'business') {
    currentPlan = plan;
    updateSelectedPlan();
    if (!dialog.open) dialog.showModal();
    form.elements.name.focus();
  }

  function setPreview(plan) {
    const p = plans.find((item) => item.id === plan);
    if (!p) return;
    const image = $('#hero-image');
    image.src = p.image;
    image.alt = `${content[lang].planInfo[p.id].name} website example`;
    document.querySelectorAll('[data-preview]').forEach((button) => button.classList.toggle('active', button.dataset.preview === plan));
  }

  $('#language').addEventListener('change', (event) => {
    lang = event.target.value;
    const url = new URL(location.href);
    if (lang === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    translate();
  });
  document.addEventListener('click', (event) => {
    const purchase = event.target.closest('[data-purchase]');
    const preview = event.target.closest('[data-preview]');
    if (purchase) openContact(purchase.dataset.purchase);
    if (preview) setPreview(preview.dataset.preview);
  });
  $('#header-contact').addEventListener('click', () => openContact());
  $('#end-contact').addEventListener('click', () => openContact());
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const p = plans.find((item) => item.id === currentPlan);
    const message = content[lang].waText(content[lang].planInfo[p.id].name, p.price, String(data.get('name')).trim(), String(data.get('business')).trim(), String(data.get('profile')).trim());
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.location.assign(url);
  });
  $('#year').textContent = String(new Date().getFullYear());
  translate();
})();
