# WillAI Studio — Módulo Plaquinhas Inteligentes

## Arquitetura

- **Mesmo GitHub/Cloudflare Pages:** `/studio/plaquinhas/` para operação e `/p/<codigo>` para leitura.
- **Mesmo Supabase:** tabelas novas `willai_plaque_*`, sem alterar `willai_pages`.
- **QR Code e NFC sempre gravam a URL permanente** `https://willai-studio.pages.dev/p/<codigo>` (ou seu domínio definitivo).
- **Antes de vender:** QR/NFC levam a uma página “aguardando ativação”. **Depois da venda:** resposta HTTP 302 sem cache para o link direto ou para a página WillAI escolhida.
- O endereço `/p/<codigo>` é estável. **Se você trocar o domínio do sistema futuramente, a plaquinha física antiga não se atualiza**: escolha o domínio final antes da produção em escala.

## Etapas para ativar

1. Testar os arquivos desta branch numa implantação Preview do Cloudflare Pages, sem publicar na branch `main`.
2. Na conta/projeto **rnqaktkvwfsetbjsqdrj**, abrir o SQL Editor e executar a migração `supabase/migrations/20261026180000_willai_plaques.sql`. Fazer backup do esquema antes. Esta migração é **aditiva**.
3. Confirmar as novas tabelas e funções; executar `select public.willai_resolve_plaque('000000000000000000000000');` que deve retornar `{ "status": "not_found" }`.
4. Abrir `/studio/plaquinhas/` no domínio Preview e autenticar com a mesma conta do WillAI Studio. Gerar lote de 1 e verificar no Supabase antes de testar lote de 30.
5. Para testes públicos `/p/<codigo>` em Preview: confira se a função `functions/p/[code].js` está ativa nessa implantação. Se o Cloudflare Pages mudar sua configuração de builds, verifique os logs de Functions.
6. Após testes com QR, impressão e NFC, integrar a branch `feature/plaquinhas-inteligentes` em `main` e conferir no Cloudflare a implantação bem-sucedida.

**Observação:** não é necessário cadastrar variáveis de ambiente para esta primeira versão, pois a função utiliza somente a chave publicável que o site já usa. Nenhuma chave `service_role` é necessária ou deve ser publicada. Se desejar usar um outro Supabase, configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` como variáveis no projeto Cloudflare Pages.

## Opções e operação

- **Gerar lote:** 1 a 500 por operação; cada unidade é gerada em transação, salva e auditada.
- **Estoque:** pesquisar, filtrar, abrir, atualizar status, conferir vendas e acessos.
- **Ativação:** selecione a unidade, preencha empresa e cliente, escolha destino (link direto ou página publicada), mude para “Ativada” e salve.
- **Trocar destino:** use a mesma unidade e altere somente o link; o QR/NFC continua igual.
- **Exportações:** CSV com as unidades carregadas, ZIP com QR em SVG e PNG, arte 10×15 cm em PNG 300 DPI, PDF A4 com 2 artes por folha e ZIP de artes selecionadas.
- **NFC:** em navegadores que implementam Web NFC (principalmente Chrome no Android via HTTPS), clique “Gravar NFC” e aproxime a NTAG213. Outros dispositivos: “Copiar” a URL e gravar um registro NDEF de URI com NFC Tools ou aplicativo confiável.
- **Métricas:** somatório de requisições HTTP registradas por dia; **não** diferencia QR de NFC e não representa pessoas únicas.

## Segurança e limites

- As tabelas administrativas são protegidas por RLS e identidade do usuário (owner_id).
- Os códigos públicos são aleatórios de 24 caracteres hexadecimais; não usar `PL-000123` como URL pública.
- Sem acesso de visitantes aos dados dos clientes. A consulta pública só retorna `status`, `mode` e destino autorizado.
- Auditoria de alterações no banco. Plaquinhas não possuem permissão DELETE por usuário autenticado.
- Contadores públicos podem incluir robôs/visitas repetidas; para tráfego elevado, ativar rate limiting no Cloudflare e observar o consumo do Supabase.
- São usadas dependências front-end de CDNs com versão fixada para QRCode, jsPDF e JSZip. Para funcionamento offline, hospede cópias locais após revisão de licenças e hashes de integridade.
- **Atenção:** a exportação usa a URL do domínio onde o painel foi acessado. Se usar um Preview para imprimir, os QR Codes apontarão para o domínio Preview. Para impressão final, abrir o painel na URL do domínio definitivo.
- A instalação não altera as páginas antigas, que continuam sendo servidas por `/:slug`.

## Checklist funcional

- [ ] Login no painel novo com usuário real.
- [ ] Gerar 30 e conferir exatamente 30 registros novos no Supabase.
- [ ] Exportar SVG/PNG e ler cada QR com câmera.
- [ ] Ler disponível e ver mensagem de aguardo.
- [ ] Ativar para Google com URL válida e confirmar HTTP 302.
- [ ] Trocar destino para Instagram, confirmar HTTP 302 novo com o MESMO código.
- [ ] Gravar NFC usando a MESMA URL (sem regravar após mudança do destino).
- [ ] Suspender e ver mensagem de suspenso; reativar.
- [ ] Conferir totais e trilha de auditoria.
- [ ] Testar A4 em 100% e conferir régua (150×100 mm por arte girada).

