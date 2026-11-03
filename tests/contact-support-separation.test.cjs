// Regressões de navegação e separação de atendimentos WillAI.
// npm-free: node --test tests/contact-support-separation.test.cjs
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const portal=read('portal/index.html');
const adminPortal=read('studio/portal/index.html');
const manager=read('studio/gestao/index.html');
const router=read('assets/router.js');
const migration=read('sql/20261102_willai_orcamentos_suporte.sql');

test('Public navigation accepts support route',()=>{
 assert.match(router,/['"]suporte['"]/);
 assert.match(portal,/r==='suporte'\)html=supportPage\(\)/);
 assert.match(portal,/portalPublicRoutes=new Set\([^)]*'suporte'/);
});
test('Orçamento and suporte are distinct form submissions',()=>{
 assert.match(portal,/id="willai-quote-form"/);
 assert.match(portal,/id="willai-support-form"/);
 assert.match(portal,/isSupport\?'willai_support_requests':'willai_quote_requests'/);
 assert.match(portal,/name="issue_type"/);
 assert.match(portal,/name="privacy"/);
 assert.match(portal,/name="website"/);
 assert.match(portal,/aria-current="page"/);
 assert.match(adminPortal,/id="willai-support-form"/);
});
test('Admin support requests are restricted and use their own queue',()=>{
 assert.match(manager,/id="supportView"/);
 assert.match(manager,/\['access','quotes','support'\]\.includes\(next\)&&!admin/);
 assert.match(manager,/data-support-status/);
 assert.match(manager,/rest\/v1\/willai_support_requests/);
 assert.match(manager,/shortcutSupport/);
});
test('Contact database policies are checked into version control',()=>{
 assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/GRANT INSERT ON TABLE public\.willai_quote_requests TO anon, authenticated/);
 assert.match(migration,/CREATE POLICY willai_support_create/);
 assert.match(migration,/CREATE POLICY willai_support_admin_read/);
 assert.match(migration,/CREATE POLICY willai_support_admin_update/);
});
test('QR fallback uses current loader and bootstrap',()=>{
 assert.match(router,/script\[src\^="\/qr\/qr-app\.js"\]/);
 assert.match(router,/bootstrapScript\.textContent=bootstrap\.textContent/);
 assert.match(router,/loader\.src=qrScript\.getAttribute\('src'\)/);
});
test('No other city or QR page was replaced',()=>{
 assert.match(portal,/function cityCuritibaPremium\(/);
 assert.match(portal,/pinhais:/);
 assert.match(portal,/movimento-empreendedor-arte-premium/);
});
