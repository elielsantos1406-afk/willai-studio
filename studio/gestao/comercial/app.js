(() => {
'use strict';

const $ = id => document.getElementById(id);
const cfg = window.WILLAI_CONFIG || {};
const sessionKey = 'willai_portal_session';
const stageNames = {
 quote: 'Orçamento enviado',
 awaiting_deposit: 'Aguardando sinal',
 prototype_approved: 'Protótipo aprovado',
 in_progress: 'Em desenvolvimento',
 initial_tests: 'Testes iniciais',
 final_tests: 'Testes finais',
 awaiting_final_payment: 'Aguardando pagamento final',
 completed: 'Concluído',
 cancelled: 'Cancelado'
};
const screens = {
 overview: ['Visão geral', 'Orçamentos, projetos e financeiro no mesmo lugar.'],
 projects: ['Projetos e orçamentos', 'Organize clientes e acompanhe as etapas dos serviços.'],
 finance: ['Caixa e movimentações', 'Controle o que recebeu, pagou e ainda está pendente.']
};
let session = null;
let projects = [];
let transactions = [];
let authorized = false;
let editingProject = null;
let editingTransaction = null;
let importingQuote = null;
let currentView = 'overview';
let loading = false;

function escapeHTML(value) {
 return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
 }[char]));
}
function money(value) {
 return (Number(value) || 0).toLocaleString('pt-BR', {
  style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2
 });
}
function amount(value) {
 const n = Number(String(value).trim().replace(',', '.'));
 return Number.isFinite(n) ? n : NaN;
}
function localDay() {
 const d = new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function localMonth() { return localDay().slice(0,7); }
function dateText(date) {
 if (!date) return 'Sem data';
 const d = new Date(String(date).slice(0,10)+'T12:00:00');
 return Number.isNaN(d.getTime()) ? 'Sem data' : d.toLocaleDateString('pt-BR');
}
function text(value) { return String(value == null ? '' : value); }
function stageTag(stage) {
 let kind = 'tag-info';
 if (stage === 'completed') kind = 'tag-success';
 if (stage === 'quote') kind = 'tag-neutral';
 if (stage === 'awaiting_deposit' || stage === 'awaiting_final_payment') kind = 'tag-warning';
 if (stage === 'cancelled') kind = 'tag-danger';
 return '<span class="tag '+kind+'">'+escapeHTML(stageNames[stage]||stage)+'</span>';
}
function statusTag(transaction) {
 const paid = transaction.status === 'paid';
 return '<span class="tag '+(paid?'tag-success':'tag-warning')+'">'+
  (paid?(transaction.type==='income'?'Recebido':'Pago'):'Pendente')+'</span>';
}
function notify(message, error) {
 const el = $('notice');
 el.hidden = !message;
 el.className = 'notice'+(error?' error':'');
 el.textContent = message || '';
}
function formError(which, message) {
 const node = $(which === 'project' ? 'projectFormError' : 'transactionFormError');
 node.hidden = !message;
 node.textContent = message || '';
}
function sessionMissing(message) {
 $('gateMessage').textContent = message;
 $('shell').hidden = true;
 $('accessGate').hidden = false;
}
async function api(path, options) {
 if (!cfg.url || !cfg.publishableKey) throw Error('A configuração do Supabase está indisponível.');
 if (!session || !session.access_token) throw Error('Sessão expirada. Entre novamente no ADM.');
 const opt = options || {};
 const headers = {
  apikey:cfg.publishableKey, 'Content-Type':'application/json',Accept:'application/json',
  Authorization:'Bearer '+session.access_token,
  ...(opt.headers||{})
 };
 const request = () => fetch(cfg.url+path,{...opt,headers});
 let response = await request();
 if (response.status === 401 && session.refresh_token) {
  const refresh = await fetch(cfg.url+'/auth/v1/token?grant_type=refresh_token',{
   method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},
   body:JSON.stringify({refresh_token:session.refresh_token})
  });
  if (refresh.ok) {
   session = await refresh.json();
   sessionStorage.setItem(sessionKey,JSON.stringify(session));
   headers.Authorization = 'Bearer '+session.access_token;
   response = await request();
  }
 }
 if (!response.ok) {
  const json = await response.json().catch(() => ({}));
  throw Error(json.message||json.error_description||json.error||('Falha HTTP '+response.status));
 }
 if (response.status === 204) return null;
 const raw = await response.text();
 return raw ? JSON.parse(raw) : null;
}
function currentProject(id) { return projects.find(p => p.id === id); }
function projectIncome(projectId) {
 return transactions.filter(t => t.type==='income' && t.status==='paid' && t.project_id===projectId)
  .reduce((sum,t) => sum+Number(t.amount||0),0);
}
function projectOwed(p) {
 if (!p || ['quote','cancelled'].includes(p.stage)) return 0;
 return Math.max(0, Number(p.total_amount||0)-projectIncome(p.id));
}
function financeOverview() {
 const activeContract = projects.filter(p=>p.stage!=='quote'&&p.stage!=='cancelled');
 const contracted = activeContract.reduce((sum,p)=>sum+Number(p.total_amount||0),0);
 const projectReceivable = activeContract.reduce((sum,p)=>sum+projectOwed(p),0);
 const standaloneReceivable = transactions
  .filter(t=>t.type==='income'&&t.status==='pending'&&!t.project_id)
  .reduce((sum,t)=>sum+Number(t.amount||0),0);
 const month = $('periodInput').value;
 const paid = transactions.filter(t=>t.status==='paid'&&(!month||String(t.paid_date||'').startsWith(month)));
 const income = paid.filter(t=>t.type==='income').reduce((sum,t)=>sum+Number(t.amount||0),0);
 const expense = paid.filter(t=>t.type==='expense').reduce((sum,t)=>sum+Number(t.amount||0),0);
 const activeCount = projects.filter(p=>!['quote','cancelled','completed'].includes(p.stage)).length;
 return {contracted,receivable:projectReceivable+standaloneReceivable,income,expense,balance:income-expense,activeCount};
}
function projectName(id) {
 return currentProject(id)?.title || 'Projeto não encontrado';
}
function empty(message, columns) {
 return '<tr><td colspan="'+(columns||6)+'"><div class="empty-state">'+escapeHTML(message)+'</div></td></tr>';
}
function recentProjectList() {
 const recent = projects.slice(0,4);
 $('recentProjects').innerHTML = recent.length ? recent.map(p =>
  '<div class="mini-item"><div><strong>'+escapeHTML(p.title)+'</strong><small>'+escapeHTML(p.client_name)+
  ' · '+escapeHTML(stageNames[p.stage]||p.stage)+'</small></div><b>'+money(p.total_amount)+'</b></div>'
 ).join('') : '<div class="empty-state">Nenhum projeto cadastrado. Use “Novo projeto” para começar.</div>';
}
function pendingPaymentsList() {
 const manual = transactions.filter(t=>t.type==='income'&&t.status==='pending').map(t=>({
  id:t.id,title:t.title,subtitle:currentProject(t.project_id)?.client_name||'Recebimento avulso',
  due:t.due_date,amount:Number(t.amount||0)
 }));
 const linked = new Set(manual.map(p=>transactions.find(t=>t.id===p.id)?.project_id).filter(Boolean));
 const inferred = projects.filter(p=>projectOwed(p)>0&&!linked.has(p.id)).map(p=>({
  id:p.id,title:p.title,subtitle:p.client_name+' · Saldo previsto do contrato',
  due:null,amount:projectOwed(p)
 }));
 const all = manual.concat(inferred).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).slice(0,5);
 $('pendingPayments').innerHTML = all.length ? all.map(p=>
  '<div class="mini-item"><div><strong>'+escapeHTML(p.title)+'</strong><small>'+
  escapeHTML(p.subtitle)+(p.due?' · Vence em '+dateText(p.due):'')+'</small></div><b>'+
  money(p.amount)+'</b></div>'
 ).join('') : '<div class="empty-state">Sem recebimentos pendentes registrados.</div>';
}
function renderOverview() {
 const d = financeOverview();
 $('metricContracted').textContent = money(d.contracted);
 $('metricReceivable').textContent = money(d.receivable);
 $('metricIncome').textContent = money(d.income);
 $('metricExpense').textContent = money(d.expense);
 $('metricBalance').textContent = money(d.balance);
 $('metricActive').textContent = String(d.activeCount);
 recentProjectList();
 pendingPaymentsList();
}
function renderProjects() {
 const query = $('projectSearch').value.trim().toLocaleLowerCase('pt-BR');
 const status = $('projectStageFilter').value;
 const visible = projects.filter(p=>{
  if (status && p.stage!==status) return false;
  return [p.client_name,p.title,p.service,p.whatsapp].some(v=>text(v).toLocaleLowerCase('pt-BR').includes(query));
 });
 $('projectsCount').textContent = visible.length+' projeto(s) exibido(s) · '+projects.length+' cadastrado(s).';
 $('projectsBody').innerHTML = visible.length ? visible.map(p=>{
  const phone = text(p.whatsapp).replace(/\D/g,'');
  const direct = phone.length===10||phone.length===11?'55'+phone:phone;
  const wa = /^55\d{10,11}$/.test(direct)
   ? '<a href="https://wa.me/'+encodeURIComponent(direct)+'" target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp">WhatsApp ↗</a>' : '';
  return '<tr><td><strong>'+escapeHTML(p.title)+'</strong><small>'+escapeHTML(p.client_name)+
  (p.service?' · '+escapeHTML(p.service):'')+'</small><small>'+
  (p.expected_delivery?'Entrega: '+dateText(p.expected_delivery)+' · ':'')+wa+'</small></td><td>'+
  stageTag(p.stage)+'</td><td><span class="money">'+money(p.total_amount)+'</span></td><td>'+
  '<span class="money positive">'+money(projectIncome(p.id))+'</span></td><td>'+
  '<span class="money">'+money(projectOwed(p))+'</span></td><td>'+
  '<div class="row-actions"><button class="button button-quiet button-small" data-project-edit="'+escapeHTML(p.id)+'">Editar</button>'+
  '<button class="button button-secondary button-small" data-project-pay="'+escapeHTML(p.id)+'">Lançar $</button></div></td></tr>';
 }).join('') : empty('Nenhum projeto corresponde à pesquisa.',6);
}
function renderTransactions() {
 const query = $('transactionSearch').value.trim().toLocaleLowerCase('pt-BR');
 const filter = $('transactionFilter').value;
 const visible = transactions.filter(t=>{
  if (filter==='income'||filter==='expense') {if(t.type!==filter)return false;}
  if (filter==='pending'||filter==='paid') {if(t.status!==filter)return false;}
  return [t.title,t.category,t.method,currentProject(t.project_id)?.client_name,projectName(t.project_id)].some(v=>
   text(v).toLocaleLowerCase('pt-BR').includes(query)
  );
 });
 $('transactionsCount').textContent = visible.length+' lançamento(s) exibido(s) · '+transactions.length+' cadastrado(s).';
 $('transactionsBody').innerHTML = visible.length ? visible.map(t=>{
  const receiving=t.type==='income';
  const confirm = t.status==='pending'
   ? '<button class="button button-small button-quiet" data-txn-confirm="'+escapeHTML(t.id)+'">Confirmar</button>' : '';
  return '<tr><td><strong>'+escapeHTML(t.title)+'</strong><small>'+escapeHTML(t.category||'Outros')+
   (t.project_id?' · '+escapeHTML(projectName(t.project_id)):' · Avulso')+'</small></td><td>'+
   '<span class="tag '+(receiving?'tag-info':'tag-danger')+'">'+(receiving?'Entrada':'Saída')+'</span></td><td>'+
   '<span class="money '+(receiving?'positive':'negative')+'">'+(receiving?'+ ':'− ')+money(t.amount)+'</span></td><td>'+
   '<span>'+dateText(t.status==='paid'?t.paid_date:t.due_date)+'</span><small>'+
   (t.status==='paid'?'Pagamento':'Vencimento previsto')+'</small></td><td>'+statusTag(t)+'</td><td>'+
   '<div class="row-actions">'+confirm+
   '<button class="button button-secondary button-small" data-txn-edit="'+escapeHTML(t.id)+'">Editar</button>'+
   '<button class="button button-secondary button-small" data-txn-delete="'+escapeHTML(t.id)+'" aria-label="Excluir lançamento">×</button></div></td></tr>';
 }).join('') : empty('Nenhuma movimentação corresponde à pesquisa.',6);
}
function render() { renderOverview();renderProjects();renderTransactions(); }
function switchView(next) {
 if (!screens[next]) return;
 currentView=next;
 Object.keys(screens).forEach(name=>$('view-'+name).classList.toggle('is-hidden',name!==next));
 document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.view===next));
 $('viewTitle').textContent=screens[next][0];
 $('viewSubtitle').textContent=screens[next][1];
 window.scrollTo({top:0,behavior:'instant'});
}
async function refreshData() {
 if (!authorized || loading) return;
 loading = true;
 $('refreshButton').disabled=true;
 try {
  const [p,t] = await Promise.all([
   api('/rest/v1/willai_commercial_projects?select=*&order=created_at.desc&limit=1000'),
   api('/rest/v1/willai_financial_transactions?select=*&order=created_at.desc&limit=1000')
  ]);
  if (!Array.isArray(p)||!Array.isArray(t)) throw Error('O servidor não retornou as listas esperadas.');
  projects=p;
  transactions=t;
  render();
  $('lastSync').textContent='Atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  if (projects.length>=1000||transactions.length>=1000) notify('O limite inicial de 1000 registros por lista foi atingido. Use a exportação e implemente paginação para consultar os anteriores.',true);
  else notify('',false);
 } catch(e) {
  notify('Não foi possível carregar os dados: '+e.message,true);
 } finally {
  loading=false;
  $('refreshButton').disabled=false;
 }
}
function showDialog(dialogId) {
 const dialog=$(dialogId);
 if (typeof dialog.showModal === 'function') dialog.showModal();
 else dialog.setAttribute('open','');
}
function closeDialog(dialogId) {
 const dialog=$(dialogId);
 if (typeof dialog.close === 'function') dialog.close();
 else dialog.removeAttribute('open');
}
function openProject(project,quote) {
 const form=$('projectForm');form.reset();editingProject=project?.id||null;
 importingQuote=quote?.id||null;
 formError('project','');
 $('projectDialogTitle').textContent=project?'Editar projeto':quote?'Projeto de orçamento recebido':'Novo projeto';
 const fields=form.elements;
 if (project) {
  ['client_name','whatsapp','title','service','stage','notes'].forEach(k=>fields[k].value=text(project[k]));
  fields.total_amount.value=Number(project.total_amount||0).toFixed(2);
  fields.expected_delivery.value=project.expected_delivery||'';
 } else if (quote) {
  fields.client_name.value=quote.name||'';
  fields.whatsapp.value=quote.whatsapp||'';
  fields.title.value=quote.service||'Projeto solicitado';
  fields.service.value=quote.service||'';
  fields.stage.value='quote';
  fields.notes.value=quote.description||'';
  fields.total_amount.value='0.00';
 } else {
  fields.stage.value='quote';fields.total_amount.value='0.00';
 }
 showDialog('projectDialog');
}
function openTransaction(entry,project) {
 const form=$('transactionForm');form.reset();editingTransaction=entry?.id||null;formError('transaction','');
 $('transactionDialogTitle').textContent=entry?'Editar lançamento':project?'Registrar pagamento de projeto':'Novo lançamento';
 const sel=$('entryProject');
 sel.innerHTML='<option value="">Sem projeto — lançamento avulso</option>'+projects.map(p=>
  '<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.client_name+' — '+p.title)+'</option>'
 ).join('');
 const fields=form.elements;
 if (entry) {
  ['type','status','title','category','method','notes'].forEach(k=>fields[k].value=text(entry[k]));
  fields.amount.value=Number(entry.amount).toFixed(2);
  fields.project_id.value=entry.project_id||'';
  fields.due_date.value=entry.due_date||'';
  fields.paid_date.value=entry.paid_date||'';
 } else {
  fields.type.value='income';
  fields.status.value='paid';
  fields.paid_date.value=localDay();
  fields.project_id.value=project?.id||'';
  fields.category.value=project?'Sinal':'Outros';
  fields.title.value=project?'Pagamento — '+project.title:'';
  const owing=project?projectOwed(project):0;
  if (owing>0) fields.amount.value=owing.toFixed(2);
 }
 updatePaidInput();
 showDialog('transactionDialog');
}
function updatePaidInput() {
 const paid = $('entryStatus').value === 'paid';
 $('entryPaidDate').disabled=!paid;
 $('entryPaidDate').required=paid;
 if (!paid) $('entryPaidDate').value='';
 else if (!$('entryPaidDate').value) $('entryPaidDate').value=localDay();
}
async function saveProject(event) {
 event.preventDefault();
 if (!authorized) return;
 const form=$('projectForm'),f=form.elements,button=$('saveProject');
 const total=amount(f.total_amount.value);
 if (!Number.isFinite(total)||total<0) {formError('project','Informe um valor válido.');return;}
 const payload={
  client_name:f.client_name.value.trim(),whatsapp:f.whatsapp.value.trim(),
  title:f.title.value.trim(),service:f.service.value.trim(),stage:f.stage.value,
  total_amount:total,expected_delivery:f.expected_delivery.value||null,
  notes:f.notes.value.trim(),updated_at:new Date().toISOString()
 };
 if (payload.client_name.length<2||payload.title.length<2||!stageNames[payload.stage]) {
  formError('project','Preencha cliente, projeto e etapa.');return;
 }
 if (!editingProject && importingQuote) payload.source_quote_id=importingQuote;
 button.disabled=true;formError('project','');
 try {
  const url='/rest/v1/willai_commercial_projects'+(editingProject?'?id=eq.'+encodeURIComponent(editingProject):'');
  const result=await api(url,{method:editingProject?'PATCH':'POST',
   headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
  if (!Array.isArray(result)||result.length!==1) throw Error('O banco não confirmou a gravação.');
  closeDialog('projectDialog');
  notify(editingProject?'Projeto atualizado com sucesso.':'Projeto cadastrado com sucesso.');
  await refreshData();
  switchView('projects');
 } catch(e) {
  formError('project',/duplicate key/i.test(e.message)?'Este orçamento já foi convertido em projeto.':e.message);
 } finally {button.disabled=false;}
}
async function saveTransaction(event) {
 event.preventDefault();
 if (!authorized) return;
 const form=$('transactionForm'),f=form.elements,button=$('saveTransaction');
 const value=amount(f.amount.value);
 if (!Number.isFinite(value)||value<=0) {formError('transaction','Informe um valor maior que zero.');return;}
 if (!['income','expense'].includes(f.type.value)||!['paid','pending'].includes(f.status.value)) {
  formError('transaction','Tipo ou situação inválida.');return;
 }
 const isPaid=f.status.value==='paid';
 if (isPaid&&!f.paid_date.value) {formError('transaction','Informe a data do pagamento.');return;}
 const payload={
  type:f.type.value,status:f.status.value,title:f.title.value.trim(),
  category:f.category.value.trim()||'Outros',amount:value,project_id:f.project_id.value||null,
  due_date:f.due_date.value||null,paid_date:isPaid?f.paid_date.value:null,
  method:f.method.value,notes:f.notes.value.trim(),updated_at:new Date().toISOString()
 };
 if (payload.title.length<2) {formError('transaction','Informe uma descrição.');return;}
 if (payload.project_id && !currentProject(payload.project_id)) {
  formError('transaction','Selecione um projeto válido.');return;
 }
 button.disabled=true;formError('transaction','');
 try {
  const url='/rest/v1/willai_financial_transactions'+(editingTransaction?'?id=eq.'+encodeURIComponent(editingTransaction):'');
  const result=await api(url,{method:editingTransaction?'PATCH':'POST',
   headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
  if (!Array.isArray(result)||result.length!==1) throw Error('O banco não confirmou a gravação.');
  closeDialog('transactionDialog');
  notify(editingTransaction?'Lançamento atualizado.':'Lançamento registrado no controle financeiro.');
  await refreshData();
  switchView('finance');
 } catch(e) {
  formError('transaction',e.message);
 } finally {button.disabled=false;}
}
async function confirmTransaction(id) {
 const entry=transactions.find(t=>t.id===id);
 if (!entry || entry.status!=='pending') return;
 const word=entry.type==='income'?'recebido':'pago';
 if (!window.confirm('Confirmar que '+money(entry.amount)+' foi realmente '+word+' hoje?')) return;
 try {
  const result=await api('/rest/v1/willai_financial_transactions?id=eq.'+encodeURIComponent(id),{
   method:'PATCH',headers:{Prefer:'return=representation'},
   body:JSON.stringify({status:'paid',paid_date:localDay(),updated_at:new Date().toISOString()})
  });
  if (!Array.isArray(result)||result.length!==1) throw Error('O banco não confirmou a alteração.');
  notify('Pagamento confirmado. O caixa foi atualizado.');
  await refreshData();
 } catch(e) {notify('Falha ao confirmar: '+e.message,true);}
}
async function deleteTransaction(id) {
 const entry=transactions.find(t=>t.id===id);
 if (!entry) return;
 if (!window.confirm('Excluir definitivamente o lançamento "'+entry.title+'" de '+money(entry.amount)+'? Essa ação altera os totais do financeiro.')) return;
 try {
  const result=await api('/rest/v1/willai_financial_transactions?id=eq.'+encodeURIComponent(id),{
   method:'DELETE',headers:{Prefer:'return=representation'}
  });
  if (!Array.isArray(result)||result.length!==1) throw Error('O banco não confirmou a exclusão.');
  notify('Lançamento excluído. Os totais foram recalculados.');
  await refreshData();
 } catch(e) {notify('Falha ao excluir: '+e.message,true);}
}
function exportCSV(filename,rows,columns) {
 function csvCell(value) {
  const str=String(value==null?'':value);
  const safe=/^[=+\-@\t\r]/.test(str)?"'"+str:str;
  return '"'+safe.replace(/"/g,'""')+'"';
 }
 const text=[columns.map(c=>csvCell(c[0])).join(';')]
  .concat(rows.map(row=>columns.map(c=>csvCell(row[c[1]])).join(';'))).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');
 a.href=url;a.download=filename+'-'+localDay()+'.csv';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function exportProjects() {
 exportCSV('willai-projetos',projects,[
  ['Cliente','client_name'],['WhatsApp','whatsapp'],['Projeto','title'],['Serviço','service'],
  ['Etapa','stage'],['Valor total (R$)','total_amount'],['Previsão de entrega','expected_delivery'],
  ['Observações','notes'],['Cadastrado em','created_at']
 ]);
}
function exportTransactions() {
 const records=transactions.map(t=>({...t,projeto:projectName(t.project_id)}));
 exportCSV('willai-financeiro',records,[
  ['Tipo','type'],['Situação','status'],['Descrição','title'],['Categoria','category'],
  ['Projeto','projeto'],['Valor (R$)','amount'],['Vencimento','due_date'],
  ['Data do pagamento','paid_date'],['Forma de pagamento','method'],
  ['Observações','notes'],['Criado em','created_at']
 ]);
}
async function loadQuoteFromLink() {
 const quoteId=new URLSearchParams(location.search).get('quote');
 if (!quoteId) return;
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quoteId)) {
  notify('Identificador do orçamento inválido.',true);return;
 }
 const existing=projects.find(p=>p.source_quote_id===quoteId);
 if (existing) {
  switchView('projects');
  notify('Este orçamento já possui um projeto: '+existing.title+'.');
  openProject(existing);
  return;
 }
 try {
  const arr=await api('/rest/v1/willai_quote_requests?select=id,name,whatsapp,service,description&id=eq.'+encodeURIComponent(quoteId)+'&limit=1');
  if (!Array.isArray(arr)||!arr.length) throw Error('Orçamento não encontrado.');
  switchView('projects');
  openProject(null,arr[0]);
  notify('Dados importados do orçamento recebido. Confira o valor e salve para criar o projeto.');
 } catch(e) {notify('Não foi possível abrir a solicitação: '+e.message,true);}
}
async function init() {
 $('periodInput').value=localMonth();
 try { session=JSON.parse(sessionStorage.getItem(sessionKey)||'null'); } catch {}
 if (!session?.access_token) {
  sessionMissing('Entre com sua conta administrativa no site da WILLAI para acessar projetos e financeiro.');
  return;
 }
 try {
  const arr=await api('/rest/v1/willai_portal_admins?select=user_id&limit=1');
  if (!Array.isArray(arr)||arr.length===0) {
   sessionMissing('Esta área é exclusiva de superadministradores. Seu acesso atual não tem essa permissão.');
   return;
  }
  authorized=true;
  $('shell').hidden=false;
  $('accessGate').hidden=true;
  await refreshData();
  await loadQuoteFromLink();
 } catch(e) {
  sessionMissing('Não foi possível validar seu acesso: '+e.message);
 }
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button, [data-view]');
 if (!button) return;
 const action=button.dataset;
 if (action.view) {switchView(action.view);return;}
 if (action.close) {closeDialog(action.close);return;}
 if (!authorized) return;
 if (action.projectEdit) {openProject(currentProject(action.projectEdit));return;}
 if (action.projectPay) {openTransaction(null,currentProject(action.projectPay));return;}
 if (action.txnEdit) {openTransaction(transactions.find(t=>t.id===action.txnEdit));return;}
 if (action.txnConfirm) {confirmTransaction(action.txnConfirm);return;}
 if (action.txnDelete) {deleteTransaction(action.txnDelete);return;}
});
$('refreshButton').addEventListener('click',refreshData);
$('newProject').addEventListener('click',()=>openProject(null,null));
$('newTransaction').addEventListener('click',()=>openTransaction(null,null));
$('projectForm').addEventListener('submit',saveProject);
$('transactionForm').addEventListener('submit',saveTransaction);
$('entryStatus').addEventListener('change',updatePaidInput);
$('projectSearch').addEventListener('input',renderProjects);
$('projectStageFilter').addEventListener('change',renderProjects);
$('transactionSearch').addEventListener('input',renderTransactions);
$('transactionFilter').addEventListener('change',renderTransactions);
$('periodInput').addEventListener('change',renderOverview);
$('exportProjects').addEventListener('click',exportProjects);
$('exportTransactions').addEventListener('click',exportTransactions);
init();
})();
