WILLAI STUDIO — DOIS MODELOS, UM SITE, UM BANCO (v2)

Arquitetura
- Cloudflare Pages hospeda /studio e páginas públicas /plurita, /empresa-2 etc.
- Supabase mantém as empresas, configurações publicadas e imagens.
- n8n não é obrigatório: Publicar faz upsert diretamente no Supabase.
- Cada empresa tem slug único. Um único link é permanente enquanto o slug não for alterado.

PASSO 1 — SUPABASE
Use somente o projeto rnqaktkvwfsetbjsqdrj, já configurado em config.js.
Abra https://supabase.com/dashboard/project/rnqaktkvwfsetbjsqdrj/sql/new
Execute supabase_setup.sql (não execute em outro projeto).
Authentication > Users: crie usuário administrador com e-mail e senha (Add user).
Recomenda-se desativar cadastros abertos (Authentication > Providers > Email) conforme o uso.
O RLS impede que um usuário altere empresas de outro usuário.

PASSO 2 — GITHUB
Crie repositório 'willai-studio' separado dos projetos existentes.
Envie os arquivos deste diretório para a raiz do repositório, incluindo:
index.html, studio/index.html, studio/cloud.js, config.js, assets/*, _redirects.
Use repositório privado se desejar. Nunca publique senhas ou service_role.

PASSO 3 — CLOUDFLARE PAGES
Cloudflare Dashboard > Workers & Pages > Create application > Pages > Connect to Git.
Escolha o repositório willai-studio, branch main.
Para site HTML sem build: Framework None; build command exit 0 (ou deixe vazio);
Diretório de saída: / (raiz do repositório; se a interface pedir, use .).
Depois de publicar, anote o domínio real fornecido pelo Cloudflare.
Ex.: https://NOME-REAL.pages.dev (o nome só é verdadeiro após ser criado).

PASSO 4 — USAR O STUDIO
Acesse https://SEU-DOMINIO.pages.dev/studio
Login com a conta de Authentication > Users.
Crie/edite uma empresa; na seção Publicação, escolha slug (ex.: plurita).
Escolha modelo Avaliações ou Cartão Digital, clique Publicar.
Cole o domínio real do Cloudflare uma única vez e use Copiar link individual.
O visitante pode então acessar https://SEU-DOMINIO.pages.dev/plurita.
Alterações publicadas no Supabase passam a aparecer automaticamente no mesmo link.

NOTAS IMPORTANTES
- O link de avaliação Google da Plurita permanece vazio até configurar.
- O carrossel fica fixo no rodapé.
- A foto de Anderson direciona ao Instagram informado.
- O editor funciona localmente, mas a publicação remota depende da autenticação e da migração SQL.
- Não compartilhe credenciais de banco PostgreSQL nem a senha do administrador.
- Para produção, considere definir Content Security Policy, domínio próprio e backups.
