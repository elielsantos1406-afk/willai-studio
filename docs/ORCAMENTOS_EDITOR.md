# WillAI — correções da página inicial, editor e orçamentos

## Onde está a atualização
Branch: feature/portal-orcamentos-editor
Base: feature/portal-seguranca-gestao — não foi enviada à produção.

## Antes de testar envio de orçamentos e publicação de fotos
1. Abra o Supabase CORRETO rnqaktkvwfsetbjsqdrj, faça backup e confirme que é o projeto do Studio.
2. Execute `sql/20261027_willai_orcamentos_e_capa.sql` no SQL Editor.
3. Confirme `willai_quote_requests` no Table Editor e o bucket público `willai-public` em Storage.
4. Confirme que seu usuário já pertence a `willai_portal_admins`.
5. Não coloque senhas ou a chave service_role no navegador.

## Teste como visitante (janela anônima)
- A URL de preview terminando com / deve abrir a página inicial, não o editor.
- Navegue por Serviços, Projeto, Portfólio e Contato.
- Em /contato, preencha nome, WhatsApp com DDD, serviço e descrição detalhada da ideia.
- Após envio, a confirmação deve aparecer. Não exibe os dados dos clientes no site.

## Teste como administrador
- Entre em /login e depois /studio/gestao/ → Orçamentos.
- Confira a solicitação teste e mude status para Contatado.
- Em /studio/portal/, a página inicial abre antes do painel.
- Clique Editar portal → Início / Capa, envie JPG, PNG ou WebP e clique Salvar e publicar.
- Confira a imagem abrindo a homepage pública em outra aba.
- Para novo projeto: Portfólio → Adicionar projeto → preencher → Salvar e publicar.
- Para nova cidade: Cidades → Nova cidade → personalizar → Salvar e publicar.

## Observações
- Os registros de orçamentos são privados (RLS); apenas superadministradores podem ler e atualizar.
- O formulário público permite enviar solicitações sem criar conta. Para proteger produção de bots, futuramente adicionar validação Cloudflare Turnstile com verificação no servidor.
- A criação de orçamentos depende da migração SQL; sem ela o formulário exibe uma falha clara, não confirmação falsa.
- O envio das imagens ao Storage depende do bucket e da política SQL; não é possível confirmar gravação no Supabase com o conector desta sessão.
- O DNS e o domínio willai.com.br só devem apontar para a versão principal após testes e integração das branches.