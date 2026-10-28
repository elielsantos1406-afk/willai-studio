
(async()=>{
 const root=document.getElementById('app'),cfg=window.WILLAI_CONFIG;
 const slug=decodeURIComponent(location.pathname.split('/').filter(Boolean)[0]||'');
 function notice(title,description){document.title=title+' | WillAI';root.innerHTML='';const n=document.createElement('div');n.className='loading';const h=document.createElement('strong');h.textContent=title;const p=document.createElement('small');p.textContent=description;n.append(h,p);root.append(n)}
 if(!slug||slug==='index.html'){notice('WillAI • Páginas digitais','Acesse a página da empresa usando o link fornecido ou o QR Code.');return}
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){notice('Endereço inválido','Verifique o endereço recebido.');return}
 try{
  const url=cfg.url+'/rest/v1/willai_pages?slug=eq.'+encodeURIComponent(slug)+'&published=eq.true&select=name,config&limit=1';
  const response=await fetch(url,{headers:{apikey:cfg.publishableKey,'Accept':'application/json'}});
  if(!response.ok)throw Error('Erro ao consultar a página ('+response.status+').');
  const rows=await response.json();if(!rows?.[0]?.config){notice('Página não encontrada','A empresa ainda não publicou esta página ou o endereço está incorreto.');return}
  const data=rows[0].config;window.WILLAI_PAGE=data;
  const colors=data.colors||{};const rootStyle=document.documentElement.style;
  for(const [k,prop] of [['primary','--primary'],['accent','--accent'],['background','--bg']])if(/^#[0-9a-f]{6}$/i.test(colors[k]||''))rootStyle.setProperty(prop,colors[k]);
  document.title=(rows[0].name||data.name||'Empresa')+' | '+(data.mode==='reviews'?'Avaliações':'Cartão digital');
  if(data.name){let d=document.querySelector('meta[name="description"]');if(!d){d=document.createElement('meta');d.name='description';document.head.append(d)}d.content=(data.name+' — '+(data.category||'')).slice(0,155)}
  const sc=document.createElement('script');sc.src='/assets/page.js';sc.defer=true;document.body.append(sc);
 }catch(err){console.error(err);notice('Não foi possível abrir esta página','Tente novamente. Se persistir, confirme a conexão do Supabase e a publicação desta empresa.');}
})();
