# Portal Unificado WillAI — implantação segura

A branch **feature/portal-unificado** não altera a produção até a revisão e integração.
Preserva `/studio/`, páginas anteriores como `/plurita`, cadastro `public.willai_pages` e QR/NFC no caminho `/p/` quando o módulo for incorporado.

## Instalação no Supabase
1. Confirme o projeto `rnqaktkvwfsetbjsqdrj` e faça backup.
2. Execute `sql/20261027_willai_portal_setup.sql` pelo SQL Editor.
3. Na consulta de administrador comentada no rodapé do SQL, substitua `SEU_EMAIL_DO_AUTH` pelo email do administrador existente e execute.
4. Abra `/studio/portal/`, autentique e escolha **Publicar alterações**.
5. Imagens enviadas pelo editor vão para o bucket público `willai-public`, já utilizado pelo Studio, com subpasta exclusiva do usuário.

## Rotas
- `/`: site institucional WillAI, serviços e preços editáveis.
- `/projeto`: iniciativa principal.
- `/curitiba`, `/pinhais`: projeto por cidade (cidades adicionais editáveis).
- `/pagina/<slug>`: páginas personalizadas.
- `/<cidade>/<slug-da-empresa>`: página da empresa no cadastro atual, com suporte ao endereço antigo `/<slug-da-empresa>`.
- `/login`: acesso ao editor institucional; `/studio/` continua com login e edição de empresas.
- `/studio/portal/`: editor do site institucional, restrito ao administrador autorizado.
- `/p/<codigo>`: módulo de plaquinhas (branch própria; não apontar plaquinhas de produção a domínio ainda indefinido).

## Testes antes de mesclar no main
Abra Preview do Cloudflare Pages para branch de integração. Confirme rotas, imagens, links, login, gravacao autorizada no Supabase e pagina de empresa. Depois mescle para main. Nao publique arquivos SQL como codigo executavel e nunca compartilhe service_role no navegador.

## Limites desta etapa
A estrutura existente do Studio mantém sua própria sessão de login. As credenciais sao as mesmas do Supabase Auth, mas ainda não há sessão unica compartilhada com o editor de empresas. QR/NFC é um módulo paralelo ainda pendente de validação em produção.
