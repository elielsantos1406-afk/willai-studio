'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root,'qr/qr-premium.js'),'utf8');
const app = fs.readFileSync(path.join(root,'qr/qr-app.js'),'utf8');
const html = fs.readFileSync(path.join(root,'qr/index.html'),'utf8');
const style = fs.readFileSync(path.join(root,'qr/qr-premium.css'),'utf8');
const window = {};
vm.runInNewContext(source,{window,URL,encodeURIComponent});
const premium = window.WILLAI_QR_PREMIUM;
test('ambos os módulos possuem sintaxe JavaScript válida',()=>{
  new vm.Script(source);new vm.Script(app);
});
test('modelo é carregado antes do aplicativo e preserva login e ativação',()=>{
  assert.ok(html.indexOf('/qr/qr-premium.js') < html.indexOf('/qr/qr-app.js'));
  assert.ok(app.includes("willai_qr_request_claim"));
  assert.ok(app.includes("willai_qr_owned"));
  assert.ok(app.includes("willai_qr_save"));
});
test('QR público ocupa viewport inteira sem header administrativo',()=>{
  assert.match(style,/body\.public-mode\s+>\s+header/);
  assert.match(style,/min-height:100dvh/);
  assert.match(app,/document\.body\.classList\.toggle\('public-mode'/);
});
test('cinco estrelas abertas no mesmo link direto do Google',()=>{
  const h=premium.card({google:'https://g.page/r/123/review'},true);
  assert.equal((h.match(/class="qr-star"/g)||[]).length,5);
  assert.equal((h.match(/href="https:\/\/g\.page\/r\/123\/review"/g)||[]).length,5);
  assert.ok(!h.includes('type="radio"'));
});
test('sem avaliação configurada não aponta para destino falso',()=>{
  const h=premium.card({google:''},true);
  assert.equal((h.match(/class="qr-star qr-star-disabled"/g)||[]).length,5);
  assert.ok(!h.includes('href="#"'));
  assert.match(premium.validate({google:''}),/Google/);
});
test('mensagem de WhatsApp e formato brasileiro com DDD',()=>{
  const d=premium.normalize({google:'https://g.page/r/123/review'});
  d.buttons[0].url='41999999999';
  d.buttons[0].message='Olá! Quero agendar.';
  const h=premium.card(d,true);
  assert.ok(h.includes('https://wa.me/5541999999999?text=Ol%C3%A1!%20Quero%20agendar.'));
});
test('link inválido e protocolos perigosos nunca viram botões públicos',()=>{
  const h=premium.card({google:'https://g.page/r/123/review',buttons:[{title:'Malicioso',url:'javascript:alert(1)',type:'link'}]},true);
  assert.ok(!h.includes('Malicioso</span>'));
  assert.ok(!h.includes('href="javascript:'));
});
test('remover todos os botões permanece removido na próxima edição',()=>{
  const d=premium.normalize({premiumVersion:2,buttons:[]});
  assert.equal(d.buttons.length,0);
});
test('conteúdo personalizado é escapado e temas configuráveis existem',()=>{
  const h=premium.card({google:'https://g.page/r/123/review',name:'Empresa <script>alert(1)</script>'},true);
  assert.ok(h.includes('&lt;script&gt;'));
  assert.ok(!h.includes('<script>'));
  assert.equal(Object.keys(premium.presets).length,5);
});
test('arquivo SQL versionado publica e protege dados por proprietário',()=>{
  const sql=fs.readFileSync(path.join(root,'sql/20261028_willai_qr_premium_publicacao.sql'),'utf8');
  assert.ok(sql.includes('published_at=now()'));
  assert.ok(sql.includes('owner_id=(SELECT auth.uid())'));
  assert.ok(sql.includes("status','pending'"));
});
